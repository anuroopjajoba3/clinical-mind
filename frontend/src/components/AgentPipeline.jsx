import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, SkipForward, Loader2 } from 'lucide-react'

const AGENTS = [
  { key: 'fhir',             num: '01', label: 'FHIR Context',     desc: 'Fetching EMR patient data',         doneMsg: 'Patient context loaded' },
  { key: 'pico',             num: '02', label: 'PICO Extraction',  desc: 'Structuring clinical question',     doneMsg: 'Framework extracted' },
  { key: 'search',           num: '03', label: 'Evidence Search',  desc: 'Querying PubMed + ClinicalTrials',  doneMsg: 'Papers retrieved' },
  { key: 'summarizer',       num: '04', label: 'Summarizer',       desc: 'Analysing abstracts',               doneMsg: 'Summaries ready' },
  { key: 'contradiction',    num: '05', label: 'Contradiction',    desc: 'Detecting conflicting findings',    doneMsg: 'Analysis done' },
  { key: 'drug_interaction', num: '06', label: 'Drug Interaction', desc: 'Checking medication safety',        doneMsg: 'Interactions checked' },
  { key: 'synthesize',       num: '07', label: 'Synthesize',       desc: 'Generating clinical report',        doneMsg: 'Report ready' },
  { key: 'followup',         num: '08', label: 'Follow-up',        desc: 'Identifying evidence gaps',         doneMsg: 'Follow-ups generated' },
]

function StatusIcon({ status, size = 16 }) {
  if (status === 'complete') return (
    <motion.span
      initial={{ scale: 0 }} animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
      <CheckCircle size={size} style={{ color: '#10B981' }} strokeWidth={2.5} />
    </motion.span>
  )
  if (status === 'running') return (
    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
      <Loader2 size={size} style={{ color: '#3B82F6' }} strokeWidth={2} />
    </motion.span>
  )
  if (status === 'error') return (
    <XCircle size={size} style={{ color: '#EF4444' }} strokeWidth={2} />
  )
  if (status === 'skipped') return (
    <SkipForward size={size} style={{ color: '#9CA3AF' }} strokeWidth={2} />
  )
  return (
    <span style={{
      width: size, height: size,
      borderRadius: '50%',
      border: '1.5px solid #D1CEC9',
      display: 'inline-block',
    }} />
  )
}

function AgentRow({ agent, status, index, compact }) {
  const isRunning  = status === 'running'
  const isComplete = status === 'complete'
  const isError    = status === 'error'
  const isSkipped  = status === 'skipped'

  const numClass = isRunning  ? 'step-running'
    : isComplete ? 'step-complete'
    : isError    ? 'step-error'
    : isSkipped  ? 'step-skipped'
    : 'step-idle'

  const labelColor = isRunning  ? '#1D4ED8'
    : isComplete ? '#065F46'
    : isError    ? '#DC2626'
    : isSkipped  ? '#9CA3AF'
    : '#374151'

  const subText = isRunning  ? agent.desc
    : isComplete ? agent.doneMsg
    : isSkipped  ? 'skipped'
    : isError    ? 'error'
    : agent.desc

  const subColor = isRunning  ? '#6B9FE4'
    : isComplete ? '#6EE7B7'
    : isError    ? '#FCA5A5'
    : '#9CA3AF'

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.04, duration: 0.25 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          borderRadius: 3,
          background: isRunning ? '#EFF6FF' : isComplete ? '#F0FDF4' : 'transparent',
          borderLeft: isRunning ? '2px solid #3B82F6' : isComplete ? '2px solid #10B981' : '2px solid transparent',
          marginBottom: 2,
        }}>
        <span className={`step-number ${numClass}`} style={{ width: 20, height: 20, fontSize: 9 }}>
          {agent.num}
        </span>
        <span style={{ flex: 1, fontFamily: 'Inter', fontSize: 12, fontWeight: 500, color: labelColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {agent.label}
        </span>
        <StatusIcon status={status} size={13} />
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 4,
        position: 'relative',
        overflow: 'hidden',
        background: isRunning ? '#EFF6FF' : isComplete ? '#F0FDF4' : '#FAFAF8',
        borderLeft: isRunning ? '3px solid #3B82F6'
          : isComplete ? '3px solid #10B981'
          : isError    ? '3px solid #EF4444'
          : '3px solid #E5E1D8',
        marginBottom: 2,
      }}>

      {/* Running shimmer */}
      {isRunning && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.06) 50%, transparent 100%)',
          animation: 'shimmer 2.2s ease-in-out infinite',
          transform: 'translateX(-100%)',
        }} />
      )}

      <span className={`step-number ${numClass}`}>{agent.num}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 600, color: labelColor, lineHeight: 1.3 }}>
          {agent.label}
        </p>
        <p style={{ fontFamily: 'Inter', fontSize: 11, color: subColor, marginTop: 1, lineHeight: 1 }}>
          {isRunning && (
            <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center', marginRight: 4 }}>
              {[0,1,2].map(i => (
                <span key={i} className="dot-pulse" style={{
                  width: 3, height: 3, borderRadius: '50%', background: '#3B82F6', display: 'inline-block',
                  animationDelay: `${i * 0.15}s`,
                }} />
              ))}
            </span>
          )}
          {subText}
        </p>
      </div>

      <StatusIcon status={status} size={15} />
    </motion.div>
  )
}

function PipelineConnector({ fromComplete }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', paddingLeft: 22, margin: '1px 0' }}>
      <div style={{
        width: 1,
        height: 8,
        background: fromComplete
          ? 'linear-gradient(to bottom, #10B981, #6EE7B7)'
          : '#D1CEC9',
        transition: 'background 0.4s ease',
      }} />
    </div>
  )
}

export default function AgentPipeline({ agentStatus, compact = false }) {
  if (!agentStatus) return null

  return (
    <div style={{ width: '100%' }}>
      {!compact && (
        <p className="section-label" style={{ marginBottom: 10 }}>Agent Pipeline</p>
      )}
      <div>
        {AGENTS.map((agent, i) => (
          <React.Fragment key={agent.key}>
            <AgentRow
              agent={agent}
              status={agentStatus[agent.key] || 'idle'}
              index={i}
              compact={compact}
            />
            {i < AGENTS.length - 1 && (
              <PipelineConnector fromComplete={agentStatus[agent.key] === 'complete'} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
