/**
 * AnatomyBackground — subtle animated SVG background with medical/anatomical motifs.
 * Ported from the Figma "Enhance Design Aesthetics" project.
 */
import { motion } from 'framer-motion'

const paths = [
  // Heart outline
  "M 80 160 C 80 130 120 110 150 130 C 180 110 220 130 220 160 C 220 200 150 240 150 240 C 150 240 80 200 80 160 Z",
  // Lung left
  "M 300 200 C 270 180 250 210 260 240 C 265 260 280 270 290 260 C 295 240 300 220 300 200 Z",
  // Lung right
  "M 340 200 C 370 180 390 210 380 240 C 375 260 360 270 350 260 C 345 240 340 220 340 200 Z",
  // DNA helix strand 1
  "M 500 100 C 520 120 540 140 520 160 C 500 180 480 200 500 220 C 520 240 540 260 520 280",
  // DNA helix strand 2
  "M 540 100 C 520 120 500 140 520 160 C 540 180 560 200 540 220 C 520 240 500 260 520 280",
  // Brain outline
  "M 700 120 C 680 100 650 105 640 125 C 625 140 625 165 640 175 C 630 185 628 200 640 205 C 648 220 668 220 680 210 C 690 225 710 225 720 210 C 732 220 752 220 760 205 C 772 200 770 185 760 175 C 775 165 775 140 760 125 C 750 105 720 100 700 120 Z",
  // Spine
  "M 900 80 L 900 300 M 885 100 L 915 100 M 885 125 L 915 125 M 885 150 L 915 150 M 885 175 L 915 175 M 885 200 L 915 200 M 885 225 L 915 225 M 885 250 L 915 250 M 885 275 L 915 275",
]

const crosshairs = [
  { cx: 150, cy: 400 }, { cx: 800, cy: 150 }, { cx: 1100, cy: 450 },
  { cx: 400, cy: 550 }, { cx: 1300, cy: 200 },
]

export function AnatomyBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 800"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Grid lines */}
        {Array.from({ length: 20 }).map((_, i) => (
          <line
            key={`v${i}`}
            x1={i * 80} y1={0} x2={i * 80} y2={800}
            stroke="rgba(59,130,246,0.04)" strokeWidth="1"
          />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={`h${i}`}
            x1={0} y1={i * 80} x2={1440} y2={i * 80}
            stroke="rgba(59,130,246,0.04)" strokeWidth="1"
          />
        ))}

        {/* Anatomical paths */}
        {paths.map((d, i) => (
          <motion.path
            key={i}
            d={d}
            stroke="rgba(99,102,241,0.08)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 3, delay: i * 0.4, ease: 'easeInOut' }}
          />
        ))}

        {/* Crosshair markers */}
        {crosshairs.map((c, i) => (
          <g key={i} opacity="0.12">
            <circle cx={c.cx} cy={c.cy} r="16" stroke="rgb(99,102,241)" strokeWidth="1" fill="none" />
            <line x1={c.cx - 22} y1={c.cy} x2={c.cx + 22} y2={c.cy} stroke="rgb(99,102,241)" strokeWidth="1" />
            <line x1={c.cx} y1={c.cy - 22} x2={c.cx} y2={c.cy + 22} stroke="rgb(99,102,241)" strokeWidth="1" />
          </g>
        ))}

        {/* Subtle gradient blobs */}
        <defs>
          <radialGradient id="blob1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgb(219,234,254)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="rgb(219,234,254)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="blob2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgb(233,213,255)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="rgb(233,213,255)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="200" cy="200" rx="300" ry="250" fill="url(#blob1)" />
        <ellipse cx="1200" cy="600" rx="350" ry="280" fill="url(#blob2)" />
      </svg>
    </div>
  )
}
