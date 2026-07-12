/**
 * PatientDetailPanel.jsx
 * Slide-in drawer showing a patient's complete clinical record.
 * Data: GET /patients/:fhir_id  →  { conditions, medications, labs, allergies, encounters }
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, User, Activity, Pill, FlaskConical, AlertCircle,
  Calendar, Clock, ChevronDown, ChevronUp, Stethoscope, RefreshCw, FileText,
} from 'lucide-react'
import api from '../api'
import LabTrendChart from './LabTrendChart'
import PatientWorkspace from './PatientWorkspace'

// ── helpers ─────────────────────────────────────────────────────────

function age(birthDate) {
  if (!birthDate) return '?'
  return Math.floor((Date.now() - new Date(birthDate)) / (365.25 * 24 * 3600 * 1000))
}

function formatDate(d) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }
  catch { return d }
}

// ── tiny badge components ────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    active:    'bg-emerald-100 text-emerald-700 border-emerald-200',
    resolved:  'bg-slate-100 text-slate-600 border-slate-200',
    inactive:  'bg-slate-100 text-slate-500 border-slate-200',
    confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
    unknown:   'bg-slate-100 text-slate-500 border-slate-200',
    final:     'bg-emerald-100 text-emerald-700 border-emerald-200',
    finished:  'bg-slate-100 text-slate-600 border-slate-200',
  }
  const cls = map[status?.toLowerCase()] ?? 'bg-slate-100 text-slate-500 border-slate-200'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {status ?? 'unknown'}
    </span>
  )
}

function CriticalityBadge({ criticality }) {
  const map = {
    high:              'bg-red-100 text-red-700 border-red-200',
    'unable-to-assess': 'bg-amber-100 text-amber-700 border-amber-200',
    low:               'bg-yellow-100 text-yellow-700 border-yellow-200',
  }
  const cls = map[criticality] ?? 'bg-slate-100 text-slate-500 border-slate-200'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {criticality ?? '—'}
    </span>
  )
}

// ── section wrapper ──────────────────────────────────────────────────

function Section({ icon: Icon, title, color, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 ${color} rounded-lg flex items-center justify-center`}>
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-800">{title}</span>
          {count !== undefined && (
            <span className="text-xs text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded-full">{count}</span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── sub-panels ───────────────────────────────────────────────────────

function ConditionsPanel({ conditions }) {
  if (!conditions?.length)
    return <p className="text-xs text-slate-400 italic">No conditions recorded</p>

  return conditions.map((c, i) => (
    <div key={i} className="flex items-start justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{c.display}</p>
        {c.code && <p className="text-xs text-slate-400 font-mono">{c.code}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {c.date && (
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />{formatDate(c.date)}
          </span>
        )}
        <StatusBadge status={c.status} />
      </div>
    </div>
  ))
}

function MedicationsPanel({ medications }) {
  if (!medications?.length)
    return <p className="text-xs text-slate-400 italic">No medications recorded</p>

  return medications.map((m, i) => (
    <div key={i} className="flex items-start justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">{m.display}</p>
        {m.code && <p className="text-xs text-slate-400 font-mono">{m.code}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {m.date && (
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />{formatDate(m.date)}
          </span>
        )}
        <StatusBadge status={m.status} />
      </div>
    </div>
  ))
}

function LabsPanel({ labs }) {
  return <LabTrendChart labs={labs} />
}

function AllergiesPanel({ allergies }) {
  if (!allergies?.length)
    return <p className="text-xs text-slate-400 italic">No allergies recorded</p>

  return allergies.map((a, i) => (
    <div key={i} className="flex items-start justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">{a.display}</p>
        {a.code && <p className="text-xs text-slate-400 font-mono">{a.code}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <StatusBadge status={a.status} />
      </div>
    </div>
  ))
}

function EncountersPanel({ encounters }) {
  if (!encounters?.length)
    return <p className="text-xs text-slate-400 italic">No encounters recorded</p>

  const sorted = [...encounters].sort((a, b) => (b.date || '') > (a.date || '') ? 1 : -1)
  return sorted.map((e, i) => (
    <div key={i} className="flex items-start justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">{e.display}</p>
        <p className="text-xs text-slate-400 font-mono">{e.code}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {e.date && (
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />{formatDate(e.date)}
          </span>
        )}
        <StatusBadge status={e.status} />
      </div>
    </div>
  ))
}

// ── risk intelligence panel ──────────────────────────────────────────

function RiskPanel({ risk }) {
  if (!risk) return null
  const cfg = {
    critical: { bar: 'bg-red-500',    bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-800',    label: 'Critical Risk',   icon: '🔴' },
    watch:    { bar: 'bg-amber-400',  bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-800',  label: 'Needs Attention', icon: '🟡' },
    stable:   { bar: 'bg-emerald-500',bg: 'bg-emerald-50',border: 'border-emerald-200',text: 'text-emerald-800',label: 'Stable',          icon: '🟢' },
  }[risk.level] || { bar: 'bg-slate-400', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', label: risk.level, icon: '⚪' }

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden`}>
      <div className={`h-1 w-full ${cfg.bar}`} />
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">{cfg.icon}</span>
          <span className={`text-xs font-bold uppercase tracking-wider ${cfg.text}`}>
            {cfg.label}
          </span>
          {risk.flag_count > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium border ${cfg.border} ${cfg.text}`}>
              {risk.flag_count} indicator{risk.flag_count > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <ul className="space-y-1">
          {risk.flags.map((f, i) => (
            <li key={i} className={`text-xs ${cfg.text} flex items-start gap-1.5`}>
              <span className="shrink-0 mt-0.5">·</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ── main panel ───────────────────────────────────────────────────────

function PriorReportsTab({ fhirId }) {
  const [docs,    setDocs]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!fhirId) return
    setLoading(true)
    api.get(`/fhir/patients/${fhirId}/documents`)
      .then(r => setDocs(r.data.documents || []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false))
  }, [fhirId])

  if (loading) {
    return (
      <div className="space-y-2 pt-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!docs?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <FileText className="w-5 h-5 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-600">No reports yet</p>
        <p className="text-xs text-slate-400 mt-1">
          Reports are written to the FHIR chart when a pipeline completes for this patient.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2 pt-2">
      {docs.map(doc => (
        <div
          key={doc.fhir_id}
          className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug">
              {doc.description?.replace('ClinicalMind Evidence Report — ', '') || 'Evidence Report'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {doc.date ? new Date(doc.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
            </p>
          </div>
          {doc.job_id && (
            <a
              href={`/?job=${doc.job_id}`}
              className="shrink-0 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
              title="Open report"
            >
              View ↗
            </a>
          )}
        </div>
      ))}
    </div>
  )
}

export default function PatientDetailPanel({ fhirId, onClose }) {
  const [data,      setData]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [activeTab, setActiveTab] = useState('record')  // 'record' | 'workspace' | 'reports'

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const r = await api.get(`/patients/${fhirId}`)
      setData(r.data)
    } catch {
      setError('Could not load patient details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (fhirId) load() }, [fhirId])

  return (
    // Backdrop
    <motion.div
      className="fixed inset-0 z-50 flex"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {/* Dimmed overlay */}
      <div className="flex-1 bg-black/20 backdrop-blur-sm" />

      {/* Drawer */}
      <motion.div
        className="w-full max-w-lg h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden"
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-purple-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow">
              <User className="w-5 h-5 text-white" />
            </div>
            {data ? (
              <div>
                <p className="text-base font-bold text-slate-900">{data.full_name}</p>
                <p className="text-xs text-slate-500">
                  {age(data.birth_date)} yrs · {data.gender} · MRN {data.mrn}
                </p>
              </div>
            ) : (
              <div>
                <div className="h-4 w-32 bg-slate-200 rounded animate-pulse mb-1" />
                <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-all"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Sync stamp ── */}
        {data?.synced_at && (
          <div className="px-6 py-1.5 bg-slate-50 border-b border-slate-100 shrink-0">
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Last synced {formatDate(data.synced_at?.split('T')[0])}
            </p>
          </div>
        )}

        {/* ── Tab bar ── */}
        <div className="flex border-b border-slate-200 bg-white shrink-0 px-6">
          {[
            { key: 'record',    label: 'Clinical Record' },
            { key: 'workspace', label: 'Evidence Timeline' },
            { key: 'reports',   label: 'FHIR Reports' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* ── Workspace tab ── */}
          {activeTab === 'workspace' && (
            <PatientWorkspace fhirId={fhirId} />
          )}

          {/* ── FHIR Reports tab ── */}
          {activeTab === 'reports' && (
            <PriorReportsTab fhirId={fhirId} />
          )}

          {/* ── Clinical Record tab ── */}
          {activeTab === 'record' && loading && (
            <div className="space-y-3">
              {[80, 60, 100, 50].map((w, i) => (
                <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
              ))}
            </div>
          )}

          {activeTab === 'record' && error && !loading && (
            <div className="flex items-center gap-2 p-4 bg-red-50 rounded-xl border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {activeTab === 'record' && data && !loading && (
            <>
              {/* Risk intelligence */}
              {data.risk && <RiskPanel risk={data.risk} />}

              {/* Quick stats */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Conditions', value: data.conditions?.length ?? 0, color: 'text-rose-600', bg: 'bg-rose-50' },
                  { label: 'Medications', value: data.medications?.length ?? 0, color: 'text-violet-600', bg: 'bg-violet-50' },
                  { label: 'Labs', value: data.labs?.length ?? 0, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Allergies', value: data.allergies?.length ?? 0, color: 'text-red-600', bg: 'bg-red-50' },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Conditions */}
              <Section
                icon={Activity}
                title="Conditions"
                color="bg-rose-500"
                count={data.conditions?.length}
                defaultOpen={true}
              >
                <ConditionsPanel conditions={data.conditions} />
              </Section>

              {/* Medications */}
              <Section
                icon={Pill}
                title="Medications"
                color="bg-violet-500"
                count={data.medications?.length}
                defaultOpen={true}
              >
                <MedicationsPanel medications={data.medications} />
              </Section>

              {/* Labs */}
              <Section
                icon={FlaskConical}
                title="Lab Results"
                color="bg-amber-500"
                count={data.labs?.length}
                defaultOpen={true}
              >
                <LabsPanel labs={data.labs} />
              </Section>

              {/* Allergies */}
              {(data.allergies?.length > 0) && (
                <Section
                  icon={AlertCircle}
                  title="Allergies"
                  color="bg-red-500"
                  count={data.allergies?.length}
                  defaultOpen={true}
                >
                  <AllergiesPanel allergies={data.allergies} />
                </Section>
              )}

              {/* Encounters */}
              {(data.encounters?.length > 0) && (
                <Section
                  icon={Stethoscope}
                  title="Encounter History"
                  color="bg-teal-500"
                  count={data.encounters?.length}
                  defaultOpen={false}
                >
                  <EncountersPanel encounters={data.encounters} />
                </Section>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
          <p className="text-xs text-slate-400 text-center">
            Data synced from HAPI FHIR R4 server · For clinical reference only
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
