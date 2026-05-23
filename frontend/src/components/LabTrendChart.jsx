/**
 * LabTrendChart.jsx
 * Groups patient labs by name, shows SVG sparklines for any lab
 * with 2+ time-ordered readings. Single-point labs fall back to
 * the plain list view.
 */

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react'

// ── helpers ──────────────────────────────────────────────────────────────────

function parseNumeric(str) {
  if (!str) return null
  const m = String(str).match(/^-?(\d+\.?\d*)/)
  return m ? parseFloat(m[1]) : null
}

function extractUnit(str) {
  if (!str) return ''
  return String(str).replace(/^-?\d+\.?\d*\s*/, '').trim()
}

function formatDate(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
  } catch { return d }
}

function formatValue(str) {
  if (!str) return '—'
  const n = parseNumeric(str)
  const u = extractUnit(str)
  if (n === null) return str
  const formatted = Number.isInteger(n) ? n : parseFloat(n.toFixed(1))
  return u ? `${formatted} ${u}` : String(formatted)
}

// ── Sparkline SVG ─────────────────────────────────────────────────────────────

function Sparkline({ values, color, width = 96, height = 36 }) {
  if (values.length < 2) return null

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pad = 4

  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (width - pad * 2)
    const y = pad + (1 - (v - min) / range) * (height - pad * 2)
    return [x, y]
  })

  const polyline = pts.map(([x, y]) => `${x},${y}`).join(' ')
  const [lx, ly] = pts[pts.length - 1]

  // Filled area under the curve
  const areaPoints = [
    `${pts[0][0]},${height}`,
    ...pts.map(([x, y]) => `${x},${y}`),
    `${pts[pts.length - 1][0]},${height}`,
  ].join(' ')

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      style={{ overflow: 'visible' }}
    >
      <polygon points={areaPoints} fill={color} opacity="0.12" />
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lx} cy={ly} r="3" fill={color} />
    </svg>
  )
}

// ── Trend arrow + delta ───────────────────────────────────────────────────────

function TrendBadge({ first, last, unit }) {
  if (first === null || last === null) return null
  const delta = last - first
  const pct = first !== 0 ? ((delta / Math.abs(first)) * 100).toFixed(0) : 0

  if (Math.abs(delta) < 0.01) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-slate-400">
        <Minus className="w-3 h-3" /> stable
      </span>
    )
  }

  const up = delta > 0
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${up ? 'text-rose-500' : 'text-emerald-600'}`}>
      {up
        ? <TrendingUp className="w-3 h-3" />
        : <TrendingDown className="w-3 h-3" />
      }
      {up ? '+' : ''}{parseFloat(delta.toFixed(2))} {unit}
      <span className="text-slate-400 font-normal ml-0.5">({up ? '+' : ''}{pct}%)</span>
    </span>
  )
}

// ── Single trend card ─────────────────────────────────────────────────────────

// Labs where a downward trend is clinically bad (green = up, red = down)
const HIGHER_IS_BETTER = new Set(['egfr', 'hemoglobin', 'hgb', 'platelets', 'wbc'])

function getTrendColor(displayName, delta) {
  if (Math.abs(delta) < 0.01) return '#94a3b8' // slate
  const name = displayName.toLowerCase()
  const higherGood = [...HIGHER_IS_BETTER].some(k => name.includes(k))
  const isGood = higherGood ? delta > 0 : delta < 0
  return isGood ? '#10b981' : '#f43f5e'
}

function TrendCard({ name, readings }) {
  // readings: [{ value, date, numeric }] sorted by date asc
  const numerics = readings.map(r => r.numeric).filter(n => n !== null)
  const unit = extractUnit(readings[readings.length - 1].value)
  const latest = readings[readings.length - 1]
  const earliest = readings[0]
  const delta = numerics.length >= 2 ? numerics[numerics.length - 1] - numerics[0] : 0
  const color = numerics.length >= 2 ? getTrendColor(name, delta) : '#94a3b8'
  const hasSparkline = numerics.length >= 2

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-2">
      {/* Name + latest value */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-slate-700 leading-tight flex-1">{name}</p>
        <div className="text-right shrink-0">
          <p className="text-base font-bold text-slate-900 leading-none">
            {parseNumeric(latest.value) !== null
              ? parseFloat(parseNumeric(latest.value).toFixed(1))
              : latest.value}
          </p>
          {unit && <p className="text-xs text-slate-400 mt-0.5">{unit}</p>}
        </div>
      </div>

      {/* Sparkline */}
      {hasSparkline && (
        <div style={{ color }}>
          <Sparkline values={numerics} color={color} width={110} height={36} />
        </div>
      )}

      {/* Trend badge + date range */}
      <div className="flex items-center justify-between">
        {hasSparkline
          ? <TrendBadge first={numerics[0]} last={numerics[numerics.length - 1]} unit={unit} />
          : <span className="text-xs text-slate-400">single reading</span>
        }
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {hasSparkline
            ? `${formatDate(earliest.date)} → ${formatDate(latest.date)}`
            : formatDate(latest.date)
          }
        </span>
      </div>

      {/* Reading count */}
      {hasSparkline && (
        <p className="text-xs text-slate-400">{readings.length} readings</p>
      )}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function LabTrendChart({ labs }) {
  const grouped = useMemo(() => {
    if (!labs?.length) return []

    // Group by display name (normalised)
    const map = {}
    for (const lab of labs) {
      const key = (lab.display || 'Unknown').trim()
      if (!map[key]) map[key] = []
      map[key].push({
        value: lab.value || '',
        date: lab.date || '',
        numeric: parseNumeric(lab.value),
      })
    }

    // Sort each group by date ascending
    return Object.entries(map)
      .map(([name, readings]) => ({
        name,
        readings: readings
          .filter(r => r.date)
          .sort((a, b) => (a.date > b.date ? 1 : -1)),
      }))
      // Show trended labs first, then single-point
      .sort((a, b) => b.readings.length - a.readings.length)
  }, [labs])

  if (!grouped.length) {
    return <p className="text-xs text-slate-400 italic">No lab results recorded</p>
  }

  // Separate into trended (2+ readings) and single-point
  const trended = grouped.filter(g => g.readings.length >= 2)
  const single  = grouped.filter(g => g.readings.length < 2)

  return (
    <div className="space-y-4">
      {/* Trended labs — grid of sparkline cards */}
      {trended.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Trends over time
          </p>
          <div className="grid grid-cols-2 gap-2">
            {trended.map(g => (
              <TrendCard key={g.name} name={g.name} readings={g.readings} />
            ))}
          </div>
        </div>
      )}

      {/* Single-point labs — compact list */}
      {single.length > 0 && (
        <div>
          {trended.length > 0 && (
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Single readings
            </p>
          )}
          <div className="space-y-1">
            {single.map(g => {
              const r = g.readings[0] || {}
              return (
                <div
                  key={g.name}
                  className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0"
                >
                  <p className="text-sm text-slate-700">{g.name}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-900">
                      {formatValue(r.value)}
                    </span>
                    {r.date && (
                      <span className="text-xs text-slate-400">{formatDate(r.date)}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
