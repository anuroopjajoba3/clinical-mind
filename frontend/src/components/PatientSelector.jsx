/**
 * PatientSelector.jsx
 * Loads all synced patients from the PostgreSQL-backed /patients API
 * and shows them as selectable cards with conditions, meds, and lab counts.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Activity, Pill, FlaskConical, AlertCircle, ChevronRight, X, RefreshCw, Eye } from 'lucide-react'
import api from '../api'

function age(birthDate) {
  if (!birthDate) return '?'
  return Math.floor((Date.now() - new Date(birthDate)) / (365.25 * 24 * 3600 * 1000))
}

function GenderIcon({ gender }) {
  const color = gender === 'female' ? 'text-pink-500' : gender === 'male' ? 'text-blue-500' : 'text-slate-400'
  return <User className={`w-4 h-4 ${color}`} />
}

function ConditionPill({ label }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-rose-50 text-rose-700 border border-rose-100">
      {label}
    </span>
  )
}

function MedPill({ label }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-violet-50 text-violet-700 border border-violet-100">
      {label}
    </span>
  )
}

function RiskBadge({ risk }) {
  if (!risk) return null
  const cfg = {
    critical: { bg: 'bg-red-100',   text: 'text-red-700',   border: 'border-red-200',   dot: 'bg-red-500',   label: 'Critical' },
    watch:    { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', label: 'Watch'    },
    stable:   { bg: 'bg-emerald-50',text: 'text-emerald-700',border:'border-emerald-200',dot:'bg-emerald-500',label: 'Stable'  },
  }[risk.level] || { bg:'bg-slate-100', text:'text-slate-600', border:'border-slate-200', dot:'bg-slate-400', label: risk.level }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
      {risk.flag_count > 0 && (
        <span className="ml-0.5 opacity-70">· {risk.flag_count}</span>
      )}
    </span>
  )
}

function PatientCard({ patient, onSelect, selected, onViewDetail }) {
  const isSelected = selected?.fhir_id === patient.fhir_id
  return (
    <motion.div
      className={`w-full text-left rounded-2xl border p-4 transition-all cursor-pointer
        ${isSelected
          ? 'border-blue-400 bg-blue-50/60 shadow-md ring-2 ring-blue-300/40'
          : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md'
        }`}
      onClick={() => onSelect(patient)}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Name row */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0
            ${isSelected ? 'bg-blue-500' : 'bg-slate-100'}`}>
            <GenderIcon gender={isSelected ? null : patient.gender} />
            {isSelected && <User className="w-4 h-4 text-white" />}
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm leading-tight">{patient.full_name}</p>
            <p className="text-xs text-slate-500">
              {age(patient.birth_date)} yrs · {patient.gender} · {patient.mrn}
            </p>
          </div>
        </div>
        {isSelected
          ? <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Selected</span>
          : <RiskBadge risk={patient.risk} />
        }
      </div>

      {/* Top risk flag */}
      {patient.risk?.flag_count > 0 && !isSelected && (
        <p className="text-xs text-slate-500 mb-2 line-clamp-1 leading-snug">
          ⚠ {patient.risk.flags[0]}
        </p>
      )}

      {/* Conditions */}
      {patient.active_conditions?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {patient.active_conditions.slice(0, 3).map((c, i) => (
            <ConditionPill key={i} label={c} />
          ))}
        </div>
      )}

      {/* Medications */}
      {patient.active_medications?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {patient.active_medications.slice(0, 2).map((m, i) => (
            <MedPill key={i} label={m} />
          ))}
        </div>
      )}

      {/* Counts row */}
      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
        <span className="flex items-center gap-1">
          <Activity className="w-3 h-3 text-rose-400" />
          {patient.entity_counts?.conditions ?? 0} conditions
        </span>
        <span className="flex items-center gap-1">
          <Pill className="w-3 h-3 text-violet-400" />
          {patient.entity_counts?.medications ?? 0} meds
        </span>
        <span className="flex items-center gap-1">
          <FlaskConical className="w-3 h-3 text-amber-400" />
          {patient.entity_counts?.labs ?? 0} labs
        </span>
        {(patient.entity_counts?.allergies ?? 0) > 0 && (
          <span className="flex items-center gap-1 text-rose-500">
            <AlertCircle className="w-3 h-3" />
            {patient.entity_counts.allergies} allergies
          </span>
        )}
        <button
          onClick={e => { e.stopPropagation(); onViewDetail?.(patient.fhir_id) }}
          className="ml-auto flex items-center gap-1 text-blue-500 hover:text-blue-700 font-medium transition-colors"
        >
          <Eye className="w-3 h-3" /> Details
        </button>
      </div>
    </motion.div>
  )
}

export default function PatientSelector({ onPatientSelected, onViewDetail }) {
  const [patients, setPatients]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [selected, setSelected]   = useState(null)
  const [expanded, setExpanded]   = useState(false)

  async function loadPatients() {
    setLoading(true)
    setError(null)
    try {
      const r = await api.get('/patients')
      setPatients(r.data.patients || [])
    } catch {
      setError('Could not load patients. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPatients() }, [])

  function handleSelect(patient) {
    if (selected?.fhir_id === patient.fhir_id) {
      // deselect
      setSelected(null)
      onPatientSelected?.(null)
    } else {
      setSelected(patient)
      onPatientSelected?.(patient.fhir_id)
      setExpanded(false)
    }
  }

  function clearPatient() {
    setSelected(null)
    onPatientSelected?.(null)
  }

  // Collapsed pill when a patient is selected
  if (selected && !expanded) {
    return (
      <motion.div
        className="flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-900">{selected.full_name}</p>
            <p className="text-xs text-slate-500">
              {age(selected.birth_date)} yrs · {selected.mrn} · {selected.active_conditions?.slice(0,2).join(', ')}
            </p>
          </div>
          <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-0.5 rounded-full">
            Context active
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewDetail?.(selected.fhir_id)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            <Eye className="w-3 h-3" /> Details
          </button>
          <button
            onClick={() => setExpanded(true)}
            className="text-xs text-slate-500 hover:text-slate-700 font-medium underline"
          >
            Change
          </button>
          <button onClick={clearPatient} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Select a Patient</p>
          <p className="text-xs text-slate-500">Attach patient context to enrich the clinical query</p>
        </div>
        <div className="flex items-center gap-2">
          {selected && (
            <button
              onClick={() => { setExpanded(false); setSelected(selected) }}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          )}
          <button
            onClick={loadPatients}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* States */}
      {loading && (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && patients.length === 0 && (
        <p className="text-xs text-slate-500 text-center py-4">
          No patients found. Run <code className="bg-slate-100 px-1 rounded">python seed_patients.py</code> and sync.
        </p>
      )}

      {!loading && patients.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
          <AnimatePresence>
            {patients.map((p, i) => (
              <motion.div
                key={p.fhir_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <PatientCard patient={p} onSelect={handleSelect} selected={selected} onViewDetail={onViewDetail} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
