import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Activity, Brain, BarChart3, FileText,
  AlertTriangle, CheckCircle, ChevronRight, LogOut, Clock, X,
} from 'lucide-react'
import { researchAPI, compareAPI, createJobStream, authAPI } from './api'
import AgentPipeline   from './components/AgentPipeline'
import EvidenceCard    from './components/EvidenceCard'
import ReportPanel     from './components/ReportPanel'
import AuthModal       from './components/AuthModal'
import SearchHistory   from './components/SearchHistory'
import PatientSelector    from './components/PatientSelector'
import PatientDetailPanel from './components/PatientDetailPanel'
import ComparisonPanel    from './components/ComparisonPanel'
import CDSHooksDemo       from './components/CDSHooksDemo'
import { AnatomyBackground } from './components/AnatomyBackground'

// ── constants ────────────────────────────────────────────────────
const EXAMPLE_QUESTIONS = [
  'What is the efficacy of GLP-1 receptor agonists for type 2 diabetes?',
  'Best treatments for heart failure with reduced ejection fraction?',
  'Is aspirin effective for primary prevention of cardiovascular events?',
  'What is the evidence for SGLT2 inhibitors in chronic kidney disease?',
]

const ALL_AGENTS = ['fhir', 'pico', 'search', 'summarizer', 'contradiction', 'drug_interaction', 'synthesize', 'followup']

