import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, RefreshCw, AlertCircle, Users, Zap } from 'lucide-react'
import api from '../api'

function age(dob) {
  if (!dob) return null
  return Math.floor((Date.now() - new Date(dob)) / (365.25 * 864e5))
}

function formatName(fullName) {
  if (!fullName) return '—'
  const parts = fullName.trim().split(' ')
  if (parts.length < 2) return fullName
  return `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}`
}

function initials(fullName) {
  if (!fullName) return '?'
  const parts = fullName.trim().split(' ').filter(Boolean)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const AVATAR_COLORS = [
  'from-[#0E7490] to-[#0EA5E9]',
  'from-[#059669] to-[#10B981]',
  'from-[#7C3AED] to-[#A78BFA]',
  'from-[#DC2626] to-[#F87171]',
  'from-[#D97706] to-[#FCD34D]',
]

function RiskBadge({ level }) {
  if (level === 'critical') return (
    <motion.span animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.8, repeat: Infinity }}
      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white uppercase tracking-wide">
      Critical
    </motion.span>
  )
  if (level === 'watch') return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wide">
      Watch
    </span>
  )
  return (
    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400 uppercase tracking-wide">
      Stable
    </span>
  )
}

function PatientRow({ patient, selected, onSelect, index }) {
  const isActive = selected?.fhir_id === patient.fhir_id
  const a = age(patient.birth_date)
  const genderShort = patient.gender ? patient.gender.charAt(0).toUpperCase() : null
  const allergies = patient.allergies || []
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length]

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(patient)}
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full text-left px-3 py-3 rounded-xl transition-all duration-200 ${
        isActive
          ? 'bg-white shadow-[0_2px_12px_rgba(14,116,144,0.12)] border border-[#0E7490]/20'
          : 'border border-transparent hover:bg-white/60 hover:border-slate-200'
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${avatarColor} flex items-center justify-center flex-shrink-0 text-white font-sans text-[11px] font-bold`}>
          {initials(patient.full_name)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1 mb-0.5">
            <p className={`font-sans text-[13px] font-semibold leading-snug truncate ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
              {formatName(patient.full_name)}
            </p>
            <RiskBadge level={patient.risk?.level} />
          </div>
          <p className="font-sans text-[11px] text-slate-400">
            {[a ? `${a}y` : null, genderShort, patient.mrn ? `MRN ${patient.mrn}` : null].filter(Boolean).join(' · ')}
          </p>
          {allergies.length > 0 && (
            <p className="font-sans text-[10px] text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="w-2.5 h-2.5 flex-shrink-0" />
              {allergies.slice(0, 2).join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Active indicator bar */}
      {isActive && (
        <motion.div
          layoutId="active-patient-bar"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#0E7490] rounded-r"
        />
      )}
    </motion.button>
  )
}

export default function PatientRail({ selectedPatient, onSelectPatient, onNewSearch }) {
  const [patients, setPatients] = useState([])
  const [loading, setLoading]   = useState(true)
  const [query, setQuery]       = useState('')
  const [syncing, setSyncing]   = useState(false)

  async function load() {
    setLoading(true)
    try {
      const r = await api.get('/patients')
      setPatients(r.data.patients || [])
    } catch { setPatients([]) }
    finally { setLoading(false) }
  }

  async function syncAll() {
    setSyncing(true)
    try { await api.post('/patients/sync-all'); await load() }
    finally { setSyncing(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = patients.filter(p =>
    !query ||
    (p.full_name || '').toLowerCase().includes(query.toLowerCase()) ||
    (p.mrn || '').toLowerCase().includes(query.toLowerCase()),
  )

  const criticalCount = patients.filter(p => p.risk?.level === 'critical').length
  const watchCount    = patients.filter(p => p.risk?.level === 'watch').length

  return (
    <motion.aside
      initial={{ x: -24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-[272px] flex-shrink-0 h-screen flex flex-col bg-slate-50 border-r border-slate-200 relative"
      style={{ position: 'relative' }}
    >
      {/* Subtle ambient glow */}
      <motion.div
        className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#0E7490]/5 blur-[80px] pointer-events-none"
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex-shrink-0 relative z-10">
        {/* Brand */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#060E1A] flex items-center justify-center">
              <span className="font-sans text-[9px] font-extrabold text-[#67C5D5]">CM</span>
            </div>
            <span className="font-sans text-[13px] font-bold text-slate-700 tracking-tight">Patients</span>
          </div>
          <div className="flex items-center gap-1">
            {!loading && (
              <span className="font-sans text-[11px] text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">{patients.length}</span>
            )}
            <motion.button type="button" onClick={load}
              whileHover={{ rotate: 180 }} whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.35 }}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
              <RefreshCw size={12} strokeWidth={2} />
            </motion.button>
          </div>
        </div>

        {/* Alert banners */}
        <AnimatePresence>
          {(criticalCount > 0 || watchCount > 0) && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-1.5 mb-3">
              {criticalCount > 0 && (
                <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  ⚠ {criticalCount} critical
                </span>
              )}
              {watchCount > 0 && (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  {watchCount} watch
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        <motion.div
          whileFocusWithin={{ scale: 1.01 }}
          className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search patients…"
            className="flex-1 bg-transparent font-sans text-[13px] text-slate-800 placeholder-slate-300 outline-none"
          />
          {query && (
            <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }}
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600">
              <span className="text-[11px]">✕</span>
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Patient list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5 relative z-10">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <motion.div key={i}
              className="h-[68px] rounded-xl bg-white mx-1 mb-1"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.12 }}
            />
          ))
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="px-4 py-12 text-center">
            <Users size={28} className="mx-auto text-slate-300 mb-3" />
            <p className="font-sans text-[13px] font-semibold text-slate-500 mb-1">
              {query ? 'No matches' : 'No patients synced'}
            </p>
            {!query && (
              <motion.button type="button" onClick={syncAll} disabled={syncing}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="font-sans text-[12px] font-semibold text-[#0E7490] hover:underline mt-1">
                Sync from EMR →
              </motion.button>
            )}
          </motion.div>
        ) : (
          filtered.map((p, i) => (
            <PatientRow key={p.fhir_id} patient={p} selected={selectedPatient}
              onSelect={onSelectPatient} index={i} />
          ))
        )}
      </div>

      {/* Bottom actions */}
      <div className="px-3 py-3 border-t border-slate-200 flex-shrink-0 space-y-2 relative z-10 bg-white/80 backdrop-blur-sm">
        <motion.button
          type="button"
          onClick={onNewSearch}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#060E1A] hover:bg-[#0E2A45] text-white font-sans text-[13px] font-semibold transition-colors shadow-sm"
        >
          <Zap size={13} strokeWidth={2} />
          New evidence search
        </motion.button>
        <motion.button
          type="button"
          onClick={syncAll}
          disabled={syncing}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white font-sans text-[12px] text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
          Sync from EMR
        </motion.button>
      </div>
    </motion.aside>
  )
}
