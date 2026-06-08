import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, RefreshCw, AlertCircle, Users, Zap,
  LayoutDashboard, Activity, FileText, LogOut, Settings,
} from 'lucide-react'
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

const AVATAR_COLORS = ['#0E7490','#059669','#7C3AED','#DC2626','#D97706']

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
  const bg = AVATAR_COLORS[index % AVATAR_COLORS.length]

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(patient)}
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full text-left px-3 py-3 rounded-2xl transition-all duration-200 relative ${
        isActive
          ? 'bg-white shadow-[0_2px_16px_rgba(37,99,235,0.10)] border border-blue-100'
          : 'border border-transparent hover:bg-white hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-sans text-[11px] font-bold"
          style={{ background: bg }}>
          {initials(patient.full_name)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1 mb-0.5">
            <p className={`font-sans text-[12px] font-semibold leading-snug truncate ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
              {formatName(patient.full_name)}
            </p>
            <RiskBadge level={patient.risk?.level} />
          </div>
          <p className="font-sans text-[11px] text-slate-400">
            {[a ? `${a}y` : null, genderShort, patient.mrn ? `MRN ${patient.mrn}` : null].filter(Boolean).join(' · ')}
          </p>
          {allergies.length > 0 && (
            <p className="font-sans text-[10px] text-red-500 flex items-center gap-1 mt-0.5">
              <AlertCircle className="w-2.5 h-2.5 flex-shrink-0" />
              {allergies.slice(0, 2).join(', ')}
            </p>
          )}
        </div>
      </div>

      {isActive && (
        <motion.div layoutId="active-patient-bar"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-blue-500 rounded-r-full" />
      )}
    </motion.button>
  )
}

const NAV = [
  { id: 'search',    Icon: Search,         label: 'Evidence' },
  { id: 'dashboard', Icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'discharge', Icon: Activity,        label: 'Discharge' },
  { id: 'reports',   Icon: FileText,        label: 'Reports' },
]

export default function PatientRail({ selectedPatient, onSelectPatient, onNewSearch, mainView, setMainView, user, onLogout }) {
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
      className="flex h-screen flex-shrink-0"
    >

      {/* ── ICON RAIL ── */}
      <div className="w-[72px] flex flex-col items-center py-5 gap-1 bg-white border-r border-slate-100 flex-shrink-0">
        {/* Logo */}
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center mb-5 flex-shrink-0">
          <span className="font-sans text-[11px] font-extrabold text-white">CM</span>
        </div>

        {/* Nav icons */}
        <div className="flex flex-col items-center gap-1 flex-1">
          {NAV.map(({ id, Icon, label }) => {
            const active = mainView === id
            return (
              <motion.button key={id} type="button"
                onClick={() => { setMainView(id); if (id === 'search') onNewSearch() }}
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                title={label}
                className={`relative w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-200 ${
                  active
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}>
                {active && (
                  <motion.div layoutId="nav-icon-pill"
                    className="absolute inset-0 bg-blue-50 rounded-2xl"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }} />
                )}
                <Icon size={18} strokeWidth={active ? 2.5 : 1.75} className="relative z-10" />
                {active && (
                  <motion.div
                    layoutId="nav-icon-bar"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-600 rounded-r-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }} />
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Bottom: avatar + logout */}
        <div className="flex flex-col items-center gap-2 mt-auto">
          <motion.button type="button" title="Settings"
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
            className="w-11 h-11 flex items-center justify-center rounded-2xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
            <Settings size={18} strokeWidth={1.75} />
          </motion.button>

          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-sans text-[12px] font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>

          <motion.button type="button" onClick={onLogout} title="Log out"
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
            className="w-11 h-11 flex items-center justify-center rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
            <LogOut size={16} strokeWidth={1.75} />
          </motion.button>
        </div>
      </div>

      {/* ── PATIENT PANEL ── */}
      <div className="w-[252px] flex flex-col bg-[#F0F4FF] border-r border-slate-100">

        {/* Header */}
        <div className="px-4 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-slate-500" strokeWidth={2} />
              <span className="font-sans text-[13px] font-bold text-slate-700">Patients</span>
              {!loading && (
                <span className="font-sans text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-semibold">{patients.length}</span>
              )}
            </div>
            <motion.button type="button" onClick={load}
              whileHover={{ rotate: 180 }} whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.35 }}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors">
              <RefreshCw size={12} strokeWidth={2} />
            </motion.button>
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
          <motion.div whileFocusWithin={{ scale: 1.01 }}
            className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search patients…"
              className="flex-1 bg-transparent font-sans text-[12px] text-slate-800 placeholder-slate-300 outline-none" />
            {query && (
              <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }}
                onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
                <span className="text-[11px]">✕</span>
              </motion.button>
            )}
          </motion.div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <motion.div key={i}
                className="h-16 rounded-2xl bg-white mx-1 mb-1"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.12 }} />
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
                  className="font-sans text-[12px] font-semibold text-blue-600 hover:underline mt-1">
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
        <div className="px-3 py-3 border-t border-slate-100 flex-shrink-0 space-y-2 bg-white">
          <motion.button type="button" onClick={() => { onNewSearch(); setMainView('search') }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-sans text-[12px] font-semibold transition-colors shadow-sm">
            <Zap size={13} strokeWidth={2} />
            New evidence search
          </motion.button>
          <motion.button type="button" onClick={syncAll} disabled={syncing}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-2xl border border-slate-200 bg-slate-50 font-sans text-[12px] text-slate-600 hover:border-slate-300 hover:bg-white transition-colors disabled:opacity-60">
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
            Sync from EMR
          </motion.button>
        </div>
      </div>
    </motion.aside>
  )
}
