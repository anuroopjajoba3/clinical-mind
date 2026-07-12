import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

const CHART_POINTS = [40, 55, 48, 62, 58, 72, 68, 85, 78, 92, 88, 100]
const CHART_W = 400
const CHART_H = 56

function buildPath(points) {
  const step = CHART_W / (points.length - 1)
  const coords = points.map((p, i) => {
    const x = i * step
    const y = CHART_H - (p / 100) * CHART_H
    return `${i === 0 ? 'M' : 'L'}${x},${y}`
  })
  return coords.join(' ')
}

const highlightIdx = 9
const highlightX = (highlightIdx / (CHART_POINTS.length - 1)) * CHART_W
const highlightY = CHART_H - (CHART_POINTS[highlightIdx] / 100) * CHART_H

export default function HeroMockup() {
  return (
    <motion.div
      className="w-full max-w-[980px] mx-auto px-6 md:px-12 pb-0"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.85, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="bg-white border-[1.5px] border-[#D8D2C8] rounded-t-[14px] shadow-float overflow-hidden">
        <div className="flex items-center gap-2.5 px-[18px] py-3 bg-[#F2EEE8] border-b border-[#E4DDD4]">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          </div>
          <span className="font-sans text-xs text-[#888888]">
            ClinicalMind — Sarah K. · MRN-00421 · FHIR R4
          </span>
        </div>

        <div className="px-6 pt-6 pb-5 bg-[#FAFAF8]">
          <p className="font-display text-lg font-bold text-ink">Good morning, Dr. Chen</p>
          <p className="font-sans text-[13px] text-[#888888] mt-1 mb-5">
            Your evidence pipeline for Sarah K. is ready to review.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white border border-[#E8E4DC] rounded-lg p-[18px] relative min-h-[140px]">
              <div className="flex items-start justify-between">
                <p className="font-sans text-[11px] text-[#888888]">Evidence confidence</p>
                <span className="text-ink text-sm leading-none">✳</span>
              </div>
              <div className="flex items-end justify-between mt-3 gap-3">
                <p className="font-display text-[32px] font-bold text-ink leading-none">94%</p>
                <div className="w-14 h-14 bg-accent flex-shrink-0" />
              </div>
            </div>

            <div className="bg-white border border-[#E8E4DC] rounded-lg p-[18px] min-h-[140px]">
              <div className="flex items-start justify-between">
                <p className="font-sans text-[11px] text-[#888888]">Papers retrieved</p>
                <Sparkles className="w-3.5 h-3.5 text-[#888888]" strokeWidth={1.5} />
              </div>
              <p className="font-display text-[32px] font-bold text-ink mt-3 leading-none">
                17 <span className="text-base font-sans font-medium text-[#888888]">sources</span>
              </p>
              <p className="font-sans text-xs font-semibold text-[#2563EB] mt-2">↑ 14 PubMed · 3 Trials</p>
            </div>

            <div className="bg-white border border-[#E8E4DC] rounded-lg p-[18px] min-h-[140px] relative overflow-hidden">
              <span className="absolute top-3 right-3 font-sans text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF9C3] text-[#854D0E]">
                Insight
              </span>
              <div
                className="absolute inset-0 opacity-[0.12] bg-cover bg-center"
                style={{
                  backgroundImage:
                    'url(https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=80&auto=format)',
                }}
              />
              <div className="relative">
                <p className="font-sans text-[11px] text-[#888888]">Patient memory</p>
                <p className="font-sans text-sm font-semibold text-ink mt-2 leading-snug max-w-[200px]">
                  eGFR trajectory flags Stage 4 risk at current pace.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-white border border-[#E8E4DC] rounded-lg px-5 py-4">
            <p className="font-sans text-[11px] text-[#888888] mb-3">Evidence synthesis trend</p>
            <svg
              viewBox={`0 0 ${CHART_W} ${CHART_H + 16}`}
              className="w-full h-16 overflow-visible"
              preserveAspectRatio="none"
            >
              <path
                d={buildPath(CHART_POINTS)}
                fill="none"
                stroke="#0A0A09"
                strokeWidth="1.5"
                strokeOpacity="0.15"
                vectorEffect="non-scaling-stroke"
              />
              <motion.path
                d={buildPath(CHART_POINTS)}
                fill="none"
                stroke="#0A0A09"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
              <motion.circle
                cx={highlightX}
                cy={highlightY}
                r="14"
                fill="#F5E047"
                stroke="#0A0A09"
                strokeWidth="1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.4, type: 'spring', stiffness: 260 }}
              />
              <text
                x={highlightX}
                y={highlightY + 4}
                textAnchor="middle"
                className="font-sans text-[10px] font-bold fill-ink"
              >
                17
              </text>
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
