// Vercel serverless function — returns the current backend URL
// stored in Upstash so the frontend never needs a rebuild when the tunnel changes
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const restUrl   = process.env.UPSTASH_REDIS_REST_URL
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!restUrl || !restToken) {
    // Fall back to VITE_API_URL if Upstash isn't configured
    return res.json({ apiUrl: process.env.VITE_API_URL || 'http://localhost:8000' })
  }

  try {
    const response = await fetch(`${restUrl}/get/backend_url`, {
      headers: { Authorization: `Bearer ${restToken}` },
    })
    const data = await response.json()
    const apiUrl = data.result || process.env.VITE_API_URL || 'http://localhost:8000'
    res.json({ apiUrl })
  } catch {
    res.json({ apiUrl: process.env.VITE_API_URL || 'http://localhost:8000' })
  }
}
