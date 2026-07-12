import axios, { AxiosResponse } from 'axios'

// ── Shared API types ────────────────────────────────────────────────

export interface SessionEntry {
  question: string
  answer: string
}

export interface HealthStatus {
  online: boolean
  degraded?: boolean
  checks?: Record<string, string>
}

export interface CheckinBody {
  method?: string
  outcome?: string
  notes?: string | null
  vitals_reported?: Record<string, unknown> | null
  escalated?: boolean
}

export interface EnrollBody {
  fhir_patient_id: string
  discharge_date: string
  primary_diagnosis: string
  discharge_summary?: string
  discharge_meds?: Array<Record<string, unknown>>
  coordinator_id?: string
}

// ── API base resolution ─────────────────────────────────────────────

let _apiBase: string | null = null

async function getApiBase(): Promise<string> {
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
  return _apiBase!
}

export function getCurrentApiBase(): string {
  if (_apiBase !== null) return _apiBase
  if (import.meta.env.DEV) return ''
  return import.meta.env.VITE_API_URL || ''
}

export async function checkApiHealth(): Promise<HealthStatus> {
  const tryHealth = async (baseURL: string | null): Promise<HealthStatus> => {
    const client = baseURL ? axios.create({ baseURL, timeout: 8000 }) : api
    const res = await client.get('/health', {
      validateStatus: (s: number) => s === 200 || s === 503,
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

export function formatApiError(err: any): string {
  if (!err.response) {
    return 'Cannot reach the API. From project root: docker compose up — API runs on port 8001 (8000 may be in use by another app).'
  }
  const { status, data } = err.response
  const detail = data?.detail

  if (status === 404) {
    return 'API endpoint not found. Ensure the ClinicalMind backend is running (default port 8001).'
  }
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((e: any) => e.msg || `${e.loc?.slice(-1)[0] || 'field'}: ${e.type}`)
      .join('. ')
  }
  return data?.message || `Request failed (${status})`
}

// ── Axios instance ──────────────────────────────────────────────────

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
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      sessionStorage.removeItem('cm_token')
      if (window.location.pathname.startsWith('/app')) {
        window.location.reload()
      }
    }
    return Promise.reject(err)
  },
)

// ── Endpoint groups ─────────────────────────────────────────────────

export const authAPI = {
  register: (email: string, password: string, full_name: string): Promise<AxiosResponse> =>
    api.post('/auth/register', { email, password, full_name }),
  login: (email: string, password: string): Promise<AxiosResponse> =>
    api.post('/auth/login', { email, password }),
  me: (): Promise<AxiosResponse> => api.get('/auth/me'),
}

export const researchAPI = {
  start: (
    question: string,
    fhir_patient_id: string | null = null,
    session_history: SessionEntry[] | null = null,
  ): Promise<AxiosResponse> =>
    api.post('/research', {
      question,
      ...(fhir_patient_id ? { fhir_patient_id } : {}),
      ...(session_history?.length ? { session_history } : {}),
    }),
  status: (job_id: string): Promise<AxiosResponse> => api.get(`/status/${job_id}`),
  history: (): Promise<AxiosResponse> => api.get('/history'),
}

export const compareAPI = {
  start: (
    question_a: string,
    question_b: string,
    fhir_patient_id: string | null = null,
  ): Promise<AxiosResponse> =>
    api.post('/compare', {
      question_a,
      question_b,
      ...(fhir_patient_id ? { fhir_patient_id } : {}),
    }),
  status: (compare_id: string): Promise<AxiosResponse> => api.get(`/compare/${compare_id}`),
}

export const dischargeAPI = {
  enroll: (body: EnrollBody): Promise<AxiosResponse> => api.post('/discharge/enroll', body),
  dashboard: (params: Record<string, string> = {}): Promise<AxiosResponse> =>
    api.get('/discharge/dashboard', { params }),
  risk: (enrollmentId: string): Promise<AxiosResponse> =>
    api.get(`/discharge/${enrollmentId}/risk`),
  checkin: (enrollmentId: string, body: CheckinBody): Promise<AxiosResponse> =>
    api.post(`/discharge/${enrollmentId}/checkin`, body),
  refreshRisk: (enrollmentId: string): Promise<AxiosResponse> =>
    api.post(`/discharge/${enrollmentId}/refresh-risk`),
}

// ── SSE stream ──────────────────────────────────────────────────────

export function createJobStream(
  job_id: string,
  onData: (data: any) => void,
  onError?: (e: Event) => void,
): EventSource {
  const base  = getCurrentApiBase()
  const token = sessionStorage.getItem('cm_token')
  const prefix = base || (typeof window !== 'undefined' ? window.location.origin : '')
  const url   = `${prefix}/stream/${job_id}${token ? `?token=${token}` : ''}`
  const es    = new EventSource(url)

  es.onmessage = (e: MessageEvent) => {
    try { onData(JSON.parse(e.data)) } catch { /* ignore malformed frames */ }
  }
  es.onerror = (e: Event) => {
    onError?.(e)
    es.close()
  }
  return es
}

export default api
