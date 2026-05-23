import React, { useState } from 'react'

const LEVEL_CONFIG = {
  '1A': { label: 'Level 1A', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', desc: 'Systematic Review / Meta-analysis' },
  '1B': { label: 'Level 1B', color: 'bg-blue-50 text-blue-700 border-blue-200',         dot: 'bg-blue-500',    desc: 'High-Quality RCT' },
  '2A': { label: 'Level 2A', color: 'bg-yellow-50 text-yellow-700 border-yellow-200',   dot: 'bg-yellow-500',  desc: 'Systematic Review of Cohorts' },
  '2B': { label: 'Level 2B', color: 'bg-orange-50 text-orange-700 border-orange-200',   dot: 'bg-orange-500',  desc: 'Cohort Study / Low-Quality RCT' },
  '3':  { label: 'Level 3',  color: 'bg-purple-50 text-purple-700 border-purple-200',   dot: 'bg-purple-500',  desc: 'Case-Control Study' },
  '4':  { label: 'Level 4',  color: 'bg-gray-100 text-gray-600 border-gray-200',        dot: 'bg-gray-400',    desc: 'Expert Opinion / Case Report' },
}

function EvidenceBadge({ level }) {
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG['4']
  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold
      border ${cfg.color}
    `}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function DataRow({ label, value }) {
  if (!value || value === 'N/A' || value === 'Unknown') return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  )
}

export default function EvidenceCard({ summary, index, highlighted }) {
  const [expanded, setExpanded] = useState(false)
  const levelInfo = LEVEL_CONFIG[summary.evidence_level] || LEVEL_CONFIG['4']

  return (
    <div
      className={`bg-white rounded-xl border overflow-hidden shadow-sm
                 hover:shadow-md transition-all duration-300 animate-slide-up opacity-0
                 ${highlighted
                   ? 'border-blue-400 ring-2 ring-blue-300 ring-offset-1 shadow-blue-100'
                   : 'border-gray-200 hover:border-blue-300'
                 }`}
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'forwards' }}
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
              {summary.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {summary.authors} · {summary.journal} ({summary.year})
            </p>
          </div>
          <EvidenceBadge level={summary.evidence_level} />
        </div>

        {/* Key fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <DataRow label="Intervention" value={summary.intervention} />
          <DataRow label="Population"   value={summary.population} />
          <DataRow label="Sample Size"  value={summary.sample_size} />
          <DataRow label="Evidence"     value={summary.evidence_quality} />
        </div>

        {/* Outcomes */}
        {summary.key_outcomes && summary.key_outcomes !== 'N/A' && (
          <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1.5">
              Key Outcomes
            </span>
            <p className={`text-sm text-gray-700 leading-relaxed ${!expanded ? 'line-clamp-3' : ''}`}>
              {summary.key_outcomes}
            </p>
            {summary.key_outcomes.length > 200 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-blue-600 hover:text-blue-700 mt-1.5 transition-colors font-medium"
              >
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pb-4 flex items-center justify-between border-t border-gray-50 pt-3">
        <div className={`
          text-xs px-2 py-1 rounded-md ${levelInfo.color} border
        `}>
          {levelInfo.desc}
        </div>
        <a
          href={summary.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors font-medium"
        >
          PubMed
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  )
}
