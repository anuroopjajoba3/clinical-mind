/**
 * PatientWorkspace.jsx
 *
 * Longitudinal evidence timeline for a patient.
 * Fetches all past insights from /patients/{fhir_id}/insights and
 * renders them as a scrollable timeline — newest at the top.
 *
 * Each insight card shows:
 *   - clinical question asked
 *   - clinical bottom line (the synthesised verdict)
 *   - evidence level distribution (how many 1A / 1B / … sources)
 *   - source count and recommendation count
 *   - expandable recommendation list with evidence badges
 *   - timestamp
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, ChevronDown, ChevronUp, AlertCircle, RefreshCw, FileText, Pill } from 'lucide-react'
import api from '../api'

// Evidence level display config — mirrors EvidenceCard.jsx
const LEVEL_CFG = {
  '1A': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', bar: 'bg-emerald-500' },
  '1B': { bg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-200',    bar: 'bg-blue-500'    },
  '2A': { bg: 'bg-yellow-100',  text: 'text-yellow-700',  border: 'border-yellow-200',  bar: 'bg-yellow-400'  },
  '2B': { bg: 'bg-orange-100',  text: 'text-orange-700',  border: 'border-orange-200',  bar: 'bg-orange-400'  },
  '3':  { bg: 'bg-purple-100',  text: 'text-purple-700',  border: 'border-purple-200',  bar: 'bg-purple-400'  },
  '4':  { bg: 'bg-gray-100',    text: 'text-gray-600',    border: 'border-gray-200',    bar: 'bg-gray-400'    },
}

const LEVEL_LEFT = {
  '1A': 'border-l-4 border-l-emerald-500',
  '1B': 'border-l-4 border-l-blue-500',
  '2A': 'border-l-4 border-l-yellow-400',
  '2B': 'border-l-4 border-l-orange-400',
  '3':  'border-l-4 border-l-purple-300',
  '4':  'border-l-4 border-l-gray-300',
}

function EvidenceLevelPill({ level, count }) {
  const cfg = LEVEL_CFG[level] || LEVEL_CFG['4']
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border
                      ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {level}
      <span className="opacity-70">×{count}</span>
    </span>
  )
}

function EvidenceBar({ levels }) {
  const order = ['1A', '1B', '2A', '2B', '3', '4']
  const total = Object.values(levels).reduce((s, n) => s + n, 0)
  if (total === 0) return null
  return (
    <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden w-full">
      {order.map(lvl => {
        const n = levels[lvl] || 0
        if (!n) return null
        const pct = Math.round((n / total) * 100)
        const cfg = LEVEL_CFG[lvl]
        return (
          <div
            key={lvl}
            className={`${cfg.bar} h-full`}
            style={{ width: `${pct}%` }}
            title={`Level ${lvl}: ${n} source${n > 1 ? 's' : ''}`}
          />
        )
      })}
    </div>
  )
}

function RecommendationList({ recommendations }) {
  if (!recommendations?.length) return null
  return (
    <div className="mt-3 space-y-2">
      {recommendations.map((rec, i) => {
        const leftBorder = LEVEL_LEFT[rec.evidence_level] || LEVEL_LEFT['4']
        const cfg = LEVEL_CFG[rec.evidence_level] || LEVEL_CFG['4']
        return (
          <div
            key={i}
            className={`bg-white rounded-lg border border-gray-100 p-3 ${leftBorder}`}
          >
            <div className="flex items-start gap-2">
              <span className={`flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded border
                               ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                {rec.evidence_level || '?'}
              </span>
              <p className="text-xs text-gray-800 leading-relaxed">{rec.recommendation}</p>
            </div>
            {rec.rationale && (
              <p className="text-xs text-gray-500 mt-1 ml-8 leading-relaxed">{rec.rationale}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

function InsightCard({ insight, index }) {
  const [expanded, setExpanded] = useState(false)
  const levels = insight.evidence_levels || {}
  const topLevel = insight.top_evidence || '4'
  const topCfg = LEVEL_CFG[topLevel] || LEVEL_CFG['4']
  const leftBorder = LEVEL_LEFT[topLevel] || LEVEL_LEFT['4']

  const date = insight.created_at
    ? new Date(insight.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : ''

  return (
    <motion.div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden
                  hover:shadow-md transition-all duration-200 ${leftBorder}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="p-4">
        {/* Date + meta row */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">{date}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {insight.source_count} sources
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Brain className="w-3 h-3" />
              {insight.rec_count} recs
            </span>
          </div>
        </div>

        {/* Question */}
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Clinical Question
        </p>
        <p className="text-sm text-gray-900 font-medium leading-snug mb-3">
          {insight.question}
        </p>

        {/* Evidence bar */}
        {Object.keys(levels).length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1 mb-1.5">
              {['1A','1B','2A','2B','3','4'].map(lvl =>
                levels[lvl] ? <EvidenceLevelPill key={lvl} level={lvl} count={levels[lvl]} /> : null
              )}
            </div>
            <EvidenceBar levels={levels} />
          </div>
        )}

        {/* Clinical bottom line */}
        {insight.clinical_bottom_line && (
          <div className="p-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700 mb-3">
            <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">
              ⚡ Clinical Bottom Line
            </p>
            <p className="text-xs text-white font-medium leading-relaxed">
              {insight.clinical_bottom_line}
            </p>
          </div>
        )}

        {/* Drug interactions warning */}
        {insight.drug_interactions?.length > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200 mb-3">
            <Pill className="w-3 h-3 text-red-500 shrink-0" />
            <p className="text-xs text-red-700 font-medium">
              {insight.drug_interactions.length} drug interaction{insight.drug_interactions.length > 1 ? 's' : ''} flagged
            </p>
          </div>
        )}

        {/* Expand/collapse recommendations */}
        {insight.rec_count > 0 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg
                       bg-gray-50 hover:bg-gray-100 border border-gray-100
                       text-xs font-medium text-gray-600 hover:text-gray-900 transition-all"
          >
            <span>{expanded ? 'Hide' : 'Show'} {insight.rec_count} recommendation{insight.rec_count > 1 ? 's' : ''}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <RecommendationList recommendations={insight.recommendations} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default function PatientWorkspace({ fhirId }) {
  const [insights, setInsights] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const r = await api.get(`/patients/${fhirId}/insights`)
      setInsights(r.data.insights || [])
    } catch {
      setError('Could not load workspace. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (fhirId) load() }, [fhirId])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Evidence Timeline</p>
          <p className="text-xs text-slate-500">
            {loading ? 'Loading…' : `${insights.length} synthesis session${insights.length !== 1 ? 's' : ''} recorded`}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex items-center gap-2 p-4 bg-red-50 rounded-xl border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && insights.length === 0 && (
        <div className="flex flex-col items-center py-10 text-center">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
            <Brain className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-sm font-medium text-slate-700 mb-1">No evidence sessions yet</p>
          <p className="text-xs text-slate-500 max-w-48">
            Select this patient and run a clinical query. The synthesised insights will be saved here.
          </p>
        </div>
      )}

      {/* Timeline */}
      {!loading && insights.length > 0 && (
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-100" />
          <div className="space-y-4 pl-7">
            {insights.map((insight, i) => (
              <div key={insight.id} className="relative">
                {/* Timeline dot */}
                <div className="absolute -left-5 top-4 w-2.5 h-2.5 rounded-full bg-blue-400 border-2 border-white shadow-sm" />
                <InsightCard insight={insight} index={i} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
