import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'

const LEVEL_COLORS = {
  '1A': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '1B': 'bg-blue-50 text-blue-700 border-blue-200',
  '2A': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  '2B': 'bg-orange-50 text-orange-700 border-orange-200',
  '3':  'bg-purple-50 text-purple-700 border-purple-200',
  '4':  'bg-gray-100 text-gray-600 border-gray-200',
}

function WinnerBadge({ winner, side }) {
  if (winner !== side && winner !== 'tie') return null
  const isTie = winner === 'tie'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border
      ${isTie
        ? 'bg-gray-50 text-gray-500 border-gray-200'
        : side === 'A'
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-purple-600 text-white border-purple-600'
      }`}
    >
      {isTie ? 'Tie' : '✓ Wins'}
    </span>
  )
}

function OverallWinnerBanner({ winner, labelA, labelB }) {
  if (winner === 'tie') {
    return (
      <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200 mb-6">
        <span className="text-sm font-semibold text-gray-600">Overall: Evidence is equivalent — clinical context determines choice</span>
      </div>
    )
  }
  const label = winner === 'A' ? labelA : labelB
  const gradient = winner === 'A'
    ? 'from-blue-600 to-blue-700'
    : 'from-purple-600 to-purple-700'
  return (
    <div className={`flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r ${gradient} rounded-xl mb-6`}>
      <span className="text-sm font-bold text-white">Overall edge: {label}</span>
      <span className="text-blue-200 text-xs">based on available evidence</span>
    </div>
  )
}

function BottomLineCard({ label, bottomLine, recs, side }) {
  const [open, setOpen] = useState(false)
  const gradient = side === 'A'
    ? 'from-blue-600 to-blue-700'
    : 'from-purple-600 to-purple-700'
  const recBorder = side === 'A' ? 'border-l-blue-400' : 'border-l-purple-400'

  return (
    <div className="flex flex-col h-full">
      <div className={`rounded-2xl bg-gradient-to-br ${gradient} p-4 mb-3 shadow-md`}>
        <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-2">Clinical Bottom Line</p>
        <p className="text-sm text-white font-semibold leading-relaxed">{bottomLine || "Synthesis in progress…"}</p>
      </div>

      {recs?.length > 0 && (
        <div className="flex-1">
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 mb-2 transition-colors"
          >
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {open ? 'Hide' : 'Show'} recommendations ({recs.length})
          </button>
          {open && (
            <div className="space-y-2">
              {recs.slice(0, 3).map((rec, i) => (
                <div key={i} className={`p-3 bg-white rounded-lg border-l-4 ${recBorder} border border-gray-100 shadow-sm`}>
                  <div className="flex items-start gap-2">
                    {rec.evidence_level && (
                      <span className={`flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded border ${LEVEL_COLORS[rec.evidence_level] || LEVEL_COLORS['4']}`}>
                        {rec.evidence_level}
                      </span>
                    )}
                    <p className="text-xs text-gray-700 leading-relaxed">{rec.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DimensionRow({ dim, index }) {
  const isEven = index % 2 === 0
  return (
    <motion.div
      className={`grid grid-cols-[1fr_auto_1fr] gap-0 ${isEven ? 'bg-white' : 'bg-gray-50/60'} rounded-xl overflow-hidden border border-gray-100 mb-2`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      {/* A side */}
      <div className="p-3 pr-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs text-gray-700 leading-relaxed flex-1">{dim.a}</p>
          <WinnerBadge winner={dim.winner} side="A" />
        </div>
      </div>

      {/* Dimension label (center spine) */}
      <div className="flex items-center justify-center px-3 bg-slate-50 border-x border-gray-100 min-w-[130px]">
        <p className="text-xs font-bold text-slate-600 text-center uppercase tracking-wider leading-tight">
          {dim.name}
        </p>
      </div>

      {/* B side */}
      <div className="p-3 pl-4">
        <div className="flex items-start justify-between gap-2">
          <WinnerBadge winner={dim.winner} side="B" />
          <p className="text-xs text-gray-700 leading-relaxed flex-1 text-right">{dim.b}</p>
        </div>
      </div>
    </motion.div>
  )
}

export default function ComparisonPanel({ compareResult }) {
  const { comparison, question_a, question_b, job_a, job_b } = compareResult
  const labelA = comparison?.treatment_a_label || 'Treatment A'
  const labelB = comparison?.treatment_b_label || 'Treatment B'

  return (
    <motion.div
      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 via-white to-purple-50">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-lg">⚖️</span>
          <h2 className="text-base font-bold text-gray-900">Head-to-Head Comparison</h2>
        </div>
        <p className="text-xs text-gray-500">Evidence synthesised from PubMed &amp; ClinicalTrials.gov</p>
      </div>

      <div className="p-6">

        {/* Treatment labels + column headers */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Treatment A</p>
              <p className="text-sm font-bold text-blue-700">{labelA}</p>
              <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{question_a}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-600 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Treatment B</p>
              <p className="text-sm font-bold text-purple-700">{labelB}</p>
              <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{question_b}</p>
            </div>
          </div>
        </div>

        {/* Overall winner banner */}
        {comparison?.overall_winner && (
          <OverallWinnerBanner
            winner={comparison.overall_winner}
            labelA={labelA}
            labelB={labelB}
          />
        )}

        {/* Bottom lines side by side */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <BottomLineCard
            label={labelA}
            bottomLine={job_a?.report?.clinical_bottom_line}
            recs={job_a?.report?.recommendations}
            side="A"
          />
          <BottomLineCard
            label={labelB}
            bottomLine={job_b?.report?.clinical_bottom_line}
            recs={job_b?.report?.recommendations}
            side="B"
          />
        </div>

        {/* Comparison table */}
        {comparison?.dimensions?.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Dimension-by-Dimension Analysis</p>
            {comparison.dimensions.map((dim, i) => (
              <DimensionRow key={dim.name} dim={dim} index={i} />
            ))}
          </div>
        )}

        {/* Patient selection guide */}
        {(comparison?.prefer_a_profile || comparison?.prefer_b_profile) && (
          <div className="grid grid-cols-2 gap-3 mb-5">
            {comparison.prefer_a_profile && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1.5">
                  Choose {labelA} when…
                </p>
                <p className="text-xs text-blue-900 leading-relaxed">{comparison.prefer_a_profile}</p>
              </div>
            )}
            {comparison.prefer_b_profile && (
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
                <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-1.5">
                  Choose {labelB} when…
                </p>
                <p className="text-xs text-purple-900 leading-relaxed">{comparison.prefer_b_profile}</p>
              </div>
            )}
          </div>
        )}

        {/* Clinical verdict */}
        {comparison?.clinical_verdict && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Clinical Verdict</p>
            <p className="text-sm text-white leading-relaxed font-medium">{comparison.clinical_verdict}</p>
          </div>
        )}

      </div>
    </motion.div>
  )
}
