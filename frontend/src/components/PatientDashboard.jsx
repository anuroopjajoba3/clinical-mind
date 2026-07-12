import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Activity, AlertCircle,
  ChevronRight, TrendingUp, TrendingDown, Minus, Clock, FileText, Search,
} from 'lucide-react'
import api from '../api'

function age(dob) {
  if (!dob) return null
  return Math.floor((Date.now() - new Date(dob)) / (365.25 * 864e5))
}

function formatDate(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return d }
}

function timeAgo(d) {
  if (!d) return null
  const diff = Date.now() - new Date(d)
  const hours = Math.floor(diff / 36e5)
  if (hours < 1) return 'just now'
  if (hours < 24) return `about ${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

function TrendIcon({ direction }) {
  if (direction === 'rising')  return <TrendingUp  className="w-4 h-4 text-red-500" />
  if (direction === 'falling') return <TrendingDown className="w-4 h-4 text-emerald-500" />
  return <Minus className="w-4 h-4 text-slate-400" />
}

function StatCard({ label, value, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white border border-[#E8E4DC] rounded-xl p-5 shadow-sm"
    >
      <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-[#888] mb-2">{label}</p>
      <p className="font-serif text-4xl font-bold text-ink">{value ?? '—'}</p>
    </motion.div>
  )
}

function RiskBadge({ level }) {
  if (!level) return null
  if (level === 'critical') return (
    <span className="text-xs font-bold px-2.5 py-1 rounded bg-red-500 text-white uppercase tracking-wide">
      Critical
    </span>
  )
  if (level === 'watch') return (
    <span className="text-xs font-bold px-2.5 py-1 rounded bg-amber-500 text-white uppercase tracking-wide">
      Watch
    </span>
  )
  return (
    <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-500 text-white uppercase tracking-wide">
      Stable
    </span>
  )
}

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase()
  const cls = s === 'chronic'
    ? 'border border-slate-300 text-slate-600'
    : s === 'active'
    ? 'border border-blue-300 text-blue-700'
    : 'border border-slate-200 text-slate-500'
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${cls}`}>
      {status}
    </span>
  )
}

function InsightRow({ insight, onClick }) {
  return (
    <button
      onClick={() => onClick?.(insight)}
      className="w-full flex items-start gap-3 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 -mx-1 px-1 rounded transition-colors text-left"
    >
      <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 truncate">{insight.question}</p>
        <p className="text-xs text-slate-400 mt-0.5">{formatDate(insight.created_at)}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
    </button>
  )
}

