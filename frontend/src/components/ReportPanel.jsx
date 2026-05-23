import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const LEVEL_COLORS = {
  '1A': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  '1B': 'text-blue-700 bg-blue-50 border-blue-200',
  '2A': 'text-yellow-700 bg-yellow-50 border-yellow-200',
  '2B': 'text-orange-700 bg-orange-50 border-orange-200',
  '3':  'text-purple-700 bg-purple-50 border-purple-200',
  '4':  'text-gray-600 bg-gray-100 border-gray-200',
}

const LEVEL_LEFT_BORDER = {
  '1A': 'border-l-4 border-l-emerald-500',
  '1B': 'border-l-4 border-l-blue-500',
  '2A': 'border-l-4 border-l-yellow-400',
  '2B': 'border-l-4 border-l-orange-400',
  '3':  'border-l-4 border-l-purple-300',
  '4':  'border-l-4 border-l-gray-300',
}

function CollapsibleSection({ title, icon, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 mb-2 group"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider group-hover:text-gray-700 transition-colors">
            {title}
          </h3>
        </div>
        {open
          ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          : <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
        }
      </button>
      {open && children}
    </div>
  )
}

function ConfidenceBar({ score }) {
  const pct = Math.max(0, Math.min(100, score))
  const color = pct >= 75 ? 'bg-emerald-500'
    : pct >= 50 ? 'bg-blue-500'
    : pct >= 30 ? 'bg-amber-400'
    : 'bg-red-400'
  const label = pct >= 75 ? 'High confidence'
    : pct >= 50 ? 'Moderate confidence'
    : pct >= 30 ? 'Low confidence'
    : 'Very low confidence'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 tabular-nums whitespace-nowrap">
        {pct}% · {label}
      </span>
    </div>
  )
}

