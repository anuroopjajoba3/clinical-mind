import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LogOut, X, AlertTriangle, Clock, Search, BarChart3, Brain,
  ChevronRight, FileText, Zap, ArrowRight, RefreshCw, CheckCheck,
  Activity,
} from 'lucide-react'
import { researchAPI, compareAPI, createJobStream, authAPI } from './api'
import DischargeDashboard from './components/DischargeDashboard'
import AgentPipeline   from './components/AgentPipeline'
import EvidenceCard    from './components/EvidenceCard'
import ReportPanel     from './components/ReportPanel'
import AuthScreen      from './components/AuthScreen'
import AppLoader       from './components/AppLoader'
import WorkflowStrip   from './components/WorkflowStrip'
import SearchHistory   from './components/SearchHistory'
import PatientDetailPanel from './components/PatientDetailPanel'
import ComparisonPanel    from './components/ComparisonPanel'
import CDSHooksDemo       from './components/CDSHooksDemo'
import PatientRail        from './components/PatientRail'
import PatientDashboard   from './components/PatientDashboard'

// ── constants ──────────────────────────────────────────────────────
const EXAMPLE_QUESTIONS = [
  'What is the efficacy of GLP-1 receptor agonists for type 2 diabetes?',
  'Best treatments for heart failure with reduced ejection fraction?',
  'Is aspirin effective for primary prevention of cardiovascular events?',
  'What is the evidence for SGLT2 inhibitors in chronic kidney disease?',
]

const ALL_AGENTS = ['fhir','pico','search','summarizer','contradiction','drug_interaction','synthesize','followup']

// ── design tokens ─────────────────────────────────────────────────
const T = {
  cream:     '#F7F3EC',
  white:     '#FFFFFF',
  navy:      '#0A1628',
  navyLight: '#1E3A5F',
  muted:     '#6B7280',
  border:    '#E5E1D8',
  borderMid: '#C5BFB3',
  blue:      '#2563EB',
  green:     '#10B981',
  red:       '#EF4444',
  amber:     '#F59E0B',
}

