/**
 * CDSHooksDemo.jsx
 *
 * Static demo showing what CDS Hooks cards look like inside an EHR.
 * Rendered in the app footer area so reviewers can see the integration
 * without needing a connected EHR sandbox.
 *
 * Real hook endpoints:
 *   GET  /.well-known/cds-services
 *   POST /cds-hooks/patient-view
 *   POST /cds-hooks/order-sign
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, ExternalLink, AlertTriangle, Info, Zap } from 'lucide-react'

const INDICATOR_STYLES = {
  info:     { bar: 'bg-blue-500',   icon: <Info className="w-4 h-4 text-blue-500" />,       badge: 'bg-blue-50 border-blue-200 text-blue-700' },
  warning:  { bar: 'bg-amber-400',  icon: <AlertTriangle className="w-4 h-4 text-amber-500" />, badge: 'bg-amber-50 border-amber-200 text-amber-700' },
  critical: { bar: 'bg-red-500',    icon: <Zap className="w-4 h-4 text-red-500" />,          badge: 'bg-red-50 border-red-200 text-red-700' },
}

const DEMO_CARDS = [
  {
    hook:      'patient-view',
    hookLabel: 'patient-view hook',
    summary:   'ClinicalMind: 3 prior evidence queries for this patient',
    indicator: 'info',
    detail:    'Most recent query (May 18, 2026):\nWhat is the evidence for SGLT2 inhibitors in CKD stage 3?\n\nTop recommendations:\n• Initiate SGLT2 inhibitor (empagliflozin 10 mg) — eGFR ≥20 (1A, 94%)\n• Monitor eGFR and potassium 4 weeks after initiation (1B, 88%)\n• Target BP <130/80 with ACEi/ARB if tolerated (1A, 91%)',
    links: [
      { label: 'Open in ClinicalMind', url: '#' },
      { label: 'View all insights',    url: '#' },
    ],
  },
  {
    hook:      'patient-view',
    hookLabel: 'patient-view hook',
    summary:   'High-confidence recommendation from 38 days ago — consider review',
    indicator: 'warning',
    detail:    'ClinicalMind previously identified high-confidence recommendations for this patient (Apr 15, 2026). Clinical evidence may have been updated since then.',
    links: [
      { label: 'Review recommendations', url: '#' },
    ],
  },
  {
    hook:      'order-sign',
    hookLabel: 'order-sign hook',
    summary:   'Major drug interaction: Clarithromycin + Atorvastatin',
    indicator: 'critical',
    detail:    'Interaction detected by ClinicalMind\n\nClarithromycin is a strong CYP3A4 inhibitor. Co-administration with atorvastatin significantly increases statin plasma levels, raising the risk of myopathy and rhabdomyolysis.\n\nMechanism: CYP3A4 inhibition → ↑ atorvastatin AUC up to 5-fold',
    links: [
      { label: 'Search evidence for this combination', url: '#' },
    ],
  },
]

function CDSCard({ card, index }) {
  const [expanded, setExpanded] = useState(false)
  const style = INDICATOR_STYLES[card.indicator] || INDICATOR_STYLES.info

  return (
    <motion.div
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      {/* Indicator bar */}
      <div className={`h-1 w-full ${style.bar}`} />

      <div className="p-4">
        {/* Hook type badge */}
        <div className="flex items-center justify-between mb-2">
          <span className={`inline-flex items-center gap-1 text-xs font-mono font-semibold px-2 py-0.5 rounded border ${style.badge}`}>
            {card.hookLabel}
          </span>
          <span className="text-xs text-slate-400">ClinicalMind</span>
        </div>

        {/* Summary row */}
        <div className="flex items-start gap-2 mb-2">
          {style.icon}
          <p className="text-sm font-semibold text-slate-800 flex-1 leading-snug">{card.summary}</p>
        </div>

        {/* Expandable detail */}
        {card.detail && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors mb-2"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Hide detail' : 'Show detail'}
          </button>
        )}

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                {card.detail.split('\n').map((line, i) => (
                  <p key={i} className={`text-xs leading-relaxed ${line.startsWith('•') ? 'text-slate-700 ml-2' : line === '' ? 'h-2' : line.startsWith('**') ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                    {line.replace(/\*\*/g, '')}
                  </p>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action links */}
        {card.links?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {card.links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${i === 0
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700'
                  }`}
              >
                {link.label}
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function CDSHooksDemo() {
  const [open, setOpen] = useState(false)

  return (
    <div className="max-w-7xl mx-auto px-6 mt-12 mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-white rounded-xl border border-slate-200
                   hover:border-blue-300 hover:shadow-sm transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
              CDS Hooks Integration
            </p>
            <p className="text-xs text-slate-500">
              HL7 CDS Hooks 2.0 · Fires inside any SMART on FHIR EHR ·{' '}
              <code className="font-mono bg-slate-100 px-1 rounded">/.well-known/cds-services</code>
            </p>
          </div>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
          : <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
        }
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pt-4">
              {/* EHR chrome mock */}
              <div className="rounded-2xl border border-slate-300 overflow-hidden shadow-md">
                {/* Fake EHR title bar */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-700">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-3 text-xs text-slate-300 font-mono">EHR — Patient Chart · Smith, John · DOB 1958-03-14</span>
                </div>

                {/* Fake EHR body */}
                <div className="grid grid-cols-[1fr_320px] bg-slate-50">
                  {/* Main chart area (placeholder) */}
                  <div className="p-5 border-r border-slate-200">
                    <div className="h-4 w-48 bg-slate-200 rounded mb-3 animate-none" />
                    <div className="space-y-2">
                      {[100, 80, 120, 60, 90].map((w, i) => (
                        <div key={i} className="h-3 bg-slate-100 rounded" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                    <div className="mt-5 h-24 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                      <span className="text-xs text-slate-400">Chart content</span>
                    </div>
                  </div>

                  {/* CDS Hooks card tray */}
                  <div className="p-4 bg-white">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <Zap className="w-2.5 h-2.5 text-white" />
                      </div>
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Clinical Decision Support</p>
                    </div>
                    <div className="space-y-3">
                      {DEMO_CARDS.map((card, i) => (
                        <CDSCard key={i} card={card} index={i} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Endpoint reference */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { method: 'GET',  path: '/.well-known/cds-services', desc: 'Discovery'       },
                  { method: 'POST', path: '/cds-hooks/patient-view',   desc: 'Chart open hook' },
                  { method: 'POST', path: '/cds-hooks/order-sign',     desc: 'Order sign hook' },
                ].map(ep => (
                  <div key={ep.path} className="px-3 py-2 bg-slate-900 rounded-lg">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-mono font-bold ${ep.method === 'GET' ? 'text-emerald-400' : 'text-blue-400'}`}>
                        {ep.method}
                      </span>
                      <span className="text-xs text-slate-300 font-mono truncate">{ep.path}</span>
                    </div>
                    <p className="text-xs text-slate-500">{ep.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
