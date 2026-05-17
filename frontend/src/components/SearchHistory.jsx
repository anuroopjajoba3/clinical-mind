import React, { useEffect, useState } from 'react'
import { researchAPI } from '../api'

export default function SearchHistory({ onSelect }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    researchAPI.history()
      .then(r => setHistory(r.data.jobs || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center gap-2 text-sm text-gray-500 py-4 px-2">
      <div className="w-3 h-3 rounded-full border-2 border-gray-600 border-t-blue-400 spin" />
      Loading history…
    </div>
  )

  if (!history.length) return (
    <p className="text-sm text-gray-600 py-4 px-2">No previous searches yet.</p>
  )

  const statusColor = (s) =>
    s === 'complete' ? 'text-emerald-400' :
    s === 'error'    ? 'text-red-400'     : 'text-yellow-400'

  return (
    <div className="flex flex-col gap-1">
      {history.map((job) => (
        <button key={job.job_id}
                onClick={() => onSelect(job.job_id)}
                className="text-left p-3 rounded-lg bg-white/3 hover:bg-white/6
                           border border-white/5 hover:border-white/10 transition-all group">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-gray-300 group-hover:text-white transition-colors line-clamp-2 flex-1">
              {job.question}
            </p>
            <span className={`flex-shrink-0 text-xs font-medium mt-0.5 ${statusColor(job.status)}`}>
              {job.status === 'complete' ? '✓' : job.status === 'error' ? '⚠' : '…'}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </button>
      ))}
    </div>
  )
}