// ── micro components ─────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function PICOBadge({ pico }) {
  if (!pico) return null
  const items = [
    { label: 'Population',    value: pico.population,    color: 'blue' },
    { label: 'Intervention',  value: pico.intervention,  color: 'purple' },
    { label: 'Comparison',    value: pico.comparison,    color: 'emerald' },
    { label: 'Outcome',       value: pico.outcome,       color: 'amber' },
  ]
  const colors = {
    blue:    'bg-blue-50 border-blue-100 text-blue-700',
    purple:  'bg-purple-50 border-purple-100 text-purple-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    amber:   'bg-amber-50 border-amber-100 text-amber-700',
  }
  return (
    <motion.div
      className="mb-6 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-slate-900 text-sm">PICO Framework Extracted</p>
          <p className="text-xs text-slate-500">Structured clinical question analysis</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map(({ label, value, color }) => (
          <div key={label} className={`p-3 rounded-xl border ${colors[color]}`}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
            <p className="text-sm text-slate-700">{value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function DrugInteractionAlert({ interactions }) {
  if (!interactions?.length) return null
  const majors = interactions.filter(i => i.severity === 'major')
  const others = interactions.filter(i => i.severity !== 'major')
  return (
    <motion.div
      className="mb-4 bg-red-50 rounded-2xl p-5 border border-red-200"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">💊</span>
        <p className="text-sm font-semibold text-red-800">
          {interactions.length} Drug Interaction{interactions.length > 1 ? 's' : ''} Detected
        </p>
        {majors.length > 0 && (
          <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full font-medium">
            {majors.length} major
          </span>
        )}
      </div>
      {interactions.map((d, i) => (
        <div key={i} className="flex items-start gap-2 text-sm text-red-700 mt-2">
          <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
            d.severity === 'major' ? 'bg-red-200 text-red-900' : 'bg-red-100 text-red-700'
          }`}>{d.severity}</span>
          <span>{d.description}</span>
        </div>
      ))}
    </motion.div>
  )
}

function ContradictionAlert({ contradictions }) {
  if (!contradictions?.length) return null
  return (
    <motion.div
      className="mb-4 bg-amber-50 rounded-2xl p-5 border border-amber-200"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
        <p className="text-sm font-semibold text-amber-800">
          {contradictions.length} Conflicting Finding{contradictions.length > 1 ? 's' : ''} Detected
        </p>
      </div>
      {contradictions.map((c, i) => (
        <div key={i} className="flex items-start gap-2 text-sm text-amber-700 mt-1">
          <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
            c.severity === 'major' ? 'bg-amber-200 text-amber-800' : 'bg-amber-100 text-amber-700'
          }`}>{c.severity}</span>
          <span>{c.conflict}</span>
        </div>
      ))}
    </motion.div>
  )
}

// ── main app ─────────────────────────────────────────────────────
export default function App() {
  const [question, setQuestion]               = useState('')
  const [fhirPatientId, setFhirPatientId]     = useState(null)
  const [selectedPatient, setSelectedPatient] = useState(null)   // full patient object for suggestions
  const [jobStatus, setJobStatus]             = useState(null)
  const [isSubmitting, setIsSubmitting]       = useState(false)
  const [error, setError]                     = useState(null)
  const [user, setUser]                       = useState(null)
  const [showAuth, setShowAuth]               = useState(false)
  const [showHistory, setShowHistory]         = useState(false)
  const [detailPatientId, setDetailPatientId]   = useState(null)
  // Session memory: keyed by patientId (or '__global__' for no patient)
  const [sessionMemory, setSessionMemory]       = useState({})
  // Evidence provenance: which source card is highlighted
  const [highlightedSource, setHighlightedSource] = useState(null)
  const highlightTimerRef = useRef(null)
  const streamRef = useRef(null)
  const searchBarRef = useRef(null)
  // Comparison mode
  const [compareMode, setCompareMode]     = useState(false)
  const [questionB, setQuestionB]         = useState('')
  const [compareStatus, setCompareStatus] = useState(null)
  const comparePollerRef = useRef(null)

  useEffect(() => {
    const token = sessionStorage.getItem('cm_token')
    if (token) {
      authAPI.me()
        .then(r => setUser({ email: r.data.email, name: r.data.full_name || r.data.email.split('@')[0] }))
        .catch(() => sessionStorage.removeItem('cm_token'))
    }
  }, [])

  const stopStream = () => {
    if (streamRef.current) { streamRef.current.close(); streamRef.current = null }
  }

  const handleJobData = useCallback((data) => {
    setJobStatus(prev => {
      const next = prev ? { ...prev, ...data } : data
      // When a job completes successfully, save it to session memory
      if (data.status === 'complete' && data.report && Object.keys(data.report).length > 0) {
        const key = fhirPatientId || '__global__'
        const answer = data.report.clinical_bottom_line
          || data.report.summary
          || 'Evidence synthesis complete.'
        setSessionMemory(mem => {
          const existing = mem[key] || []
          const entry = { question: next.question || '', answer: String(answer).slice(0, 400) }
          return { ...mem, [key]: [...existing.slice(-4), entry] }  // keep last 5
        })
      }
      return next
    })
    if (['complete', 'error'].includes(data.status)) {
      setIsSubmitting(false)
      stopStream()
      if (data.error) setError(data.error)
    }
  }, [fhirPatientId])

  const handleCiteClick = (index) => {
    // Clear any pending highlight timer
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
    setHighlightedSource(index)
    // Scroll to the evidence card
    const el = document.getElementById(`source-${index}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // Clear highlight after 2.5s
    highlightTimerRef.current = setTimeout(() => setHighlightedSource(null), 2500)
  }

  const handleFollowupClick = (q) => {
    // Pre-fill the question and scroll to search bar without clearing the current
    // report — the user can read the suggestion before deciding to run it.
    setQuestion(q)
    setTimeout(() => {
      searchBarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      searchBarRef.current?.focus()
    }, 80)
  }

  const stopComparePoller = () => {
    if (comparePollerRef.current) { clearInterval(comparePollerRef.current); comparePollerRef.current = null }
  }

  const handleCompareSubmit = async () => {
    if (!question.trim() || !questionB.trim() || isSubmitting) return
    setError(null); setCompareStatus({ status: 'pending' }); setIsSubmitting(true)
    stopComparePoller()
    try {
      const res = await compareAPI.start(question.trim(), questionB.trim(), fhirPatientId)
      const { compare_id } = res.data
      setCompareStatus({ status: 'running', compare_id, question_a: question.trim(), question_b: questionB.trim() })
      comparePollerRef.current = setInterval(async () => {
        try {
          const r = await compareAPI.status(compare_id)
          setCompareStatus(r.data)
          if (r.data.status === 'complete' || r.data.status === 'error') {
            stopComparePoller()
            setIsSubmitting(false)
            if (r.data.error) setError(r.data.error)
          }
        } catch { stopComparePoller(); setIsSubmitting(false) }
      }, 3000)
    } catch (err) {
      setIsSubmitting(false)
      setError(err.response?.data?.detail || 'Compare failed. Is the backend running?')
    }
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!question.trim() || isSubmitting) return
    setError(null); setJobStatus(null); setIsSubmitting(true); stopStream()
    try {
      const sessionKey = fhirPatientId || '__global__'
      const history = sessionMemory[sessionKey] || []
      const res = await researchAPI.start(question.trim(), fhirPatientId, history)
      const { job_id } = res.data
      setJobStatus({
        job_id, status: 'pending', question: question.trim(),
        agent_status: Object.fromEntries(ALL_AGENTS.map(a => [a, 'idle'])),
      })
      streamRef.current = createJobStream(job_id, handleJobData, () => {
        const poll = setInterval(async () => {
          try {
            const r = await researchAPI.status(job_id)
            handleJobData(r.data)
            if (['complete', 'error'].includes(r.data.status)) clearInterval(poll)
          } catch { clearInterval(poll) }
        }, 2000)
      })
    } catch (err) {
      setIsSubmitting(false)
      setError(err.response?.data?.detail || 'Failed to start research. Is the backend running?')
    }
  }

  const handlePatientSelected = (patient) => {
    setSelectedPatient(patient)
    setFhirPatientId(patient?.fhir_id ?? null)
  }

  // Derive smart question suggestions from the patient's active risk flags
  const smartSuggestions = (() => {
    if (!selectedPatient?.risk?.flags?.length) return []
    const flags   = selectedPatient.risk.flags
    const conds   = selectedPatient.active_conditions || []
    const name    = selectedPatient.full_name?.split(' ')[0] || 'this patient'

    const suggestions = []

    // eGFR / CKD flags
    const egfrFlag = flags.find(f => /eGFR/i.test(f))
    if (egfrFlag) {
      const match = egfrFlag.match(/eGFR\s*([\d.]+)/i)
      const egfr  = match ? match[1] : '42'
      suggestions.push(`What is the evidence for slowing CKD progression in T2DM with eGFR ${egfr}?`)
    }

    // HbA1c flags
    const hba1cFlag = flags.find(f => /HbA1c/i.test(f))
    if (hba1cFlag) {
      suggestions.push("What is the optimal HbA1c target for elderly patients with type 2 diabetes and CKD?")
    }

    // Drug interaction / medication flag
    const medFlag = flags.find(f => /metformin|NSAID|ACE|ARB|statin/i.test(f))
    if (medFlag) {
      suggestions.push(`What are the risks of ${medFlag.match(/metformin|NSAID|ACE inhibitor|ARB|statin/i)?.[0] || 'this medication'} in patients with reduced kidney function?`)
    }

    // NT-proBNP / heart failure
    const bnpFlag = flags.find(f => /NT-proBNP|heart failure/i.test(f))
    if (bnpFlag) {
      suggestions.push("What does elevated NT-proBNP indicate and how should it be managed in outpatient CKD?")
    }

    // Generic fallback from conditions if no specific flags matched
    if (suggestions.length === 0 && conds.length > 0) {
      suggestions.push(`What is the best evidence-based management of ${conds[0]} in 2024?`)
    }

    return suggestions.slice(0, 3)
  })()

  const handleReset = () => {
    stopStream(); stopComparePoller()
    setJobStatus(null); setCompareStatus(null)
    setError(null); setIsSubmitting(false); setQuestion(''); setQuestionB('')
  }
  const handleLogout = () => { sessionStorage.removeItem('cm_token'); setUser(null) }
  const loadHistory = async (job_id) => {
    setShowHistory(false)
    try { const r = await researchAPI.status(job_id); setJobStatus(r.data); setQuestion(r.data.question) } catch {}
  }

  // A non-empty report means synthesis is done regardless of whether the final
  // "status: complete" SSE event arrived (it can be missed on reconnect).
  const hasFullReport = Boolean(jobStatus?.report && Object.keys(jobStatus.report).length > 0)
  const isEffectivelyDone = hasFullReport || ['complete', 'error'].includes(jobStatus?.status)
  const isRunning  = !isEffectivelyDone && (isSubmitting || (jobStatus && !['complete','error'].includes(jobStatus?.status)))
  const isComplete = isEffectivelyDone && !jobStatus?.error

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 relative overflow-x-hidden">

      {/* Animated anatomy background */}
      <AnatomyBackground />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
            style={{ left: `${(i * 7.3 + 5) % 100}%`, top: `${(i * 11.7 + 10) % 100}%` }}
            animate={{ y: [0, -80, -160], opacity: [0, 0.6, 0], scale: [0, 1, 0] }}
            transition={{ duration: 7 + i * 0.5, delay: i * 0.8, repeat: Infinity, ease: 'linear' }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">

        {/* ── HEADER ─────────────────────────────────────────── */}
        <motion.header
          className="flex items-center justify-between mb-16"
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">ClinicalMind</h1>
              <p className="text-xs text-slate-500">AI-powered clinical research</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              PubMed · ClinicalTrials.gov · FHIR R4
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => setShowHistory(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900
                             bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                >
                  <Clock className="w-3.5 h-3.5" /> History
                </motion.button>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg">
                  <span className="text-sm text-slate-700 font-medium">{user.name}</span>
                  <button onClick={handleLogout} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <motion.button
                onClick={() => setShowAuth(true)}
                className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg shadow-sm"
                whileHover={{ scale: 1.03, shadow: 'lg' }} whileTap={{ scale: 0.97 }}
              >
                Sign In
              </motion.button>
            )}
          </div>
        </motion.header>

        {/* ── HOMEPAGE DASHBOARD ─────────────────────────────── */}
        <AnimatePresence>
          {!jobStatus && !compareStatus && (
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}
            >
              {/* Two-column layout: patients left, search right */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

                {/* ── LEFT: Patient Dashboard Panel ── */}
                <motion.div
                  className="lg:col-span-2"
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient Dashboard</p>
                  </div>
                  <PatientSelector
                    onPatientSelected={handlePatientSelected}
                    onViewDetail={setDetailPatientId}
                  />
                </motion.div>

                {/* ── RIGHT: Search + suggestions ── */}
                <motion.div
                  className="lg:col-span-3"
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  {/* Compact headline */}
                  <div className="mb-5">
                    <h2 className="text-3xl font-extrabold text-slate-900 leading-tight">
                      Evidence-Based Answers
                      <span className="ml-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        in Seconds
                      </span>
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Select a patient, then ask a clinical question.
                    </p>
                  </div>

                  {/* Search box */}
                  <form onSubmit={compareMode ? (e) => { e.preventDefault(); handleCompareSubmit() } : handleSubmit} className="mb-3">
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
                      <div className="relative bg-white rounded-2xl shadow-lg border border-slate-200 p-2 hover:shadow-xl transition-shadow">

                        {/* Question A (always shown) */}
                        <div className="flex items-start gap-3 px-4 pt-3 pb-1">
                          {compareMode
                            ? <span className="w-5 h-5 mt-1 shrink-0 flex items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">A</span>
                            : <Search className="w-5 h-5 text-slate-400 mt-1 shrink-0" />
                          }
                          <textarea
                            ref={searchBarRef}
                            value={question}
                            onChange={e => setQuestion(e.target.value)}
                            placeholder={compareMode ? "First treatment or question…" : "e.g. What is the efficacy of metformin for type 2 diabetes prevention?"}
                            rows={2}
                            className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 resize-none focus:outline-none leading-relaxed text-sm"
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !compareMode) { e.preventDefault(); handleSubmit() } }}
                          />
                        </div>

                        {/* Question B — slides in when compareMode */}
                        <AnimatePresence>
                          {compareMode && (
                            <motion.div
                              className="flex items-start gap-3 px-4 pt-2 pb-1 border-t border-slate-100 mt-1"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <span className="w-5 h-5 mt-1 shrink-0 flex items-center justify-center rounded-full bg-purple-600 text-white text-xs font-bold">B</span>
                              <textarea
                                value={questionB}
                                onChange={e => setQuestionB(e.target.value)}
                                placeholder="Second treatment or question to compare…"
                                rows={2}
                                className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 resize-none focus:outline-none leading-relaxed text-sm"
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="flex items-center justify-between px-4 py-2">
                          {/* Compare toggle */}
                          <button
                            type="button"
                            onClick={() => { setCompareMode(m => !m); setQuestionB('') }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                              ${compareMode
                                ? 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100'
                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'
                              }`}
                          >
                            <span>⚖️</span>
                            {compareMode ? 'Cancel compare' : 'Compare two'}
                          </button>

                          <motion.button
                            type="submit"
                            disabled={!question.trim() || (compareMode && !questionB.trim()) || isSubmitting}
                            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600
                                       text-white text-sm font-medium rounded-xl shadow-sm disabled:opacity-50"
                            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          >
                            {isSubmitting
                              ? <><Spinner />{compareMode ? 'Comparing…' : 'Analysing…'}</>
                              : compareMode
                                ? <>⚖️ Compare <ChevronRight className="w-4 h-4" /></>
                                : <>Research <ChevronRight className="w-4 h-4" /></>
                            }
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </form>

                  {/* Session memory indicator */}
                  {(() => {
                    const key = fhirPatientId || '__global__'
                    const history = sessionMemory[key] || []
                    return history.length > 0 ? (
                      <motion.div
                        className="mb-3 flex items-center justify-between px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl"
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex items-center gap-2 text-xs text-indigo-700">
                          <Brain className="w-3.5 h-3.5" />
                          <span className="font-medium">Session memory active</span>
                          <span className="text-indigo-500">· {history.length} prior {history.length === 1 ? 'query' : 'queries'} in context</span>
                        </div>
                        <button
                          onClick={() => setSessionMemory(m => ({ ...m, [key]: [] }))}
                          className="text-xs text-indigo-400 hover:text-indigo-700 transition-colors"
                        >
                          Clear
                        </button>
                      </motion.div>
                    ) : null
                  })()}

                  {/* Smart question suggestions from patient risk flags */}
                  <AnimatePresence>
                    {smartSuggestions.length > 0 && (
                      <motion.div
                        className="mb-4"
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <span>⚡</span> Suggested from {selectedPatient?.full_name?.split(' ')[0]}'s risk flags
                        </p>
                        <div className="flex flex-col gap-2">
                          {smartSuggestions.map((q, i) => (
                            <motion.button
                              key={i}
                              onClick={() => setQuestion(q)}
                              className="group text-left px-4 py-3 bg-amber-50 rounded-xl border border-amber-200
                                         hover:border-amber-400 hover:shadow-sm transition-all"
                              initial={{ opacity: 0, x: -12 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.07 }}
                              whileHover={{ x: 3 }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm text-amber-900 group-hover:text-amber-950">{q}</span>
                                <Search className="w-3 h-3 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Example questions — shown when no patient selected */}
                  {smartSuggestions.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Try an Example</p>
                      <div className="grid gap-2">
                        {EXAMPLE_QUESTIONS.map((q, i) => (
                          <motion.button
                            key={i}
                            onClick={() => setQuestion(q)}
                            className="group text-left px-4 py-3 bg-white rounded-xl border border-slate-200
                                       hover:border-blue-300 hover:shadow-md transition-all"
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.45 + i * 0.07 }}
                            whileHover={{ x: 3 }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-700 group-hover:text-slate-900">{q}</span>
                              <Search className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-3" />
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── COMPARE RESULTS ─────────────────────────────────── */}
        <AnimatePresence>
          {compareStatus && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-start justify-between mb-8 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Evidence Comparison</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-blue-700">
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">A</span>
                      {compareStatus.question_a}
                    </span>
                    <span className="text-slate-300 font-bold">vs</span>
                    <span className="flex items-center gap-1.5 text-sm font-bold text-purple-700">
                      <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">B</span>
                      {compareStatus.question_b}
                    </span>
                  </div>
                </div>
                <motion.button
                  onClick={handleReset}
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200
                             rounded-lg text-slate-600 hover:text-slate-900 hover:border-blue-300 text-sm transition-all"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                >
                  <X className="w-4 h-4" /> New Search
                </motion.button>
              </div>

              {compareStatus.status === 'running' || compareStatus.status === 'pending' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold shrink-0">A</span>
                      <p className="text-xs font-semibold text-blue-700 truncate">{compareStatus.question_a}</p>
                    </div>
                    <AgentPipeline agentStatus={compareStatus.agent_status_a || {}} compact />
                  </div>
                  <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold shrink-0">B</span>
                      <p className="text-xs font-semibold text-purple-700 truncate">{compareStatus.question_b}</p>
                    </div>
                    <AgentPipeline agentStatus={compareStatus.agent_status_b || {}} compact />
                  </div>
                </div>
              ) : compareStatus.status === 'complete' ? (
                <ComparisonPanel compareResult={compareStatus} />
              ) : null}

              {error && (
                <motion.div
                  className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-200 flex items-start gap-3"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                >
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── RESULTS ─────────────────────────────────────────── */}
        <AnimatePresence>
          {jobStatus && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {/* Question header */}
              <div className="flex items-start justify-between mb-8 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Clinical Question</p>
                  <h2 className="text-xl font-bold text-slate-900 max-w-3xl">{jobStatus.question}</h2>
                </div>
                <motion.button
                  onClick={handleReset}
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200
                             rounded-lg text-slate-600 hover:text-slate-900 hover:border-blue-300 text-sm transition-all"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                >
                  <X className="w-4 h-4" /> New Search
                </motion.button>
              </div>

              {/* Error banner */}
              {error && (
                <motion.div
                  className="mb-6 p-4 bg-red-50 rounded-2xl border border-red-200 flex items-start gap-3"
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                >
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Error</p>
                    <p className="text-xs text-red-600 mt-0.5">{error}</p>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Pipeline sidebar */}
                <div className="lg:col-span-1">
                  <div className="sticky top-6">
                    {/* Status pill */}
                    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium mb-4 ${
                      isRunning  ? 'bg-blue-50 border border-blue-200 text-blue-700'
                      : isComplete ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                      {isRunning
                        ? <><Spinner />Running pipeline…</>
                        : isComplete
                        ? <><CheckCircle className="w-4 h-4" />Complete</>
                        : <><AlertTriangle className="w-4 h-4" />Stopped</>
                      }
                    </div>

                    {/* Agent pipeline */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                      <AgentPipeline agentStatus={jobStatus.agent_status} />
                    </div>

                    {/* Source breakdown */}
                    {jobStatus.summaries?.length > 0 && (
                      <motion.div
                        className="mt-4 bg-white rounded-xl border border-slate-200 p-4"
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      >
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Sources</p>
                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span>{jobStatus.summaries.filter(s => !s.is_trial).length} PubMed</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Activity className="w-4 h-4 text-purple-500" />
                            <span>{jobStatus.summaries.filter(s => s.is_trial).length} Trials</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Main content */}
                <div className="lg:col-span-2 space-y-6">
                  <PICOBadge pico={jobStatus.pico} />
                  <ContradictionAlert contradictions={jobStatus.contradictions} />
                  <DrugInteractionAlert interactions={jobStatus.report?.drug_interactions} />

                  {/* Evidence cards */}
                  {jobStatus.summaries?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                        Evidence — {jobStatus.summaries.length} Sources
                      </p>
                      <div className="space-y-4">
                        {jobStatus.summaries.map((s, i) => (
                          <motion.div
                            key={s.pmid || i}
                            id={`source-${i}`}
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                          >
                            <EvidenceCard summary={s} index={i} highlighted={highlightedSource === i} />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skeleton loaders */}
                  {isRunning && !jobStatus.summaries?.length && (
                    <div className="space-y-4">
                      {[1,2,3].map(i => (
                        <div key={i} className="h-36 rounded-2xl bg-white border border-slate-200 animate-pulse" />
                      ))}
                    </div>
                  )}

                  {/* Report */}
                  {jobStatus.report && Object.keys(jobStatus.report).length > 0 && (
                    <ReportPanel
                      report={jobStatus.report}
                      question={jobStatus.question}
                      onCiteClick={handleCiteClick}
                      onFollowupClick={handleFollowupClick}
                    />
                  )}

                  {isRunning && jobStatus.summaries?.length > 0 && !jobStatus.report && (
                    <div className="h-56 rounded-2xl bg-white border border-slate-200 animate-pulse" />
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CDS Hooks demo strip */}
      <CDSHooksDemo />

      {/* Footer */}
      <footer className="relative z-10 mt-8 border-t border-slate-200/60 bg-white/40 backdrop-blur py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-500">ClinicalMind v3 · FastAPI · LangGraph · FHIR R4 · Anthropic Claude</p>
          <p className="text-xs text-slate-500">For research only · Not a substitute for clinical judgment</p>
        </div>
      </footer>

      {/* Patient detail drawer */}
      <AnimatePresence>
        {detailPatientId && (
          <PatientDetailPanel
            fhirId={detailPatientId}
            onClose={() => setDetailPatientId(null)}
          />
        )}
      </AnimatePresence>

      {/* Auth modal */}
      <AnimatePresence>
        {showAuth && (
          <AuthModal onAuth={u => { setUser(u); setShowAuth(false) }} onClose={() => setShowAuth(false)} />
        )}
      </AnimatePresence>

      {/* History drawer */}
      <AnimatePresence>
        {showHistory && user && (
          <motion.div
            className="fixed inset-0 z-50 flex"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              className="ml-auto w-full max-w-sm h-full bg-white border-l border-slate-200 shadow-2xl overflow-y-auto p-6"
              initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-bold text-slate-900">Search History</h2>
                <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SearchHistory onSelect={loadHistory} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
