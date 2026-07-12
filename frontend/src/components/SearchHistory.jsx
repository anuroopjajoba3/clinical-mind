import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Clock, FileText, Loader2, AlertTriangle } from 'lucide-react'
import { researchAPI } from '../api'

const STATUS = {
  complete: { label: 'Complete', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  error:    { label: 'Error',    cls: 'bg-red-50 text-red-600 border-red-200' },
  pending:  { label: 'Running',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  running:  { label: 'Running',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
}

export default function SearchHistory({ onClose, onLoad }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    researchAPI.history()
      .then(r => setHistory(r.data.jobs || []))
      .catch(() => setError('Could not load history. Are you signed in?'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
      />

      {/* Drawer */}
      <motion.aside
        initial={{ x: 360 }} animate={{ x: 0 }} exit={{ x: 360 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="fixed right-0 top-0 bottom-0 z-50 w-[340px] bg-white shadow-2xl border-l border-slate-200 flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-slate-500" strokeWidth={2} />
            <h2 className="font-sans text-[14px] font-bold text-slate-900">Search History</h2>
            {!loading && !error && (
              <span className="font-sans text-[11px] text-slate-400">{history.length}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close history"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="font-sans text-[13px]">Loading history…</span>
            </div>
          ) : error ? (
            <div className="flex items-start gap-2 mx-1 mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="font-sans text-[12px] text-amber-800">{error}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16 px-4">
              <FileText size={28} className="mx-auto text-slate-200 mb-3" />
              <p className="font-sans text-[13px] font-semibold text-slate-500">No previous searches</p>
              <p className="font-sans text-[12px] text-slate-400 mt-1">Completed evidence searches will appear here.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {history.map(job => {
                const st = STATUS[job.status] || STATUS.pending
                return (
                  <button
                    key={job.job_id}
                    onClick={() => onLoad?.(job.job_id)}
                    className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-sans text-[13px] text-slate-700 group-hover:text-slate-900 leading-snug line-clamp-2 flex-1 transition-colors">
                        {job.question}
                      </p>
                      <span className={`flex-shrink-0 font-sans text-[10px] font-semibold px-1.5 py-0.5 rounded border ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>
                    <p className="font-sans text-[11px] text-slate-400 mt-1.5">
                      {new Date(job.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                      {job.has_report ? ' · report ready' : ''}
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </motion.aside>
    </>
  )
}