export default function PatientDashboard({ patient, onOpenInsight, onSearchEvidence }) {
  const [detail,   setDetail]   = useState(null)
  const [insights, setInsights] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!patient?.fhir_id) return
    setLoading(true)
    setDetail(null)
    setInsights([])
    Promise.all([
      api.get(`/patients/${patient.fhir_id}`),
      api.get(`/patients/${patient.fhir_id}/insights?limit=5`),
    ]).then(([detailRes, insightRes]) => {
      setDetail(detailRes.data)
      setInsights(insightRes.data.insights || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [patient?.fhir_id])

  if (!patient) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center mb-4">
          <Activity className="w-6 h-6 text-slate-300" />
        </div>
        <p className="text-base font-medium text-slate-500">Select a patient</p>
        <p className="text-sm text-slate-400 mt-1">Choose from the list to view their clinical record</p>
      </div>
    )
  }

  const a           = age(patient.birth_date)
  const riskLevel   = patient.risk?.level
  const conditions  = detail?.conditions  || []
  const medications = detail?.medications || []
  const labs        = detail?.labs        || []
  // API returns allergies as objects ({display, status, ...}) — normalise to strings
  const allergies   = (detail?.allergies || patient.allergies || [])
    .map(al => (typeof al === 'string' ? al : al?.display))
    .filter(Boolean)
  const synced      = timeAgo(detail?.synced_at)

  const genderDisplay = patient.gender
    ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)
    : null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="flex-1 overflow-y-auto bg-gradient-to-b from-[#FAF8F4] to-[#F4F0E8]"
    >
      <div className="bg-white/90 backdrop-blur-sm border-b border-[#E8E4DC] px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-serif text-3xl font-bold text-ink">{patient.full_name}</h1>
              <RiskBadge level={riskLevel} />
            </div>
            <p className="text-sm text-slate-600">
              {[
                a ? `${a} years old` : null,
                genderDisplay,
                patient.birth_date ? `DOB: ${patient.birth_date}` : null,
                patient.mrn ? `MRN: ${patient.mrn}` : null,
              ].filter(Boolean).join('  •  ')}
            </p>
            {synced && (
              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last synced {synced}
              </p>
            )}
          </div>
          {onSearchEvidence && (
            <button
              onClick={onSearchEvidence}
              className="flex items-center gap-2 px-4 py-2.5 bg-ink hover:opacity-90
                         text-white text-sm font-semibold rounded-lg transition-opacity flex-shrink-0"
            >
              <Search className="w-4 h-4" />
              Search Evidence
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="px-8 py-6 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-xl bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="px-8 py-6 space-y-6">

          {/* Stat row */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Conditions"       value={conditions.length} index={0} />
            <StatCard label="Medications"      value={medications.length} index={1} />
            <StatCard label="Lab Results"      value={labs.length} index={2} />
            <StatCard label="Evidence Queries" value={insights.length} index={3} />
          </div>

          {/* Allergies */}
          {allergies.length > 0 && (
            <div className="flex items-start gap-3 px-5 py-4 rounded-xl border border-red-200 bg-red-50">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 mb-0.5">
                  Allergies ({allergies.length})
                </p>
                <p className="text-sm text-red-600">
                  {allergies.join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Conditions + Medications */}
          <div className="grid grid-cols-2 gap-4">

            {/* Conditions */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-sm font-semibold text-slate-900 mb-4">Active Conditions</p>
              {conditions.length === 0 ? (
                <p className="text-sm text-slate-400">None recorded</p>
              ) : (
                <div className="space-y-4">
                  {conditions.slice(0, 6).map((c, i) => (
                    <div key={i} className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{c.display || c.name}</p>
                        {c.code && (
                          <p className="text-xs text-slate-400 mt-0.5">Code: {c.code}</p>
                        )}
                        {(c.onset || c.date) && (
                          <p className="text-xs text-slate-400">Onset: {c.onset || c.date}</p>
                        )}
                      </div>
                      {c.status && <StatusBadge status={c.status} />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Medications */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-sm font-semibold text-slate-900 mb-4">Current Medications</p>
              {medications.length === 0 ? (
                <p className="text-sm text-slate-400">None recorded</p>
              ) : (
                <div className="space-y-4">
                  {medications.slice(0, 6).map((m, i) => (
                    <div key={i} className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{m.display || m.name}</p>
                        {(m.dose || m.date) && (
                          <p className="text-xs text-slate-400 mt-0.5">{m.dose || `Started ${m.date}`}</p>
                        )}
                      </div>
                      {m.status && <StatusBadge status={m.status} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Labs */}
          {labs.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-sm font-semibold text-slate-900 mb-4">
                Recent Lab Results
                <span className="text-slate-400 font-normal ml-2">{labs.length} results</span>
              </p>
              <div className="space-y-3">
                {labs.slice(0, 6).map((lab, i) => (
                  <div key={i} className="flex items-center gap-3 py-1 border-b border-slate-100 last:border-0">
                    <TrendIcon direction={lab.direction} />
                    <span className="text-sm text-slate-700 flex-1">{lab.display || lab.name}</span>
                    <span className="text-sm font-semibold text-slate-900 tabular-nums">{lab.value}</span>
                    {lab.date && (
                      <span className="text-xs text-slate-400">{formatDate(lab.date)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence query history */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-slate-900 mb-1">
              Evidence Query History
              <span className="text-slate-400 font-normal ml-2">{insights.length} queries</span>
            </p>
            {insights.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-slate-400">No evidence searches yet for this patient.</p>
                {onSearchEvidence && (
                  <button
                    onClick={onSearchEvidence}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Run your first search →
                  </button>
                )}
              </div>
            ) : (
              insights.map((ins, i) => (
                <InsightRow key={i} insight={ins} onClick={onOpenInsight} />
              ))
            )}
          </div>

        </div>
      )}
    </motion.div>
  )
}
