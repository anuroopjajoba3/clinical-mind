import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({ baseURL: API_BASE })

// Attach JWT token to every request
api.interceptors.request.use((config) => {
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
export function createJobStream(job_id, onData, onError) {
  const token = sessionStorage.getItem('cm_token')
  const url   = `${API_BASE}/stream/${job_id}${token ? `?token=${token}` : ''}`
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
