import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, RefreshCw, AlertCircle, Users } from 'lucide-react'
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

function RiskBadge({ level }) {
  if (level === 'critical') {
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-600 text-white">
        Critical
      </span>
    )
  }
  if (level === 'watch') {
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
        Watch
      </span>
    )
  }
  return (
    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-[#E8E4DC] text-[#888]">
      Stable
    </span>
  )
}

function PatientRow({ patient, selected, onSelect, index }) {
  const isActive = selected?.fhir_id === patient.fhir_id
  const a = age(patient.birth_date)
  const genderShort = patient.gender ? patient.gender.charAt(0).toUpperCase() : null
  const allergies = patient.allergies || []

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(patient)}
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ x: 2 }}
      className={`w-full text-left px-3 py-3 rounded-xl border transition-colors ${
        isActive
          ? 'bg-white border-[#5B8F85]/40 shadow-[0_2px_12px_rgba(91,143,133,0.12)]'
          : 'border-transparent hover:bg-white/70 hover:border-[#E8E4DC]'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="font-sans text-sm font-semibold text-ink leading-snug">{formatName(patient.full_name)}</p>
        <RiskBadge level={patient.risk?.level} />
      </div>
      <p className="font-sans text-xs text-[#888] mb-0.5">
        {[a ? `${a}y` : null, genderShort, patient.mrn ? `MRN-${patient.mrn}` : null].filter(Boolean).join(' · ')}
      </p>
      {allergies.length > 0 && (
        <p className="font-sans text-[11px] text-red-600 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {allergies.slice(0, 2).join(', ')}
        </p>
      )}
    </motion.button>
  )
}

export default function PatientRail({ selectedPatient, onSelectPatient, onNewSearch }) {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [syncing, setSyncing] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const r = await api.get('/patients')
      setPatients(r.data.patients || [])
    } catch {
      setPatients([])
    } finally {
      setLoading(false)
    }
  }

  async function syncAll() {
    setSyncing(true)
    try {
      await api.post('/patients/sync-all')
      await load()
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = patients.filter(p =>
    !query ||
    (p.full_name || '').toLowerCase().includes(query.toLowerCase()) ||
    (p.mrn || '').toLowerCase().includes(query.toLowerCase()),
  )

  const criticalCount = patients.filter(p => p.risk?.level === 'critical').length
  const watchCount = patients.filter(p => p.risk?.level === 'watch').length

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="w-[280px] flex-shrink-0 h-screen flex flex-col bg-[#F4F0E8] border-r border-[#E8E4DC]"
    >
      <div className="px-4 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-[#5B8F85]" strokeWidth={1.75} />
          <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#888]">
            Patients
          </span>
          {!loading && (
            <span className="font-sans text-[10px] text-[#888] ml-auto">{patients.length}</span>
          )}
        </div>

        <AnimatePresence>
          {(criticalCount > 0 || watchCount > 0) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex flex-wrap gap-1.5 mb-3"
            >
              {criticalCount > 0 && (
                <span className="text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  {criticalCount} critical
                </span>
              )}
              {watchCount > 0 && (
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  {watchCount} watch
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 px-3 py-2.5 bg-white border border-[#E8E4DC] rounded-lg shadow-sm">
          <Search className="w-3.5 h-3.5 text-[#888] flex-shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search patients…"
            className="flex-1 bg-transparent font-sans text-sm text-ink placeholder-[#AAA] outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={i}
              className="h-[72px] rounded-xl bg-white/50"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.1 }}
            />
          ))
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 py-10 text-center"
          >
            <p className="font-serif text-base text-[#666] mb-2">
              {query ? 'No matches' : 'No patients synced'}
            </p>
            {!query && (
              <motion.button
                type="button"
                onClick={syncAll}
                disabled={syncing}
                className="font-sans text-sm font-semibold text-[#5B8F85] hover:underline"
                whileHover={{ scale: 1.02 }}
              >
                Sync from EMR →
              </motion.button>
            )}
          </motion.div>
        ) : (
          filtered.map((p, i) => (
            <PatientRow
              key={p.fhir_id}
              patient={p}
              selected={selectedPatient}
              onSelect={onSelectPatient}
              index={i}
            />
          ))
        )}
      </div>

      <div className="px-3 py-4 border-t border-[#E8E4DC] flex-shrink-0 space-y-2 bg-[#EDE8DA]/50">
        <motion.button
          type="button"
          onClick={onNewSearch}
          className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg bg-ink text-white font-sans text-sm font-semibold"
          whileHover={{ scale: 1.02, opacity: 0.92 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-4 h-4" />
          New evidence search
        </motion.button>
        <motion.button
          type="button"
          onClick={syncAll}
          disabled={syncing}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-[#E8E4DC] bg-white font-sans text-sm text-[#555] hover:border-[#5B8F85]/30 transition-colors disabled:opacity-60"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          Sync from EMR
        </motion.button>
      </div>
    </motion.aside>
  )
}
