/**
 * FhirPatient.jsx
 * Search / select a FHIR patient and attach them as context for a research query.
 * Displays the patient's recent Encounters and Appointments fetched from HAPI FHIR.
 */

import { useState } from 'react'
import api from '../api'

function FhirBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                     text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586
                 a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      FHIR R4
    </span>
  )
}

function EncounterRow({ enc }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-gray-100 last:border-0">
      <span className="mt-0.5 w-2 h-2 rounded-full bg-teal-500 shrink-0" />
      <div>
        <p className="text-xs text-gray-800">{enc.reason || 'Encounter'}</p>
        <p className="text-xs text-gray-500">{enc.start?.slice(0, 10)} · {enc.class || enc.status}</p>
      </div>
    </div>
  )
}

function AppointmentRow({ appt }) {
  const statusColor = appt.status === 'booked' ? 'text-blue-600'
    : appt.status === 'fulfilled' ? 'text-emerald-600'
    : appt.status === 'cancelled' ? 'text-red-500'
    : 'text-gray-500'
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-gray-100 last:border-0">
      <span className="mt-0.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
      <div>
        <p className="text-xs text-gray-800">{appt.description || 'Appointment'}</p>
        <p className={`text-xs ${statusColor}`}>{appt.start?.slice(0, 10)} · {appt.status}</p>
      </div>
    </div>
  )
}

export default function FhirPatient({ onPatientSelected }) {
  const [searchFamily, setSearchFamily] = useState('')
  const [results, setResults]           = useState([])
  const [selected, setSelected]         = useState(null)
  const [encounters, setEncounters]     = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [fhirUp, setFhirUp]             = useState(null)

  async function checkFhir() {
    try {
      const r = await api.get('/fhir/health')
      setFhirUp(r.data.fhir_server === 'up')
    } catch {
      setFhirUp(false)
    }
  }

  async function search(e) {
    e.preventDefault()
    if (!searchFamily.trim()) return
    setLoading(true)
    setError('')
    setResults([])
    setSelected(null)
    try {
      const r = await api.get('/fhir/patients', { params: { family: searchFamily } })
      setResults(r.data.patients || [])
      if (!r.data.patients?.length) setError('No patients found.')
    } catch (err) {
      setError('FHIR server unavailable. Make sure Docker is running (`docker compose up`).')
    } finally {
      setLoading(false)
    }
  }

  async function selectPatient(p) {
    setSelected(p)
    const id = p.id
    try {
      const [encRes, apptRes] = await Promise.all([
        api.get(`/fhir/patients/${id}/encounters`),
        api.get(`/fhir/patients/${id}/appointments`),
      ])
      setEncounters(encRes.data.encounters || [])
      setAppointments(apptRes.data.appointments || [])
    } catch {
      setEncounters([])
      setAppointments([])
    }
    onPatientSelected?.(id)
  }

  function clearPatient() {
    setSelected(null)
    setEncounters([])
    setAppointments([])
    onPatientSelected?.(null)
  }

  const patientName = (p) => {
    const n = p?.name?.[0] || {}
    return `${(n.given || []).join(' ')} ${n.family || ''}`.trim() || p?.id
  }

  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-sm font-semibold text-teal-800">FHIR Patient Context</span>
          <FhirBadge />
        </div>
        {fhirUp === null && (
          <button onClick={checkFhir} className="text-xs text-teal-600 hover:text-teal-700 underline">
            Check server
          </button>
        )}
        {fhirUp === true  && <span className="text-xs text-emerald-600">● Server up</span>}
        {fhirUp === false && <span className="text-xs text-red-500">● Server down</span>}
      </div>

      {/* Patient search */}
      {!selected ? (
        <>
          <form onSubmit={search} className="flex gap-2">
            <input
              value={searchFamily}
              onChange={e => setSearchFamily(e.target.value)}
              placeholder="Search by last name…"
              className="flex-1 bg-white border border-teal-200 rounded-lg px-3 py-1.5
                         text-sm text-gray-800 placeholder-gray-400 outline-none
                         focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50
                         text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? '…' : 'Search'}
            </button>
          </form>

          {error && <p className="text-xs text-red-500">{error}</p>}

          {results.length > 0 && (
            <ul className="space-y-1 max-h-40 overflow-y-auto">
              {results.map(p => (
                <li key={p.id}>
                  <button
                    onClick={() => selectPatient(p)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-white hover:bg-teal-50
                               text-sm text-gray-800 border border-gray-100 transition-colors"
                  >
                    <span className="font-medium">{patientName(p)}</span>
                    <span className="text-gray-500 ml-2 text-xs">
                      DOB {p.birthDate || '?'} · {p.gender}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <p className="text-xs text-gray-500">
            Attach a patient's EMR context to enrich the research query with their encounter history.
          </p>
        </>
      ) : (
        /* Selected patient card */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">{patientName(selected)}</p>
              <p className="text-xs text-gray-500">
                DOB {selected.birthDate} · {selected.gender} · ID {selected.id}
              </p>
            </div>
            <button onClick={clearPatient}
              className="text-xs text-gray-500 hover:text-gray-700 underline">
              Remove
            </button>
          </div>

          {/* Encounters */}
          <div>
            <p className="text-xs font-semibold text-teal-700 mb-1">
              Recent Encounters ({encounters.length})
            </p>
            {encounters.length === 0
              ? <p className="text-xs text-gray-500">No encounters recorded.</p>
              : encounters.slice(0, 4).map((e, i) => <EncounterRow key={i} enc={e} />)
            }
          </div>

          {/* Appointments */}
          <div>
            <p className="text-xs font-semibold text-blue-700 mb-1">
              Appointments ({appointments.length})
            </p>
            {appointments.length === 0
              ? <p className="text-xs text-gray-500">No appointments scheduled.</p>
              : appointments.slice(0, 4).map((a, i) => <AppointmentRow key={i} appt={a} />)
            }
          </div>

          <p className="text-xs text-teal-600">
            ✓ Patient context will be passed to the PICO agent to enrich this query.
          </p>
        </div>
      )}
    </div>
  )
}
