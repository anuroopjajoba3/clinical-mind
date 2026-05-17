import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Activity, Brain, BarChart3, FileText,
  AlertTriangle, CheckCircle, ChevronRight, LogOut, Clock, X,
} from 'lucide-react'
import { researchAPI, createJobStream, authAPI } from './api'
import AgentPipeline   from './components/AgentPipeline'
import EvidenceCard    from './components/EvidenceCard'
import ReportPanel     from './components/ReportPanel'
import AuthModal       from './components/AuthModal'
import SearchHistory   from './components/SearchHistory'
import FhirPatient     from './components/FhirPatient'
import { AnatomyBackground } from './components/AnatomyBackground'

// ── constants ────────────────────────────────────────────────────
const EXAMPLE_QUESTIONS = [
  'What is the efficacy of GLP-1 receptor agonists for type 2 diabetes?',
  'Best treatments for heart failure with reduced ejection fraction?',
  'Is aspirin effective for primary prevention of cardiovascular events?',
  'What is the evidence for SGLT2 inhibitors in chronic kidney disease?',
]

const ALL_AGENTS = ['fhir', 'pico', 'search', 'summarizer', 'contradiction', 'synthesize']

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
  const [question, setQuestion]           = useState('')
  const [fhirPatientId, setFhirPatientId] = useState(null)
  const [jobStatus, setJobStatus]         = useState(null)
  const [isSubmitting, setIsSubmitting]   = useState(false)
  const [error, setError]                 = useState(null)
  const [user, setUser]                   = useState(null)
  const [showAuth, setShowAuth]           = useState(false)
  const [showHistory, setShowHistory]     = useState(false)
  const streamRef = useRef(null)

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
    setJobStatus(prev => prev ? { ...prev, ...data } : data)
    if (['complete', 'error'].includes(data.status)) {
      setIsSubmitting(false)
      stopStream()
      if (data.error) setError(data.error)
    }
  }, [])

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!question.trim() || isSubmitting) return
    setError(null); setJobStatus(null); setIsSubmitting(true); stopStream()
    try {
      const res = await researchAPI.start(question.trim(), fhirPatientId)
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

  const handleReset = () => { stopStream(); setJobStatus(null); setError(null); setIsSubmitting(false); setQuestion('') }
  const handleLogout = () => { sessionStorage.removeItem('cm_token'); setUser(null) }
  const loadHistory = async (job_id) => {
    setShowHistory(false)
    try { const r = await researchAPI.status(job_id); setJobStatus(r.data); setQuestion(r.data.question) } catch {}
  }

  const isRunning  = isSubmitting || (jobStatus && !['complete','error'].includes(jobStatus?.status))
  const isComplete = jobStatus?.status === 'complete'

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

        {/* ── SEARCH HERO ─────────────────────────────────────── */}
        <AnimatePresence>
          {!jobStatus && (
            <motion.div
              className="max-w-4xl mx-auto text-center mb-16"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.6 }}
            >
              {/* Badge */}
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100 mb-8"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-sm text-slate-700">PubMed · ClinicalTrials.gov · FHIR R4 · Claude AI</span>
              </motion.div>

              {/* Headline */}
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
              >
                <h2 className="text-5xl font-extrabold text-slate-900 mb-3 tracking-tight leading-tight">
                  Evidence-Based Answers
                </h2>
                <h2 className="text-5xl font-extrabold mb-6 tracking-tight">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    in Seconds
                  </span>
                </h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                  Ask a clinical question. ClinicalMind extracts PICO, searches PubMed and
                  ClinicalTrials.gov, detects contradictions, and synthesises a clinical report.
                </p>
              </motion.div>

              {/* Search box */}
              <motion.form
                onSubmit={handleSubmit}
                className="max-w-3xl mx-auto mb-4"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
                  <div className="relative bg-white rounded-2xl shadow-lg border border-slate-200 p-2 hover:shadow-xl transition-shadow">
                    <div className="flex items-start gap-3 px-4 pt-3 pb-1">
                      <Search className="w-5 h-5 text-slate-400 mt-1 shrink-0" />
                      <textarea
                        value={question}
                        onChange={e => setQuestion(e.target.value)}
                        placeholder="e.g. What is the efficacy of metformin for type 2 diabetes prevention?"
                        rows={2}
                        className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 resize-none focus:outline-none leading-relaxed text-sm"
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() } }}
                      />
                    </div>
                    <div className="flex items-center justify-between px-4 py-2">
                      <p className="text-xs text-slate-400">Enter to search · Shift+Enter for newline</p>
                      <motion.button
                        type="submit"
                        disabled={!question.trim() || isSubmitting}
                        className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600
                                   text-white text-sm font-medium rounded-xl shadow-sm disabled:opacity-50"
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      >
                        {isSubmitting ? <><Spinner />Analysing…</> : <>Research <ChevronRight className="w-4 h-4" /></>}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.form>

              {/* FHIR Patient Context */}
              <motion.div
                className="max-w-3xl mx-auto mb-8"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
              >
                <FhirPatient onPatientSelected={setFhirPatientId} />
              </motion.div>

              {/* Example questions */}
              <motion.div
                className="max-w-3xl mx-auto text-left"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Try an Example</p>
                <div className="grid gap-2.5">
                  {EXAMPLE_QUESTIONS.map((q, i) => (
                    <motion.button
                      key={i}
                      onClick={() => setQuestion(q)}
                      className="group text-left px-5 py-3.5 bg-white rounded-xl border border-slate-200
                                 hover:border-blue-300 hover:shadow-md transition-all"
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.65 + i * 0.08 }}
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-700 group-hover:text-slate-900">{q}</span>
                        <Search className="w-3.5 h-3.5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-3" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* AI Agents preview */}
              <motion.div
                className="max-w-3xl mx-auto mt-16"
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-6 text-center">
                  Powered by 6 Specialised AI Agents
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { icon: Activity,  label: 'FHIR Context',  desc: 'Reads patient EMR data',     color: 'bg-teal-500' },
                    { icon: Search,    label: 'PICO + Search', desc: 'PubMed & ClinicalTrials.gov', color: 'bg-blue-500' },
                    { icon: FileText,  label: 'Summarizer',    desc: 'Extracts insights per paper', color: 'bg-purple-500' },
                    { icon: AlertTriangle, label: 'Contradiction', desc: 'Flags conflicting findings', color: 'bg-amber-500' },
                    { icon: BarChart3, label: 'Synthesize',    desc: 'Builds clinical report',      color: 'bg-emerald-500' },
                    { icon: Brain,     label: 'Claude AI',     desc: 'Anthropic sonnet model',      color: 'bg-indigo-500' },
                  ].map((a, i) => (
                    <motion.div
                      key={i}
                      className="bg-white rounded-xl p-4 border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all text-left"
                      whileHover={{ y: -3 }}
                    >
                      <div className={`w-9 h-9 ${a.color} rounded-lg flex items-center justify-center mb-3 shadow-sm`}>
                        <a.icon className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{a.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{a.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
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
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                          >
                            <EvidenceCard summary={s} index={i} />
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
                    <ReportPanel report={jobStatus.report} question={jobStatus.question} />
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

      {/* Footer */}
      <footer className="relative z-10 mt-20 border-t border-slate-200/60 bg-white/40 backdrop-blur py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-500">ClinicalMind v3 · FastAPI · LangGraph · FHIR R4 · Anthropic Claude</p>
          <p className="text-xs text-slate-500">For research only · Not a substitute for clinical judgment</p>
        </div>
      </footer>

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
