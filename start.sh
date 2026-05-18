#!/bin/bash
# ClinicalMind — start local stack and auto-update Upstash with tunnel URL
# Usage: ./start.sh
# Requires: UPSTASH_REST_URL and UPSTASH_REST_TOKEN in backend/.env

set -e

cd "$(dirname "$0")"

# Load env vars
export $(grep -v '^#' backend/.env | xargs)

if [ -z "$UPSTASH_REDIS_REST_URL" ] || [ -z "$UPSTASH_REDIS_REST_TOKEN" ]; then
  echo "❌  Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to backend/.env first"
  exit 1
fi

echo "🚀  Starting ClinicalMind..."

# Start cloudflared in background, capture log
rm -f /tmp/cf-tunnel.log
cloudflared tunnel --url http://localhost:8000 --no-autoupdate 2>/tmp/cf-tunnel.log &
CF_PID=$!

# Wait up to 30s for tunnel URL
echo "⏳  Waiting for tunnel..."
TUNNEL_URL=""
for i in $(seq 1 30); do
  TUNNEL_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' /tmp/cf-tunnel.log 2>/dev/null | head -1)
  [ -n "$TUNNEL_URL" ] && break
  sleep 1
done

if [ -z "$TUNNEL_URL" ]; then
  echo "❌  Could not get tunnel URL. Check cloudflared is installed."
  kill $CF_PID 2>/dev/null
  exit 1
fi

echo "✅  Tunnel: $TUNNEL_URL"

# Push URL to Upstash so frontend picks it up without Vercel redeploy
curl -s -X POST "$UPSTASH_REDIS_REST_URL/set/backend_url" \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" \
  -H "Content-Type: application/json" \
  -d "[\"backend_url\", \"$TUNNEL_URL\"]" > /dev/null

echo "✅  Upstash updated — frontend will use new URL automatically"
echo ""
echo "  Backend:  $TUNNEL_URL"
echo "  Frontend: https://clinical-mind-eight.vercel.app"
echo ""

# Copy URL to clipboard
echo -n "$TUNNEL_URL" | pbcopy && echo "📋  URL copied to clipboard"

echo ""
echo "Starting uvicorn and celery... (Ctrl+C to stop all)"
echo ""

# Start celery worker in background
cd backend
python3 -m celery -A worker worker --loglevel=warning &
CELERY_PID=$!

# Trap Ctrl+C to clean up all processes
trap "echo ''; echo 'Stopping...'; kill $CF_PID $CELERY_PID 2>/dev/null; exit 0" INT TERM

# Start uvicorn in foreground
uvicorn main:app --port 8000
