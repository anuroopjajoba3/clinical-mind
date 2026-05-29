import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, CheckCircle, Clock, RefreshCw, User,
  Phone, Activity, ChevronRight, X, Plus, Loader2,
} from 'lucide-react'
import { dischargeAPI } from '../api'

// ── Risk tier config ───────────────────────────────────────────────
const TIER = {
  high:   { label: 'High Risk',   bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    dot: 'bg-red-500'    },
  medium: { label: 'Medium Risk', bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  low:    { label: 'Low Risk',    bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
}

const OUTCOME_COLOR = {
  well:        'text-emerald-600',
  concerning:  'text-amber-600',
  urgent:      'text-red-600',
  no_answer:   'text-slate-400',
}

// ── Sparkline (7-day trend) ────────────────────────────────────────
function RiskSparkline({ history }) {
  if (!history || history.length < 2) return null
  const vals  = history.map(h => h.risk_score)
  const max   = Math.max(...vals, 0.01)
  const W = 56, H = 20
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W
    const y = H - (v / max) * H
    return `${x},${y}`
  }).join(' ')
  const last = vals[vals.length - 1]
  const color = last >= 0.65 ? '#EF4444' : last >= 0.35 ? '#F59E0B' : '#10B981'
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Enroll Modal ───────────────────────────────────────────────────
function EnrollModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    fhir_patient_id: '',
    discharge_date: new Date().toISOString().split('T')[0],
    primary_diagnosis: '',
    discharge_summary: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await dischargeAPI.enroll(form)
      onSuccess(res.data)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Enrollment failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-sans text-lg font-bold text-slate-900">Enroll discharged patient</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">FHIR Patient ID</label>
            <input
              required
              value={form.fhir_patient_id}
              onChange={e => setForm(f => ({ ...f, fhir_patient_id: e.target.value }))}
              placeholder="e.g. patient-001"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 font-sans text-sm text-slate-900 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
          <div>
            <label className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Discharge date</label>
            <input
              required
              type="date"
              value={form.discharge_date}
              onChange={e => setForm(f => ({ ...f, discharge_date: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 font-sans text-sm text-slate-900 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
          <div>
            <label className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Primary diagnosis</label>
            <input
              required
              value={form.primary_diagnosis}
              onChange={e => setForm(f => ({ ...f, primary_diagnosis: e.target.value }))}
              placeholder="e.g. HFrEF, COPD exacerbation"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 font-sans text-sm text-slate-900 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
          <div>
            <label className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Discharge summary <span className="normal-case font-normal">(optional)</span></label>
            <textarea
              rows={3}
              value={form.discharge_summary}
              onChange={e => setForm(f => ({ ...f, discharge_summary: e.target.value }))}
              placeholder="Key notes from attending physician..."
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 font-sans text-sm text-slate-900 focus:outline-none focus:border-teal-500 transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="font-sans text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#0E7490] hover:bg-[#0E7490]/90 disabled:opacity-60 text-white font-sans text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={14} className="animate-spin" /> Running risk assessment...</> : 'Enroll patient'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

// ── Risk Detail Panel ──────────────────────────────────────────────
function RiskPanel({ enrollmentId, patient, onClose }) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await dischargeAPI.risk(enrollmentId)
      setData(res.data)
    } catch (_) {}
    finally { setLoading(false) }
  }, [enrollmentId])

  useEffect(() => { load() }, [load])

  const refresh = async () => {
    setRefreshing(true)
    try {
      await dischargeAPI.refreshRisk(enrollmentId)
      await load()
    } finally { setRefreshing(false) }
  }

  const tier = TIER[data?.current_risk_tier] || TIER.medium

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-slate-400">Discharge risk</p>
            <p className="font-sans text-base font-bold text-slate-900">{patient}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={refreshing}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-slate-300" />
            </div>
          ) : !data ? (
            <p className="font-sans text-sm text-slate-400 text-center py-8">No risk data available.</p>
          ) : (
            <>
              {/* Risk score */}
              <div className={`rounded-xl p-4 border ${tier.bg} ${tier.border} flex items-center justify-between`}>
                <div>
                  <p className={`font-sans text-[11px] font-bold uppercase tracking-wider ${tier.text} mb-1`}>{tier.label}</p>
                  <p className={`font-sans text-3xl font-extrabold ${tier.text}`}>
                    {Math.round((data.current_risk_score || 0) * 100)}%
                  </p>
                  <p className="font-sans text-xs text-slate-500 mt-1">30-day readmission probability</p>
                </div>
                <RiskSparkline history={data.history} />
              </div>

              {/* Risk flags */}
              {data.latest?.risk_flags?.length > 0 && (
                <div>
                  <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Risk flags</p>
                  <div className="space-y-2">
                    {data.latest.risk_flags.map((f, i) => (
                      <div key={i} className="flex gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <AlertTriangle size={13} className={
                          f.severity === 'high' ? 'text-red-500 flex-shrink-0 mt-0.5' :
                          f.severity === 'medium' ? 'text-amber-500 flex-shrink-0 mt-0.5' :
                          'text-slate-400 flex-shrink-0 mt-0.5'
                        } />
                        <div>
                          <p className="font-sans text-xs font-semibold text-slate-900">{f.flag}</p>
                          <p className="font-sans text-[11px] text-slate-500 mt-0.5">{f.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended actions */}
              {data.latest?.recommended_actions?.length > 0 && (
                <div>
                  <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Recommended actions</p>
                  <div className="space-y-2">
                    {data.latest.recommended_actions.map((a, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-teal-50 border border-teal-100">
                        <CheckCircle size={13} className="text-teal-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-sans text-xs text-slate-900">{a.action}</p>
                        </div>
                        <span className={`font-sans text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          a.urgency === 'immediate' ? 'bg-red-100 text-red-700' :
                          a.urgency === 'within_48h' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {a.urgency?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Agent reasoning */}
              {data.latest?.reasoning && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Clinical reasoning</p>
                  <p className="font-sans text-xs text-slate-600 leading-relaxed">{data.latest.reasoning}</p>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────
export default function DischargeDashboard() {
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading]         = useState(true)
  const [filterTier, setFilterTier]   = useState('all')
  const [showEnroll, setShowEnroll]   = useState(false)
  const [riskPanel, setRiskPanel]     = useState(null)  // { id, name }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = filterTier !== 'all' ? { risk_tier: filterTier, status: 'active' } : { status: 'active' }
      const res = await dischargeAPI.dashboard(params)
      setEnrollments(res.data.enrollments || [])
    } catch (_) {}
    finally { setLoading(false) }
  }, [filterTier])

  useEffect(() => { load() }, [load])

  const stats = {
    total:  enrollments.length,
    high:   enrollments.filter(e => e.risk_tier === 'high').length,
    medium: enrollments.filter(e => e.risk_tier === 'medium').length,
    low:    enrollments.filter(e => e.risk_tier === 'low').length,
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 min-h-0">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-teal-600 mb-1">Post-Discharge Monitoring</p>
            <h1 className="font-sans text-2xl font-extrabold text-slate-900">Hospital Dashboard</h1>
            <p className="font-sans text-sm text-slate-500 mt-1">Active 30-day monitoring enrollments · AI risk updated daily</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-colors"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowEnroll(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#0E7490] hover:bg-[#0E7490]/90 text-white font-sans text-sm font-semibold rounded-xl transition-colors"
            >
              <Plus size={14} />
              Enroll patient
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Enrolled',    value: stats.total,  color: 'text-slate-900' },
            { label: 'High risk',   value: stats.high,   color: 'text-red-600'   },
            { label: 'Medium risk', value: stats.medium, color: 'text-amber-600' },
            { label: 'Low risk',    value: stats.low,    color: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4">
              <p className={`font-sans text-2xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="font-sans text-xs text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-5 bg-white border border-slate-200 rounded-xl p-1 w-fit">
          {['all', 'high', 'medium', 'low'].map(tier => (
            <button
              key={tier}
              onClick={() => setFilterTier(tier)}
              className={`px-4 py-1.5 rounded-lg font-sans text-xs font-semibold transition-colors capitalize ${
                filterTier === tier
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tier === 'all' ? 'All patients' : `${tier} risk`}
            </button>
          ))}
        </div>

        {/* Patient list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-slate-300" />
          </div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-20">
            <Activity size={32} className="mx-auto text-slate-200 mb-3" />
            <p className="font-sans text-sm text-slate-400">No active enrollments{filterTier !== 'all' ? ` for ${filterTier} risk` : ''}.</p>
            <button
              onClick={() => setShowEnroll(true)}
              className="mt-4 font-sans text-sm text-teal-600 hover:text-teal-700 font-semibold"
            >
              + Enroll first patient
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {enrollments.map((e, i) => {
              const tier = TIER[e.risk_tier] || TIER.medium
              return (
                <motion.div
                  key={e.enrollment_id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Risk dot */}
                    <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${tier.dot}`} />

                    {/* Patient info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-sans text-[15px] font-bold text-slate-900">{e.patient_name}</p>
                          {e.mrn && <p className="font-sans text-[11px] text-slate-400 mt-0.5">MRN {e.mrn}</p>}
                        </div>
                        <span className={`font-sans text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full flex-shrink-0 border ${tier.bg} ${tier.border} ${tier.text}`}>
                          {tier.label}
                        </span>
                      </div>

                      <p className="font-sans text-[12px] text-slate-600 mt-1.5">{e.primary_diagnosis}</p>

                      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Clock size={10} />
                          Discharged {e.discharge_date ? new Date(e.discharge_date).toLocaleDateString() : '—'}
                        </span>
                        {e.coordinator && (
                          <span className="flex items-center gap-1.5">
                            <User size={10} />
                            {e.coordinator}
                          </span>
                        )}
                        {e.last_checkin && (
                          <span className="flex items-center gap-1.5">
                            <Phone size={10} />
                            Last check-in{' '}
                            {new Date(e.last_checkin).toLocaleDateString()}
                            {e.last_outcome && (
                              <span className={`font-semibold ${OUTCOME_COLOR[e.last_outcome] || ''}`}>
                                · {e.last_outcome}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action */}
                    <button
                      onClick={() => setRiskPanel({ id: e.enrollment_id, name: e.patient_name })}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 font-sans text-xs font-semibold text-slate-600 transition-colors flex-shrink-0"
                    >
                      View risk <ChevronRight size={12} />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showEnroll && (
          <EnrollModal
            onClose={() => setShowEnroll(false)}
            onSuccess={() => { setShowEnroll(false); load() }}
          />
        )}
        {riskPanel && (
          <RiskPanel
            enrollmentId={riskPanel.id}
            patient={riskPanel.name}
            onClose={() => setRiskPanel(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