// ── motion presets ─────────────────────────────────────────────────
const fadeUp = {
  initial:    { opacity: 0, y: 14 },
  animate:    { opacity: 1, y: 0 },
  exit:       { opacity: 0, y: -8 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
}
const fadeIn = {
  initial:    { opacity: 0 },
  animate:    { opacity: 1 },
  exit:       { opacity: 0 },
  transition: { duration: 0.2 },
}

// ── sub-components ─────────────────────────────────────────────────

function Spinner() {
  return (
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
      style={{ display: 'inline-block', lineHeight: 1 }}>
      <RefreshCw size={14} strokeWidth={2.5} />
    </motion.span>
  )
}

function PICOBadge({ pico }) {
  if (!pico) return null
  const items = [
    { key: 'P', label: 'Population',   value: pico.population,   cls: 'pico-p' },
    { key: 'I', label: 'Intervention', value: pico.intervention, cls: 'pico-i' },
    { key: 'C', label: 'Comparison',   value: pico.comparison,   cls: 'pico-c' },
    { key: 'O', label: 'Outcome',      value: pico.outcome,      cls: 'pico-o' },
  ]
  return (
    <motion.div className="card-editorial" style={{ padding: '16px 20px' }} {...fadeUp}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Brain size={15} style={{ color: T.navyLight }} strokeWidth={2} />
        <span style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.muted }}>
          PICO Framework
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {items.map(({ key, label, value, cls }) => (
          <div key={key} style={{ padding: '10px 12px', borderRadius: 3 }}
               className={cls}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
              <span style={{ fontFamily: 'DM Serif Display', fontSize: 18, fontWeight: 400 }}>{key}</span>
              <span style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.7 }}>{label}</span>
            </div>
            <p style={{ fontFamily: 'Inter', fontSize: 12, lineHeight: 1.5, color: T.navy }}>{value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function DrugInteractionAlert({ interactions }) {
  if (!interactions?.length) return null
  const majors = interactions.filter(i => i.severity === 'major')
  return (
    <motion.div className="alert-red" style={{ padding: '14px 18px' }} {...fadeUp}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <AlertTriangle size={15} style={{ color: T.red }} strokeWidth={2} />
        <span style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: '#991B1B' }}>
          {interactions.length} Drug Interaction{interactions.length > 1 ? 's' : ''} Detected
        </span>
        {majors.length > 0 && (
          <span className="tag-base" style={{ background: T.red, color: '#fff' }}>
            {majors.length} major
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {interactions.map((d, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span className="tag-base" style={{
              background: d.severity === 'major' ? T.red : '#FCA5A5',
              color: d.severity === 'major' ? '#fff' : '#7F1D1D',
              flexShrink: 0, marginTop: 1,
            }}>{d.severity}</span>
            <span style={{ fontFamily: 'Inter', fontSize: 12, color: '#7F1D1D', lineHeight: 1.5 }}>{d.description}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function ContradictionAlert({ contradictions }) {
  if (!contradictions?.length) return null
  return (
    <motion.div className="alert-amber" style={{ padding: '14px 18px' }} {...fadeUp}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Zap size={15} style={{ color: T.amber }} strokeWidth={2} />
        <span style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: '#92400E' }}>
          {contradictions.length} Conflicting Finding{contradictions.length > 1 ? 's' : ''}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {contradictions.map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span className="tag-base" style={{
              background: c.severity === 'major' ? T.amber : '#FDE68A',
              color: c.severity === 'major' ? '#fff' : '#78350F',
              flexShrink: 0, marginTop: 1,
            }}>{c.severity}</span>
            <span style={{ fontFamily: 'Inter', fontSize: 12, color: '#78350F', lineHeight: 1.5 }}>{c.conflict}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function ErrorBanner({ msg }) {
  return (
    <motion.div className="alert-red" style={{ padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 10 }}
      {...fadeUp}>
      <AlertTriangle size={15} style={{ color: T.red, flexShrink: 0, marginTop: 1 }} />
      <div>
        <p style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: '#991B1B' }}>Error</p>
        <p style={{ fontFamily: 'Inter', fontSize: 12, color: '#7F1D1D', marginTop: 3, lineHeight: 1.5 }}>{msg}</p>
      </div>
    </motion.div>
  )
}

// ── main app ───────────────────────────────────────────────────────
export default function App() {
  const [question, setQuestion]               = useState('')
  const [fhirPatientId, setFhirPatientId]     = useState(null)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [jobStatus, setJobStatus]             = useState(null)
  const [isSubmitting, setIsSubmitting]       = useState(false)
  const [error, setError]                     = useState(null)
  const [user, setUser]                       = useState(null)
  const [authReady, setAuthReady]             = useState(false)
  const [showHistory, setShowHistory]         = useState(false)
  const [detailPatientId, setDetailPatientId] = useState(null)
  const [sessionMemory, setSessionMemory]     = useState({})
  const [highlightedSource, setHighlightedSource] = useState(null)
  const highlightTimerRef = useRef(null)
  const streamRef    = useRef(null)
  const searchBarRef = useRef(null)
  const [compareMode, setCompareMode]     = useState(false)
  const [questionB, setQuestionB]         = useState('')
  const [compareStatus, setCompareStatus] = useState(null)
  const comparePollerRef = useRef(null)
  const [mainView, setMainView] = useState('search')
  const [searchFocused, setSearchFocused] = useState(false)

  useEffect(() => {
    const token = sessionStorage.getItem('cm_token')
    if (!token) {
      setAuthReady(true)
      return
    }
    authAPI.me()
      .then(r => setUser({
        email: r.data.email,
        name: r.data.full_name || r.data.email.split('@')[0],
      }))
      .catch(() => sessionStorage.removeItem('cm_token'))
      .finally(() => setAuthReady(true))
  }, [])

  const stopStream = () => {
    if (streamRef.current) { streamRef.current.close(); streamRef.current = null }
  }

  const handleJobData = useCallback((data) => {
    setJobStatus(prev => {
      const next = prev ? { ...prev, ...data } : data
      if (data.status === 'complete' && data.report && Object.keys(data.report).length > 0) {
        const key    = fhirPatientId || '__global__'
        const answer = data.report.clinical_bottom_line || data.report.summary || 'Evidence synthesis complete.'
        setSessionMemory(mem => {
          const existing = mem[key] || []
          const entry    = { question: next.question || '', answer: String(answer).slice(0, 400) }
          return { ...mem, [key]: [...existing.slice(-4), entry] }
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
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
    setHighlightedSource(index)
    const el = document.getElementById(`source-${index}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    highlightTimerRef.current = setTimeout(() => setHighlightedSource(null), 2500)
  }

  const handleFollowupClick = (q) => {
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
            stopComparePoller(); setIsSubmitting(false)
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
      const history    = sessionMemory[sessionKey] || []
      const res        = await researchAPI.start(question.trim(), fhirPatientId, history)
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

  const smartSuggestions = (() => {
    if (!selectedPatient?.risk?.flags?.length) return []
    const flags = selectedPatient.risk.flags
    const conds = selectedPatient.active_conditions || []
    const suggestions = []
    const egfrFlag = flags.find(f => /eGFR/i.test(f))
    if (egfrFlag) {
      const match = egfrFlag.match(/eGFR\s*([\d.]+)/i)
      suggestions.push(`What is the evidence for slowing CKD progression in T2DM with eGFR ${match ? match[1] : '42'}?`)
    }
    if (flags.find(f => /HbA1c/i.test(f)))
      suggestions.push("What is the optimal HbA1c target for elderly patients with type 2 diabetes and CKD?")
    const medFlag = flags.find(f => /metformin|NSAID|ACE|ARB|statin/i.test(f))
    if (medFlag)
      suggestions.push(`What are the risks of ${medFlag.match(/metformin|NSAID|ACE inhibitor|ARB|statin/i)?.[0] || 'this medication'} in patients with reduced kidney function?`)
    if (flags.find(f => /NT-proBNP|heart failure/i.test(f)))
      suggestions.push("What does elevated NT-proBNP indicate and how should it be managed in outpatient CKD?")
    if (suggestions.length === 0 && conds.length > 0)
      suggestions.push(`What is the best evidence-based management of ${conds[0]} in 2024?`)
    return suggestions.slice(0, 3)
  })()

  const handleReset = () => {
    stopStream(); stopComparePoller()
    setJobStatus(null); setCompareStatus(null)
    setError(null); setIsSubmitting(false); setQuestion(''); setQuestionB('')
    if (selectedPatient) setMainView('dashboard')
  }
  const handleLogout = () => {
    stopStream()
    stopComparePoller()
    sessionStorage.removeItem('cm_token')
    setUser(null)
    setJobStatus(null)
    setCompareStatus(null)
    setSelectedPatient(null)
    setFhirPatientId(null)
    setMainView('search')
  }
  const loadHistory   = async (job_id) => {
    setShowHistory(false)
    try { const r = await researchAPI.status(job_id); setJobStatus(r.data); setQuestion(r.data.question) } catch {}
  }

  const hasFullReport      = Boolean(jobStatus?.report && Object.keys(jobStatus.report).length > 0)
  const isEffectivelyDone  = hasFullReport || ['complete','error'].includes(jobStatus?.status)
  const isRunning          = !isEffectivelyDone && (isSubmitting || (jobStatus && !['complete','error'].includes(jobStatus?.status)))
  const isComplete         = isEffectivelyDone && !jobStatus?.error

  if (!authReady) return <AppLoader />
  if (!user) return <AuthScreen onAuthenticated={setUser} />

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#F8FAFC', position: 'relative' }}>

      {/* ── AMBIENT BACKGROUND BLOBS ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -40, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: '-10%', right: '10%',
            width: 600, height: 600, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, rgba(14,116,144,0.06) 50%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], x: [0, -25, 0], y: [0, 50, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
          style={{
            position: 'absolute', bottom: '5%', left: '20%',
            width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, rgba(79,70,229,0.05) 50%, transparent 70%)',
            filter: 'blur(70px)',
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], x: [0, 20, 0], y: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          style={{
            position: 'absolute', top: '40%', right: '30%',
            width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />
      </div>

      {/* ── LEFT RAIL ── */}
      <PatientRail
        selectedPatient={selectedPatient}
        onSelectPatient={p => {
          setSelectedPatient(p)
          handlePatientSelected(p)
          setMainView('dashboard')
        }}
        onNewSearch={() => { handleReset(); setMainView('search') }}
      />

      {/* ── MAIN AREA ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 1 }}>

        {/* ── TOP BAR ── */}
        <motion.header
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="h-[62px] flex-shrink-0 flex items-center justify-between px-6 border-b border-slate-100"
          style={{ backdropFilter: 'blur(16px)', background: 'rgba(255,255,255,0.80)', boxShadow: '0 1px 0 rgba(0,0,0,0.04)' }}
        >
          {/* Brand */}
          <a href="/" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ scale: 1.06, rotate: -2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="w-8 h-8 rounded-lg bg-[#060E1A] flex items-center justify-center"
            >
              <span className="font-sans text-[11px] font-extrabold text-[#67C5D5]">CM</span>
            </motion.div>
            <span className="font-sans text-[15px] font-bold text-slate-900 tracking-tight">ClinicalMed</span>
          </a>

          {/* Nav pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1">
            {[
              { id: 'search',    label: 'Evidence',  icon: Search },
              { id: 'discharge', label: 'Discharge', icon: Activity },
            ].map(({ id, label, icon: Icon }) => (
              <motion.button
                key={id}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => setMainView(id)}
                className={`relative inline-flex items-center gap-2 px-3.5 py-2 rounded-lg font-sans text-[12px] font-semibold transition-colors ${
                  mainView === id
                    ? 'text-slate-900'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {mainView === id && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-white rounded-lg shadow-sm"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon size={13} strokeWidth={2} className="relative z-10" />
                <span className="relative z-10">{label}</span>
              </motion.button>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowHistory(true)}
              className="inline-flex items-center gap-2 font-sans text-[12px] font-medium text-slate-500 hover:text-slate-800 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Clock size={13} strokeWidth={2} />
              History
            </motion.button>

            <div className="w-px h-5 bg-slate-200 mx-1" />

            <div className="flex items-center gap-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0E7490] to-[#0EA5E9] flex items-center justify-center text-white font-sans text-[12px] font-bold cursor-default shadow-sm"
              >
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </motion.div>
              <span className="font-sans text-[13px] font-medium text-slate-700 hidden sm:inline max-w-[120px] truncate">{user.name}</span>
              <motion.button
                type="button"
                onClick={handleLogout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Sign out"
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <LogOut size={15} strokeWidth={1.75} />
              </motion.button>
            </div>
          </div>
        </motion.header>

        {/* ── CONTENT ── */}
        <AnimatePresence mode="wait" initial={false}>
          {mainView === 'discharge' ? (
            <motion.div key="discharge" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
              {...fadeIn}>
              <DischargeDashboard />
            </motion.div>
          ) : mainView === 'dashboard' && selectedPatient ? (
            <motion.div key="dashboard" style={{ flex: 1, overflow: 'hidden' }}
              {...fadeIn}>
              <PatientDashboard
                patient={selectedPatient}
                onOpenInsight={ins => ins?.job_id && loadHistory(ins.job_id)}
                onSearchEvidence={() => setMainView('search')}
              />
            </motion.div>
          ) : (
            <motion.div
              key="search"
              className="flex-1 overflow-y-auto"
              style={{ background: 'transparent' }}
              {...fadeIn}
            >
              <div className="max-w-[760px] mx-auto px-6 py-10 pb-16">

                {/* ── EMPTY STATE / SEARCH ── */}
                <AnimatePresence>
                  {!jobStatus && !compareStatus && (
                    <motion.div {...fadeUp} key="empty-state">
                      {!selectedPatient && <WorkflowStrip />}

                      <div className="mb-8">
                        <motion.p
                          style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0E7490', marginBottom: 10 }}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          transition={{ duration: 0.4 }}
                        >
                          {selectedPatient ? 'Patient Evidence Search' : 'Clinical Evidence'}
                        </motion.p>
                        <motion.h1
                          style={{ fontFamily: 'Inter', fontSize: 'clamp(1.75rem,3vw,2.4rem)', fontWeight: 800, color: '#0A1628', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 10 }}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        >
                          {selectedPatient ? (
                            <>Evidence for <span style={{ color: '#0E7490' }}>{selectedPatient.full_name}</span></>
                          ) : (
                            'Run a clinical evidence search'
                          )}
                        </motion.h1>
                        <motion.p
                          style={{ fontFamily: 'Inter', fontSize: 14, color: '#64748B', lineHeight: 1.7, maxWidth: 480 }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1, duration: 0.4 }}
                        >
                          {selectedPatient
                            ? "LangGraph agents will use this patient's FHIR context, search PubMed and trials, and stream a synthesis."
                            : 'Select a patient or search globally. Eight agents · live SSE · EMR write-back.'}
                        </motion.p>
                      </div>

                      {/* Search box */}
                      <motion.form
                        onSubmit={compareMode ? (e) => { e.preventDefault(); handleCompareSubmit() } : handleSubmit}
                        style={{ marginBottom: 20 }}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.18, duration: 0.4 }}>
                        <motion.div
                          layout
                          style={{
                            borderRadius: 16,
                            overflow: 'hidden',
                            background: 'rgba(255,255,255,0.85)',
                            backdropFilter: 'blur(12px)',
                            border: searchFocused ? '1.5px solid rgba(14,116,144,0.5)' : '1.5px solid rgba(14,116,144,0.15)',
                            boxShadow: searchFocused
                              ? '0 0 0 3px rgba(6,182,212,0.10), 0 8px 40px rgba(10,22,40,0.10)'
                              : '0 4px 24px rgba(10,22,40,0.06)',
                            transition: 'border-color 0.2s, box-shadow 0.2s',
                          }}
                        >

                          {/* Question A */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 18px 12px' }}>
                            {compareMode ? (
                              <span style={{
                                width: 22, height: 22, borderRadius: '50%',
                                background: '#EFF6FF', border: '1.5px solid #3B82F6',
                                color: '#2563EB', fontFamily: 'Inter', fontSize: 11, fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, marginTop: 3,
                              }}>A</span>
                            ) : (
                              <Search size={15} style={{ color: T.muted, flexShrink: 0, marginTop: 4 }} strokeWidth={2} />
                            )}
                            <textarea
                              ref={searchBarRef}
                              value={question}
                              onChange={e => setQuestion(e.target.value)}
                              onFocus={() => setSearchFocused(true)}
                              onBlur={() => setSearchFocused(false)}
                              placeholder={compareMode
                                ? "First treatment or clinical question…"
                                : "e.g. What is the evidence for GLP-1 agonists in type 2 diabetes management?"}
                              rows={2}
                              style={{
                                flex: 1, background: 'transparent', resize: 'none',
                                border: 'none', outline: 'none',
                                fontFamily: 'Inter', fontSize: 14, color: T.navy,
                                lineHeight: 1.6, caretColor: T.blue,
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey && !compareMode) {
                                  e.preventDefault(); handleSubmit()
                                }
                              }}
                            />
                          </div>

                          {/* Question B (compare mode) */}
                          <AnimatePresence>
                            {compareMode && (
                              <motion.div
                                style={{
                                  display: 'flex', alignItems: 'flex-start', gap: 12,
                                  padding: '10px 18px 12px',
                                  borderTop: `1px solid ${T.border}`,
                                }}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}>
                                <span style={{
                                  width: 22, height: 22, borderRadius: '50%',
                                  background: '#FDF4FF', border: '1.5px solid #7C3AED',
                                  color: '#7C3AED', fontFamily: 'Inter', fontSize: 11, fontWeight: 700,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  flexShrink: 0, marginTop: 3,
                                }}>B</span>
                                <textarea
                                  value={questionB}
                                  onChange={e => setQuestionB(e.target.value)}
                                  placeholder="Second treatment or question to compare…"
                                  rows={2}
                                  style={{
                                    flex: 1, background: 'transparent', resize: 'none',
                                    border: 'none', outline: 'none',
                                    fontFamily: 'Inter', fontSize: 14, color: T.navy, lineHeight: 1.6,
                                  }}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Bottom bar */}
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 18px',
                            borderTop: '1px solid rgba(14,116,144,0.08)',
                            background: 'rgba(248,250,252,0.6)',
                          }}>
                            <motion.button type="button"
                              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                              onClick={() => { setCompareMode(m => !m); setQuestionB('') }}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                fontSize: 12, padding: '6px 14px', borderRadius: 8,
                                fontFamily: 'Inter', fontWeight: 600, cursor: 'pointer',
                                background: compareMode ? 'rgba(124,58,237,0.08)' : 'transparent',
                                border: compareMode ? '1px solid rgba(124,58,237,0.3)' : '1px solid rgba(14,116,144,0.2)',
                                color: compareMode ? '#7C3AED' : '#0E7490',
                                transition: 'all 0.15s',
                              }}>
                              <BarChart3 size={13} strokeWidth={2} />
                              {compareMode ? 'Cancel compare' : 'Compare two'}
                            </motion.button>

                            <motion.button
                              type="submit"
                              whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(6,182,212,0.3)' }}
                              whileTap={{ scale: 0.97 }}
                              disabled={!question.trim() || (compareMode && !questionB.trim()) || isSubmitting}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                background: 'linear-gradient(135deg, #0A1628 0%, #0E2A45 100%)',
                                color: 'white', fontFamily: 'Inter', fontSize: 13, fontWeight: 600,
                                padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                                opacity: (!question.trim() || (compareMode && !questionB.trim()) || isSubmitting) ? 0.4 : 1,
                                transition: 'opacity 0.2s',
                              }}
                            >
                              {isSubmitting
                                ? <><Spinner /> Searching…</>
                                : compareMode
                                  ? <><BarChart3 size={13} /> Compare</>
                                  : <><Search size={13} /> Search Evidence <ArrowRight size={12} /></>
                              }
                            </motion.button>
                          </div>
                        </motion.div>
                      </motion.form>

                      {/* Session memory pill */}
                      {(() => {
                        const key = fhirPatientId || '__global__'
                        const history = sessionMemory[key] || []
                        return history.length > 0 ? (
                          <motion.div
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '8px 14px', marginBottom: 16, borderRadius: 10,
                              background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.18)',
                            }}
                            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Brain size={12} style={{ color: T.blue }} strokeWidth={2} />
                              <span style={{ fontFamily: 'Inter', fontSize: 12, color: '#1D4ED8' }}>
                                Session memory active · {history.length} prior {history.length === 1 ? 'query' : 'queries'} in context
                              </span>
                            </div>
                            <button onClick={() => setSessionMemory(m => ({ ...m, [key]: [] }))}
                                    style={{ fontFamily: 'Inter', fontSize: 11, color: T.blue, background: 'none', border: 'none', cursor: 'pointer' }}>
                              Clear
                            </button>
                          </motion.div>
                        ) : null
                      })()}

                      {/* Smart suggestions */}
                      <AnimatePresence>
                        {smartSuggestions.length > 0 && (
                          <motion.div style={{ marginBottom: 16 }}
                            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}>
                            <p className="section-label" style={{ marginBottom: 8 }}>
                              Suggested from {selectedPatient?.full_name?.split(' ')[0]}'s risk flags
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {smartSuggestions.map((q, i) => (
                                <motion.button key={i} onClick={() => setQuestion(q)}
                                  style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '11px 14px', textAlign: 'left', cursor: 'pointer',
                                    background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.2)',
                                    borderRadius: 10, width: '100%',
                                  }}
                                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.06 }}
                                  whileHover={{ x: 3, background: 'rgba(6,182,212,0.09)' }}>
                                  <span style={{ fontFamily: 'Inter', fontSize: 13, color: '#0E7490', lineHeight: 1.5 }}>{q}</span>
                                  <ChevronRight size={14} style={{ color: '#0E7490', flexShrink: 0 }} />
                                </motion.button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Example questions */}
                      {smartSuggestions.length === 0 && (
                        <motion.div
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          transition={{ delay: 0.3, duration: 0.4 }}>
                          <p className="section-label" style={{ marginBottom: 10 }}>Try these questions</p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {EXAMPLE_QUESTIONS.map((q, i) => (
                              <motion.button key={i} onClick={() => setQuestion(q)}
                                style={{
                                  padding: '12px 14px', textAlign: 'left',
                                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
                                  cursor: 'pointer', width: '100%',
                                  background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)',
                                  border: '1px solid rgba(14,116,144,0.12)', borderRadius: 12,
                                }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.32 + i * 0.07 }}
                                whileHover={{ y: -2, boxShadow: '0 4px 16px rgba(6,182,212,0.12)', borderColor: 'rgba(14,116,144,0.3)' }}>
                                <span style={{ fontFamily: 'Inter', fontSize: 12, color: '#334155', lineHeight: 1.5 }}>{q}</span>
                                <ChevronRight size={13} style={{ color: '#0E7490', flexShrink: 0, marginTop: 2 }} />
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── COMPARE RESULTS ── */}
                <AnimatePresence>
                  {compareStatus && (
                    <motion.div {...fadeUp} key="compare-results">

                      {/* Header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
                        <div>
                          <p className="section-label" style={{ marginBottom: 4 }}>Evidence Comparison</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <span style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              fontFamily: 'Inter', fontSize: 14, fontWeight: 600, color: '#1D4ED8',
                            }}>
                              <span style={{
                                width: 20, height: 20, borderRadius: '50%', background: '#2563EB', color: '#fff',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, fontWeight: 700, fontFamily: 'Inter',
                              }}>A</span>
                              {compareStatus.question_a}
                            </span>
                            <span style={{ fontFamily: 'Inter', fontSize: 12, color: T.muted }}>vs</span>
                            <span style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              fontFamily: 'Inter', fontSize: 14, fontWeight: 600, color: '#7C3AED',
                            }}>
                              <span style={{
                                width: 20, height: 20, borderRadius: '50%', background: '#7C3AED', color: '#fff',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, fontWeight: 700, fontFamily: 'Inter',
                              }}>B</span>
                              {compareStatus.question_b}
                            </span>
                          </div>
                        </div>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          onClick={handleReset} className="btn-ghost"
                          style={{ fontSize: 12, padding: '6px 12px', flexShrink: 0 }}>
                          <X size={13} /> New Search
                        </motion.button>
                      </div>

                      {(compareStatus.status === 'running' || compareStatus.status === 'pending') ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          {[
                            { label: 'A', q: compareStatus.question_a, status: compareStatus.agent_status_a, accentColor: '#2563EB', bg: '#EFF6FF' },
                            { label: 'B', q: compareStatus.question_b, status: compareStatus.agent_status_b, accentColor: '#7C3AED', bg: '#FDF4FF' },
                          ].map(({ label, q, status, accentColor, bg }) => (
                            <div key={label} className="card-editorial"
                                 style={{ padding: '14px', borderTop: `3px solid ${accentColor}` }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <span style={{
                                  width: 20, height: 20, borderRadius: '50%', background: accentColor, color: '#fff',
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 11, fontWeight: 700, fontFamily: 'Inter',
                                }}>{label}</span>
                                <p style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: accentColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{q}</p>
                              </div>
                              <AgentPipeline agentStatus={status || {}} compact />
                            </div>
                          ))}
                        </div>
                      ) : compareStatus.status === 'complete' ? (
                        <ComparisonPanel compareResult={compareStatus} />
                      ) : null}

                      {error && <ErrorBanner msg={error} />}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── RESULTS ── */}
                <AnimatePresence>
                  {jobStatus && (
                    <motion.div {...fadeUp} key="results">

                      {/* Question header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0E7490', marginBottom: 8 }}>Clinical Question</p>
                          <h2 style={{ fontFamily: 'Inter', fontSize: 'clamp(1.3rem,2.5vw,1.7rem)', fontWeight: 800, color: '#0A1628', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                            {jobStatus.question}
                          </h2>
                        </div>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          onClick={handleReset}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            fontSize: 12, padding: '7px 14px', borderRadius: 9, flexShrink: 0,
                            fontFamily: 'Inter', fontWeight: 600, cursor: 'pointer',
                            background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(14,116,144,0.2)',
                            color: '#0E7490', backdropFilter: 'blur(8px)',
                          }}>
                          <X size={13} /> New Search
                        </motion.button>
                      </div>

                      {error && <ErrorBanner msg={error} />}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Status badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <AnimatePresence mode="wait">
                            {isRunning ? (
                              <motion.div key="running" {...fadeIn}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 8,
                                  padding: '6px 16px', borderRadius: 20,
                                  background: 'rgba(6,182,212,0.10)', border: '1px solid rgba(6,182,212,0.3)',
                                  fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: '#0E7490',
                                }}>
                                <Spinner />
                                Synthesising evidence…
                              </motion.div>
                            ) : isComplete ? (
                              <motion.div key="complete" {...fadeIn}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 6,
                                  padding: '6px 16px', borderRadius: 20,
                                  background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.3)',
                                  fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: '#065F46',
                                }}>
                                <CheckCheck size={14} strokeWidth={2.5} />
                                Complete
                              </motion.div>
                            ) : (
                              <motion.div key="error" {...fadeIn}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 6,
                                  padding: '6px 16px', borderRadius: 20,
                                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                                  fontFamily: 'Inter', fontSize: 12, fontWeight: 600, color: '#DC2626',
                                }}>
                                <X size={13} strokeWidth={2.5} />
                                Stopped
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {jobStatus.summaries?.length > 0 && (
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '5px 12px', borderRadius: 4,
                              background: T.white, border: `1px solid ${T.border}`,
                              fontFamily: 'Inter', fontSize: 11, color: T.muted,
                            }}>
                              <FileText size={12} strokeWidth={2} />
                              <span>{jobStatus.summaries.filter(s => !s.is_trial).length} PubMed</span>
                              <span style={{ color: T.border }}>·</span>
                              <span>{jobStatus.summaries.filter(s => s.is_trial).length} Trials</span>
                            </div>
                          )}
                        </div>

                        {/* Agent pipeline card */}
                        <motion.div className="card-editorial"
                          style={{ padding: '16px 18px' }}
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05, duration: 0.35 }}>
                          <AgentPipeline agentStatus={jobStatus.agent_status} />
                        </motion.div>

                        {/* PICO */}
                        <PICOBadge pico={jobStatus.pico} />

                        {/* Alerts */}
                        <ContradictionAlert contradictions={jobStatus.contradictions} />
                        <DrugInteractionAlert interactions={jobStatus.report?.drug_interactions} />

                        {/* Evidence cards */}
                        {jobStatus.summaries?.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                              <p className="section-label">Evidence Sources</p>
                              <span style={{ fontFamily: 'Inter', fontSize: 11, color: T.muted }}>
                                {jobStatus.summaries.length} sources
                              </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              {jobStatus.summaries.map((s, i) => (
                                <motion.div key={s.pmid || i} id={`source-${i}`}
                                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.04 }}>
                                  <EvidenceCard summary={s} index={i} highlighted={highlightedSource === i} />
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {/* Skeleton loaders */}
                        {isRunning && !jobStatus.summaries?.length && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[1,2,3].map(i => (
                              <div key={i} className="skeleton" style={{ height: 88, opacity: 0.6 }} />
                            ))}
                          </div>
                        )}

                        {/* Report */}
                        {jobStatus.report && Object.keys(jobStatus.report).length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}>
                            <ReportPanel
                              report={jobStatus.report}
                              question={jobStatus.question}
                              onCiteClick={handleCiteClick}
                              onFollowupClick={handleFollowupClick}
                            />
                          </motion.div>
                        )}

                        {isRunning && jobStatus.summaries?.length > 0 && !jobStatus.report && (
                          <div className="skeleton" style={{ height: 160, opacity: 0.5 }} />
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* CDS Hooks */}
                <div style={{ marginTop: 32, marginBottom: 16 }}>
                  <CDSHooksDemo />
                </div>

                {/* Footer */}
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
                  <p style={{ fontFamily: 'Inter', fontSize: 11, color: T.muted }}>
                    ClinicalMed · FastAPI · LangGraph · FHIR R4 · Claude
                  </p>
                  <p style={{ fontFamily: 'Inter', fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                    For research use only · Not a substitute for clinical judgment
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── PATIENT DETAIL DRAWER ── */}
      <AnimatePresence>
        {detailPatientId && (
          <PatientDetailPanel fhirId={detailPatientId} onClose={() => setDetailPatientId(null)} />
        )}
      </AnimatePresence>

      {/* ── HISTORY DRAWER ── */}
      <AnimatePresence>
        {showHistory && (
          <SearchHistory onClose={() => setShowHistory(false)} onLoad={loadHistory} />
        )}
      </AnimatePresence>
    </div>
  )
}
