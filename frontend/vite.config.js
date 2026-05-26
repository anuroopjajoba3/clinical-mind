import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BACKEND = process.env.VITE_API_URL || 'http://127.0.0.1:8001'

const proxy = {
  '/auth':     BACKEND,
  '/research': BACKEND,
  '/status':   BACKEND,
  '/history':  BACKEND,
  '/compare':  BACKEND,
  '/report':   BACKEND,
  '/fhir':     BACKEND,
  '/patients': BACKEND,
  '/health':   BACKEND,
  '/metrics':  BACKEND,
  '/stream':   { target: BACKEND, changeOrigin: true },
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    proxy,
  },
  preview: { proxy },
})
