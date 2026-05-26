import axios from 'axios'

let _apiBase = null

async function getApiBase() {
  if (_apiBase !== null) return _apiBase

  if (import.meta.env.DEV) {
    _apiBase = ''
    return _apiBase
  }

  try {
    const res = await fetch('/api/config')
    if (!res.ok) throw new Error('config unavailable')
    const { apiUrl } = await res.json()
    _apiBase = apiUrl || import.meta.env.VITE_API_URL || ''
  } catch {
    _apiBase = import.meta.env.VITE_API_URL || ''
  }
  return _apiBase
}

export function getCurrentApiBase() {
  if (_apiBase !== null) return _apiBase
  if (import.meta.env.DEV) return ''
  return import.meta.env.VITE_API_URL || ''
}

export async function checkApiHealth() {
  const tryHealth = async (baseURL) => {
    const client = baseURL ? axios.create({ baseURL, timeout: 8000 }) : api
    const res = await client.get('/health', {
      validateStatus: s => s === 200 || s === 503,
    })
    return {
      online: true,
      degraded: res.data?.status === 'degraded',
      checks: res.data?.checks || {},
    }
  }

  try {
    return await tryHealth(null)
  } catch {
    const direct = import.meta.env.VITE_API_URL
    if (import.meta.env.DEV && direct) {
      try {
        const result = await tryHealth(direct)
        _apiBase = direct
        return result
      } catch {
        return { online: false }
      }
    }
    return { online: false }
  }
}

export function formatApiError(err) {
  if (!err.response) {
    return 'Cannot reach the API. From project root: docker compose up — API runs on port 8001 (8000 may be in use by another app).'
  }
  const { status, data } = err.response
  const detail = data?.detail

  if (status === 404) {
    return 'API endpoint not found. Ensure the ClinicalMed backend is running on port 8000.'
  }
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map(e => e.msg || `${e.loc?.slice(-1)[0] || 'field'}: ${e.type}`).join('. ')
  }
  return data?.message || `Request failed (${status})`
}

const api = axios.create({
  headers: { 'ngrok-skip-browser-warning': 'true' },
})

api.interceptors.request.use(async (config) => {
  config.baseURL = await getApiBase()
  const token = sessionStorage.getItem('cm_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      sessionStorage.removeItem('cm_token')
      if (window.location.pathname.startsWith('/app')) {
        window.location.reload()
      }
    }
    return Promise.reject(err)
  },
)

export const authAPI = {
  register: (email, password, full_name) =>
    api.post('/auth/register', { email, password, full_name }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
}

export const researchAPI = {
  start: (question, fhir_patient_id = null, session_history = null) =>
    api.post('/research', {
      question,
      ...(fhir_patient_id ? { fhir_patient_id } : {}),
      ...(session_history?.length ? { session_history } : {}),
    }),
  status:  (job_id)   => api.get(`/status/${job_id}`),
  history: ()         => api.get('/history'),
}

export const compareAPI = {
  start: (question_a, question_b, fhir_patient_id = null) =>
    api.post('/compare', {
      question_a,
      question_b,
      ...(fhir_patient_id ? { fhir_patient_id } : {}),
    }),
  status: (compare_id) => api.get(`/compare/${compare_id}`),
}

export function createJobStream(job_id, onData, onError) {
  const base  = getCurrentApiBase()
  const token = sessionStorage.getItem('cm_token')
  const prefix = base || (typeof window !== 'undefined' ? window.location.origin : '')
  const url   = `${prefix}/stream/${job_id}${token ? `?token=${token}` : ''}`
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
