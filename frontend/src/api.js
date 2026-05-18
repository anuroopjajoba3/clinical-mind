import axios from 'axios'

// Resolved lazily — fetches from /api/config on first use so the tunnel URL
// can change without a Vercel redeploy
let _apiBase = null

async function getApiBase() {
  if (_apiBase) return _apiBase
  try {
    const res = await fetch('/api/config')
    const { apiUrl } = await res.json()
    _apiBase = apiUrl
  } catch {
    _apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  }
  return _apiBase
}

// For SSE which needs the URL synchronously — resolved after first API call
export function getCurrentApiBase() {
  return _apiBase || import.meta.env.VITE_API_URL || 'http://localhost:8000'
}

const api = axios.create({
  headers: { 'ngrok-skip-browser-warning': 'true' },
})

// Resolve baseURL before every request
api.interceptors.request.use(async (config) => {
  config.baseURL = await getApiBase()
  const token = sessionStorage.getItem('cm_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auth helpers
export const authAPI = {
  register: (email, password, full_name) =>
    api.post('/auth/register', { email, password, full_name }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
}

// Research helpers
export const researchAPI = {
  start:   (question, fhir_patient_id = null) =>
    api.post('/research', { question, ...(fhir_patient_id ? { fhir_patient_id } : {}) }),
  status:  (job_id)   => api.get(`/status/${job_id}`),
  history: ()         => api.get('/history'),
}

// SSE stream factory
export async function createJobStream(job_id, onData, onError) {
  const base  = await getApiBase()
  const token = sessionStorage.getItem('cm_token')
  const url   = `${base}/stream/${job_id}${token ? `?token=${token}` : ''}`
  const es    = new EventSource(url)

  es.onmessage = (e) => {
    try { onData(JSON.parse(e.data)) } catch (_) {}
  }
  es.onerror = (e) => {
    onError?.(e)
    es.close()
  }
  return es
}

export default api
