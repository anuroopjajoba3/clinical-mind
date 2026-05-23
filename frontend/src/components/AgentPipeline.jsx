import React from 'react'

const AGENTS = [
  {
    key: 'fhir',
    label: 'FHIR Context Agent',
    icon: '🏥',
    description: 'Fetches Patient, Encounter & Appointment data from EMR (HAPI FHIR R4)',
    runningMsg: 'Fetching EMR data…',
    completeMsg: 'Patient context loaded',
  },
  {
    key: 'pico',
    label: 'PICO Agent',
    icon: '🎯',
    description: 'Extracts Population · Intervention · Comparison · Outcome',
    runningMsg: 'Extracting PICO…',
    completeMsg: 'PICO extracted',
  },
  {
    key: 'search',
    label: 'Search Agent',
    icon: '🔍',
    description: 'Parallel search: PubMed + ClinicalTrials.gov',
    runningMsg: 'Searching sources…',
    completeMsg: 'Papers retrieved',
  },
  {
    key: 'summarizer',
    label: 'Summarizer Agent',
    icon: '🧬',
    description: 'Extracts structured data from each source via Claude',
    runningMsg: 'Analysing abstracts…',
    completeMsg: 'Summaries complete',
  },
  {
    key: 'contradiction',
    label: 'Contradiction Agent',
    icon: '⚡',
    description: 'Detects conflicting findings across papers',
    runningMsg: 'Checking conflicts…',
    completeMsg: 'Analysis complete',
  },
  {
    key: 'drug_interaction',
    label: 'Drug Interaction Agent',
    icon: '💊',
    description: "Checks recommendations against patient's current medications",
    runningMsg: 'Checking interactions…',
    completeMsg: 'Interaction check complete',
  },
  {
    key: 'synthesize',
    label: 'Synthesize Agent',
    icon: '📋',
    description: 'Synthesises all evidence into a clinical report',
    runningMsg: 'Generating report…',
    completeMsg: 'Report ready',
  },
]

function StatusDot({ status }) {
  if (status === 'idle') {
    return (
      <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-300" />
    )
  }
  if (status === 'running') {
    return (
      <span className="flex gap-0.5 items-center">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 dot-pulse" />
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 dot-pulse dot-pulse-delay-1" />
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 dot-pulse dot-pulse-delay-2" />
      </span>
    )
  }
  if (status === 'complete') {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    )
  }
  if (status === 'skipped') {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-500/20 text-gray-400">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 text-red-400">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </span>
    )
  }
  return null
}

function AgentCard({ agent, status, index }) {
  const isRunning  = status === 'running'
  const isComplete = status === 'complete'
  const isError    = status === 'error'
  const isSkipped  = status === 'skipped'

  const borderClass = isRunning  ? 'border-blue-400 card-glow-blue'
    : isComplete ? 'border-emerald-400 card-glow-green'
    : isError    ? 'border-red-400'
    : 'border-gray-200'

  const bgClass = isRunning  ? 'bg-blue-50/60'
    : isComplete ? 'bg-emerald-50/60'
    : 'bg-white'

  return (
    <div
      className={`
        relative flex flex-col gap-3 rounded-xl p-5 border transition-all duration-500
        ${bgClass} ${borderClass}
        animate-slide-up opacity-0
      `}
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
    >
      {/* Running shimmer */}
      {isRunning && (
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div
            className="absolute inset-0 -translate-x-full"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.06), transparent)',
              animation: 'shimmer 2s infinite',
            }}
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center text-xl
            transition-all duration-300
            ${isRunning ? 'bg-blue-100' : isComplete ? 'bg-emerald-100' : 'bg-gray-100'}
          `}>
            {agent.icon}
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">{agent.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{agent.description}</p>
          </div>
        </div>
        <StatusDot status={status} />
      </div>

      {/* Status message */}
      <div className={`
        text-xs font-medium px-3 py-1.5 rounded-lg w-fit transition-all duration-300
        ${isRunning  ? 'bg-blue-100 text-blue-700'
          : isComplete ? 'bg-emerald-100 text-emerald-700'
          : isError    ? 'bg-red-100 text-red-700'
          : 'bg-gray-100 text-gray-500'}
      `}>
        {isRunning  ? agent.runningMsg
          : isComplete ? agent.completeMsg
          : isSkipped  ? 'Skipped (no patient)'
          : isError    ? 'Error occurred'
          : 'Waiting…'}
      </div>
    </div>
  )
}

function PipelineConnector({ active }) {
  return (
    <div className="flex justify-center items-center py-1">
      <div className={`
        h-6 w-px transition-all duration-500
        ${active ? 'bg-gradient-to-b from-blue-500 to-blue-200' : 'bg-gray-200'}
      `} />
    </div>
  )
}

export default function AgentPipeline({ agentStatus }) {
  if (!agentStatus) return null

  return (
    <div className="w-full">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Agent Pipeline
      </h2>
      <div className="flex flex-col">
        {AGENTS.map((agent, i) => (
          <React.Fragment key={agent.key}>
            <AgentCard
              agent={agent}
              status={agentStatus[agent.key] || 'idle'}
              index={i}
            />
            {i < AGENTS.length - 1 && (
              <PipelineConnector
                active={agentStatus[agent.key] === 'complete'}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