function CitationChip({ refNum, sourcesIndex, onCiteClick }) {
  const [hovered, setHovered] = React.useState(false)
  const src = sourcesIndex?.[String(refNum)]

  const pubmedUrl = src?.pmid && src.pmid !== 'N/A'
    ? `https://pubmed.ncbi.nlm.nih.gov/${src.pmid}/`
    : src?.url || null

  return (
    <span className="relative inline-flex items-center">
      <button
        onClick={() => onCiteClick?.(refNum - 1)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-semibold
                   bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-900
                   border border-blue-200 transition-all duration-150"
      >
        [{refNum}]
      </button>
      {hovered && src && (
        <span className="absolute bottom-full left-0 mb-1.5 z-20 w-64 pointer-events-none">
          <span className="block bg-slate-900 text-white rounded-lg px-3 py-2 shadow-xl">
            <span className="block text-xs font-semibold leading-snug line-clamp-2 mb-1">
              {src.title}
            </span>
            <span className="block text-xs text-slate-400">
              {[src.journal, src.year].filter(Boolean).join(' · ')}
            </span>
            {pubmedUrl && (
              <a
                href={pubmedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto mt-1.5 inline-flex items-center gap-1 text-xs text-blue-400
                           hover:text-blue-300 transition-colors"
                onClick={e => e.stopPropagation()}
              >
                View on {src.source === 'ClinicalTrials.gov' ? 'ClinicalTrials.gov' : 'PubMed'} ↗
              </a>
            )}
          </span>
        </span>
      )}
    </span>
  )
}

function RecommendationCard({ rec, index, sourcesIndex, onCiteClick }) {
  const levelClass    = LEVEL_COLORS[rec.evidence_level] || LEVEL_COLORS['4']
  const leftBorder    = LEVEL_LEFT_BORDER[rec.evidence_level] || LEVEL_LEFT_BORDER['4']
  const isHighEvidence = ['1A', '1B'].includes(rec.evidence_level)

  return (
    <div className={`rounded-xl border border-gray-200 bg-white mb-3 overflow-hidden shadow-sm
                     hover:shadow-md transition-all duration-200 ${leftBorder}`}>
      <div className="p-4">
        <div className="flex items-start gap-3 mb-2">
          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                           ${isHighEvidence ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {index + 1}
          </div>
          <p className={`flex-1 leading-relaxed ${isHighEvidence ? 'text-sm font-semibold text-gray-900' : 'text-sm font-medium text-gray-800'}`}>
            {rec.recommendation}
          </p>
          {rec.evidence_level && (
            <span className={`flex-shrink-0 self-start text-xs font-bold px-2 py-0.5 rounded border ${levelClass}`}>
              {rec.evidence_level}
            </span>
          )}
        </div>
        {rec.rationale && (
          <p className="text-xs text-gray-500 ml-9 leading-relaxed">{rec.rationale}</p>
        )}

        {rec.confidence_score != null && (
          <div className="ml-9 mt-2.5">
            <ConfidenceBar score={rec.confidence_score} />
          </div>
        )}

        {rec.source_refs?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 ml-9">
            {rec.source_refs.map((ref) => (
              <CitationChip
                key={ref}
                refNum={ref}
                sourcesIndex={sourcesIndex}
                onCiteClick={onCiteClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function InterventionTag({ item }) {
  const levelClass  = LEVEL_COLORS[item.evidence_level] || LEVEL_COLORS['4']
  const leftBorder  = LEVEL_LEFT_BORDER[item.evidence_level] || LEVEL_LEFT_BORDER['4']
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100 mb-2 ${leftBorder}`}>
      <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded border mt-0.5 ${levelClass}`}>
        {item.evidence_level || '?'}
      </span>
      <div>
        <p className="text-sm font-medium text-gray-900">{item.name}</p>
        {item.summary && <p className="text-xs text-gray-500 mt-0.5">{item.summary}</p>}
      </div>
    </div>
  )
}

export default function ReportPanel({ report, question, onCiteClick, sourcesIndex }) {
  const [copied, setCopied] = useState(false)

  if (!report) return null

  const reportText = `CLINICALMIND CLINICAL EVIDENCE REPORT
=====================================
Clinical Question: ${question}

BACKGROUND
${report.background || 'N/A'}

KEY INTERVENTIONS
${(report.key_interventions || []).map((i, n) => `${n+1}. [${i.evidence_level}] ${i.name}: ${i.summary}`).join('\n')}

EVIDENCE SUMMARY
${report.evidence_summary || 'N/A'}

RECOMMENDATIONS
${(report.recommendations || []).map((r, n) => `${n+1}. [${r.evidence_level}] ${r.recommendation}\n   Rationale: ${r.rationale}`).join('\n\n')}

CLINICAL BOTTOM LINE
${report.clinical_bottom_line || 'N/A'}

LIMITATIONS
${report.limitations || 'N/A'}

Generated by ClinicalMind — AI Clinical Evidence Synthesis
`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('Copy failed', e)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([reportText], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `ClinicalMind_Report_${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden
                    animate-slide-up opacity-0"
         style={{ animationFillMode: 'forwards' }}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100
                      bg-gradient-to-r from-blue-50 to-purple-50/40
                      flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Clinical Evidence Report
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{question}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                       bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900
                       border border-gray-200 transition-all duration-200 shadow-sm"
          >
            {copied
              ? <><span>✓</span> Copied</>
              : <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg> Copy</>
            }
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                       bg-blue-600 hover:bg-blue-700 text-white
                       border border-blue-600 transition-all duration-200 shadow-sm"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">

        {/* ── CLINICAL BOTTOM LINE — hero treatment ── */}
        {report.clinical_bottom_line && (
          <div className="mb-7 p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-white text-lg">⚡</span>
              <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">
                Clinical Bottom Line
              </span>
            </div>
            <p className="text-base text-white font-semibold leading-relaxed">
              {report.clinical_bottom_line}
            </p>
          </div>
        )}

        {/* ── RECOMMENDATIONS — always visible, prominent cards ── */}
        {report.recommendations?.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">✅</span>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Recommendations
              </h3>
              <span className="ml-auto text-xs text-gray-400">{report.recommendations.length} total</span>
            </div>
            {report.recommendations.map((rec, i) => (
              <RecommendationCard
                key={i}
                rec={rec}
                index={i}
                sourcesIndex={sourcesIndex || report.sources_index}
                onCiteClick={onCiteClick}
              />
            ))}
          </div>
        )}

        {/* ── KEY INTERVENTIONS ── */}
        {report.key_interventions?.length > 0 && (
          <CollapsibleSection title="Key Interventions" icon="💊" defaultOpen={true}>
            {report.key_interventions.map((item, i) => (
              <InterventionTag key={i} item={item} />
            ))}
          </CollapsibleSection>
        )}

        {/* ── BACKGROUND — collapsed by default (verbose, already synthesised above) ── */}
        {report.background && (
          <CollapsibleSection title="Background" icon="📖" defaultOpen={false}>
            <p className="text-sm text-gray-700 leading-relaxed">{report.background}</p>
          </CollapsibleSection>
        )}

        {/* ── EVIDENCE SUMMARY — collapsed by default ── */}
        {report.evidence_summary && (
          <CollapsibleSection title="Evidence Summary" icon="📊" defaultOpen={false}>
            <div>
              {report.evidence_summary.split('\n').filter(Boolean).map((para, i) => (
                <p key={i} className="text-sm text-gray-700 leading-relaxed mb-2">{para}</p>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* ── LIMITATIONS ── */}
        {report.limitations && (
          <CollapsibleSection title="Limitations" icon="⚠️" defaultOpen={false}>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-900 leading-relaxed">{report.limitations}</p>
            </div>
          </CollapsibleSection>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">Generated by ClinicalMind · AI Clinical Evidence Synthesis</p>
          <p className="text-xs text-gray-400">
            {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  )
}
