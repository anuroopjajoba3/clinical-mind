import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, SkipForward, Loader2 } from 'lucide-react'

const AGENTS = [
  { key: 'fhir',             num: '01', label: 'FHIR Context',     desc: 'Fetching EMR patient data',        doneMsg: 'Patient context loaded' },
  { key: 'pico',             num: '02', label: 'PICO Extraction',  desc: 'Structuring clinical question',    doneMsg: 'Framework extracted' },
  { key: 'search',           num: '03', label: 'Evidence Search',  desc: 'Querying PubMed + ClinicalTrials', doneMsg: 'Papers retrieved' },
  { key: 'summarizer',       num: '04', label: 'Summarizer',       desc: 'Analysing abstracts',              doneMsg: 'Summaries ready' },
  { key: 'contradiction',    num: '05', label: 'Contradiction',    desc: 'Detecting conflicting findings',   doneMsg: 'Analysis done' },
  { key: 'drug_interaction', num: '06', label: 'Drug Interaction', desc: 'Checking medication safety',       doneMsg: 'Interactions checked' },
  { key: 'synthesize',       num: '07', label: 'Synthesize',       desc: 'Generating clinical report',       doneMsg: 'Report ready' },
  { key: 'followup',         num: '08', label: 'Follow-up',        desc: 'Identifying evidence gaps',        doneMsg: 'Follow-ups generated' },
]

function StatusIcon({ status, size = 16 }) {
  if (status === 'complete') return (
    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
      <CheckCircle size={size} style={{ color: '#10B981' }} strokeWidth={2.5} />
    </motion.span>
  )
  if (status === 'running') return (
    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
      <Loader2 size={size} style={{ color: '#06B6D4' }} strokeWidth={2} />
    </motion.span>
  )
  if (status === 'error') return <XCircle size={size} style={{ color: '#EF4444' }} strokeWidth={2} />
  if (status === 'skipped') return <SkipForward size={size} style={{ color: '#64748B' }} strokeWidth={2} />
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%',
      border: '1.5px solid rgba(14,116,144,0.2)', display: 'inline-block',
    }} />
  )
}

function AgentRow({ agent, status, index, compact }) {
  const isRunning  = status === 'running'
  const isComplete = status === 'complete'
  const isError    = status === 'error'
  const isSkipped  = status === 'skipped'

  const subText = isRunning  ? agent.desc
    : isComplete ? agent.doneMsg
    : isSkipped  ? 'skipped'
    : isError    ? 'error'
    : agent.desc

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.04, duration: 0.25 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '5px 10px', borderRadius: 8, marginBottom: 2,
          background: isRunning ? 'rgba(6,182,212,0.08)' : isComplete ? 'rgba(16,185,129,0.07)' : 'transparent',
          borderLeft: isRunning ? '2px solid #06B6D4' : isComplete ? '2px solid #10B981' : '2px solid transparent',
        }}>
        <span style={{
          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Inter', fontSize: 9, fontWeight: 700,
          background: isRunning ? 'rgba(6,182,212,0.15)' : isComplete ? 'rgba(16,185,129,0.12)' : 'rgba(14,116,144,0.08)',
          color: isRunning ? '#06B6D4' : isComplete ? '#10B981' : '#64748B',
          border: isRunning ? '1px solid rgba(6,182,212,0.3)' : isComplete ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(14,116,144,0.15)',
        }}>{agent.num}</span>
        <span style={{
          flex: 1, fontFamily: 'Inter', fontSize: 12, fontWeight: 500,
          color: isRunning ? '#0E7490' : isComplete ? '#065F46' : '#64748B',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{agent.label}</span>
        <StatusIcon status={status} size={13} />
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px 16px', borderRadius: 12, position: 'relative', overflow: 'hidden',
        background: isRunning  ? 'rgba(6,182,212,0.07)'
          : isComplete ? 'rgba(16,185,129,0.06)'
          : isError    ? 'rgba(239,68,68,0.06)'
          : 'rgba(255,255,255,0.55)',
        border: isRunning  ? '1px solid rgba(6,182,212,0.25)'
          : isComplete ? '1px solid rgba(16,185,129,0.2)'
          : isError    ? '1px solid rgba(239,68,68,0.2)'
          : '1px solid rgba(14,116,144,0.08)',
        backdropFilter: 'blur(8px)',
        marginBottom: 2,
        boxShadow: isRunning ? '0 4px 16px rgba(6,182,212,0.08)' : 'none',
        transition: 'all 0.3s ease',
      }}>

      {/* Running shimmer sweep */}
      {isRunning && (
        <motion.div
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.08) 50%, transparent 100%)',
          }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Number bubble */}
      <span style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Inter', fontSize: 11, fontWeight: 700,
        background: isRunning  ? 'rgba(6,182,212,0.15)'
          : isComplete ? 'rgba(16,185,129,0.12)'
          : isError    ? 'rgba(239,68,68,0.12)'
          : 'rgba(14,116,144,0.06)',
        color: isRunning  ? '#06B6D4'
          : isComplete ? '#10B981'
          : isError    ? '#EF4444'
          : '#94A3B8',
        border: isRunning  ? '1.5px solid rgba(6,182,212,0.35)'
          : isComplete ? '1.5px solid rgba(16,185,129,0.3)'
          : isError    ? '1.5px solid rgba(239,68,68,0.3)'
          : '1.5px solid rgba(14,116,144,0.12)',
      }}>{agent.num}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: 'Inter', fontSize: 13, fontWeight: 600, lineHeight: 1.3,
          color: isRunning ? '#0E7490' : isComplete ? '#065F46' : isError ? '#DC2626' : '#334155',
        }}>{agent.label}</p>
        <p style={{ fontFamily: 'Inter', fontSize: 11, marginTop: 2, lineHeight: 1, display: 'flex', alignItems: 'center', gap: 4,
          color: isRunning ? '#0E7490' : isComplete ? '#059669' : '#94A3B8',
        }}>
          {isRunning && (
            <>
              {[0,1,2].map(i => (
                <motion.span key={i}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  style={{ width: 3, height: 3, borderRadius: '50%', background: '#06B6D4', display: 'inline-block' }}
                />
              ))}
            </>
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
    <div style={{ display: 'flex', justifyContent: 'flex-start', paddingLeft: 30, margin: '1px 0' }}>
      <motion.div
        animate={{ background: fromComplete ? '#10B981' : 'rgba(14,116,144,0.15)' }}
        transition={{ duration: 0.4 }}
        style={{ width: 1.5, height: 10 }}
      />
    </div>
  )
}

export default function AgentPipeline({ agentStatus, compact = false }) {
  if (!agentStatus) return null

  return (
    <div style={{ width: '100%' }}>
      {!compact && (
        <p style={{
          fontFamily: 'Inter', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: '#0E7490', marginBottom: 12,
        }}>Agent Pipeline</p>
      )}
      <div>
        {AGENTS.map((agent, i) => (
          <React.Fragment key={agent.key}>
            <AgentRow agent={agent} status={agentStatus[agent.key] || 'idle'} index={i} compact={compact} />
            {i < AGENTS.length - 1 && (
              <PipelineConnector fromComplete={agentStatus[agent.key] === 'complete'} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
