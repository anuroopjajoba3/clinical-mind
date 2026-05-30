import { motion } from 'framer-motion'

/*
  AnatomicalBG
  ─────────────
  Premium floating anatomical SVG illustrations for dark-background pages.
  All elements are ghosted (very low opacity) and drift with slow looping animations.
  Elements: heart cross-section, ECG waveform, DNA helix, neuron, lung, molecule lattice.
*/

/* ── Heart outline ── */
function HeartSVG({ size = 220, opacity = 0.07, color = '#67C5D5' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer heart */}
      <path
        d="M100 170 C60 140, 20 110, 20 70 C20 40, 45 20, 70 20 C85 20, 95 28, 100 36 C105 28, 115 20, 130 20 C155 20, 180 40, 180 70 C180 110, 140 140, 100 170Z"
        stroke={color} strokeWidth="1.2" fill="none" opacity={opacity}
      />
      {/* Aorta */}
      <path d="M95 36 C95 20, 105 10, 115 8 C125 6, 132 12, 130 22" stroke={color} strokeWidth="1" fill="none" opacity={opacity * 0.8} />
      {/* Ventricle lines */}
      <path d="M100 90 L100 145 M85 100 L100 145 L115 100" stroke={color} strokeWidth="0.8" fill="none" opacity={opacity * 0.6} />
      {/* Chambers */}
      <ellipse cx="80" cy="72" rx="22" ry="26" stroke={color} strokeWidth="0.8" fill="none" opacity={opacity * 0.5} />
      <ellipse cx="120" cy="72" rx="22" ry="26" stroke={color} strokeWidth="0.8" fill="none" opacity={opacity * 0.5} />
      {/* Valves */}
      <path d="M68 85 Q80 92 92 85" stroke={color} strokeWidth="0.8" fill="none" opacity={opacity * 0.7} />
      <path d="M108 85 Q120 92 132 85" stroke={color} strokeWidth="0.8" fill="none" opacity={opacity * 0.7} />
      {/* Pulse dot */}
      <circle cx="100" cy="52" r="2.5" fill={color} opacity={opacity * 1.4} />
    </svg>
  )
}

/* ── ECG / EKG waveform ── */
function ECGLine({ width = 380, opacity = 0.09, color = '#67C5D5' }) {
  return (
    <svg width={width} height="80" viewBox={`0 0 ${width} 80`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d={`M0 40 L${width*0.1} 40 L${width*0.15} 38 L${width*0.18} 42 L${width*0.21} 10 L${width*0.24} 70 L${width*0.27} 40 L${width*0.35} 40 L${width*0.38} 36 L${width*0.41} 44 L${width*0.43} 10 L${width*0.46} 70 L${width*0.49} 40 L${width*0.6} 40 L${width*0.63} 38 L${width*0.66} 42 L${width*0.69} 10 L${width*0.72} 70 L${width*0.75} 40 L${width} 40`}
        stroke={color} strokeWidth="1.5" fill="none" opacity={opacity}
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}

/* ── DNA double helix ── */
function DNAHelix({ height = 320, opacity = 0.07, color = '#67C5D5' }) {
  const rungs = 10
  const spacing = height / rungs
  return (
    <svg width="80" height={height} viewBox={`0 0 80 ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Left strand */}
      <path
        d={Array.from({ length: rungs * 4 }, (_, i) => {
          const t = i / (rungs * 4)
          const x = 15 + 14 * Math.sin(t * Math.PI * 2 * rungs / 4)
          const y = t * height
          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
        }).join(' ')}
        stroke={color} strokeWidth="1.2" fill="none" opacity={opacity}
      />
      {/* Right strand */}
      <path
        d={Array.from({ length: rungs * 4 }, (_, i) => {
          const t = i / (rungs * 4)
          const x = 65 - 14 * Math.sin(t * Math.PI * 2 * rungs / 4)
          const y = t * height
          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
        }).join(' ')}
        stroke={color} strokeWidth="1.2" fill="none" opacity={opacity}
      />
      {/* Cross rungs */}
      {Array.from({ length: rungs }, (_, i) => {
        const t = (i + 0.5) / rungs
        const y = t * height
        const xL = 15 + 14 * Math.sin(t * Math.PI * 2)
        const xR = 65 - 14 * Math.sin(t * Math.PI * 2)
        return (
          <g key={i}>
            <line x1={xL} y1={y} x2={xR} y2={y} stroke={color} strokeWidth="0.7" opacity={opacity * 0.8} />
            <circle cx={xL} cy={y} r="2" fill={color} opacity={opacity} />
            <circle cx={xR} cy={y} r="2" fill={color} opacity={opacity} />
          </g>
        )
      })}
    </svg>
  )
}

/* ── Neuron / neural node ── */
function NeuronSVG({ size = 260, opacity = 0.07, color = '#67C5D5' }) {
  const dendrites = [
    { x2: -80, y2: -60 }, { x2: -90, y2: 10 }, { x2: -70, y2: 70 },
    { x2: 80, y2: -60 },  { x2: 90, y2: 10 },  { x2: 70, y2: 70 },
    { x2: 0, y2: -100 },
  ]
  const cx = size / 2, cy = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Axon */}
      <line x1={cx} y1={cy} x2={cx + 100} y2={cy + 90} stroke={color} strokeWidth="1" opacity={opacity} />
      <line x1={cx + 100} y1={cy + 90} x2={cx + 130} y2={cy + 90} stroke={color} strokeWidth="0.7" opacity={opacity * 0.7} />
      <line x1={cx + 100} y1={cy + 90} x2={cx + 105} y2={cy + 110} stroke={color} strokeWidth="0.7" opacity={opacity * 0.7} />
      {/* Dendrites */}
      {dendrites.map((d, i) => (
        <g key={i}>
          <line x1={cx} y1={cy} x2={cx + d.x2} y2={cy + d.y2} stroke={color} strokeWidth="0.8" opacity={opacity} />
          <circle cx={cx + d.x2} cy={cy + d.y2} r="2.5" fill={color} opacity={opacity * 1.2} />
          {/* Sub-branches */}
          <line x1={cx + d.x2} y1={cy + d.y2} x2={cx + d.x2 - 20} y2={cy + d.y2 - 15} stroke={color} strokeWidth="0.5" opacity={opacity * 0.6} />
          <line x1={cx + d.x2} y1={cy + d.y2} x2={cx + d.x2 + 18} y2={cy + d.y2 - 18} stroke={color} strokeWidth="0.5" opacity={opacity * 0.6} />
        </g>
      ))}
      {/* Cell body */}
      <circle cx={cx} cy={cy} r="18" stroke={color} strokeWidth="1.2" fill="none" opacity={opacity} />
      <circle cx={cx} cy={cy} r="8" stroke={color} strokeWidth="0.8" fill="none" opacity={opacity * 0.8} />
      <circle cx={cx} cy={cy} r="3" fill={color} opacity={opacity * 1.5} />
      {/* Myelin sheaths */}
      {[0.25, 0.5, 0.75].map((t, i) => (
        <ellipse key={i}
          cx={cx + 100 * t} cy={cy + 90 * t}
          rx="8" ry="4"
          transform={`rotate(42, ${cx + 100 * t}, ${cy + 90 * t})`}
          stroke={color} strokeWidth="0.7" fill="none" opacity={opacity * 0.7}
        />
      ))}
    </svg>
  )
}

/* ── Molecule lattice ── */
function MoleculeLattice({ opacity = 0.06, color = '#67C5D5' }) {
  const nodes = [
    [100, 50], [160, 90], [140, 160], [80, 180], [40, 130], [50, 65],
    [200, 60], [220, 130], [175, 200],
  ]
  const bonds = [
    [0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[1,6],[6,7],[7,8],[8,2],[0,5],[1,7]
  ]
  return (
    <svg width="260" height="240" viewBox="0 0 260 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      {bonds.map(([a, b], i) => (
        <line key={i}
          x1={nodes[a][0]} y1={nodes[a][1]}
          x2={nodes[b][0]} y2={nodes[b][1]}
          stroke={color} strokeWidth="1" opacity={opacity}
        />
      ))}
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 0 ? 6 : 4} fill={color} opacity={opacity * 1.4} />
      ))}
    </svg>
  )
}

/* ── Lung outline ── */
function LungSVG({ size = 200, opacity = 0.065, color = '#67C5D5' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Trachea */}
      <line x1="100" y1="10" x2="100" y2="55" stroke={color} strokeWidth="1.5" opacity={opacity} />
      <path d="M100 55 C85 55, 70 60, 60 72" stroke={color} strokeWidth="1.2" fill="none" opacity={opacity} />
      <path d="M100 55 C115 55, 130 60, 140 72" stroke={color} strokeWidth="1.2" fill="none" opacity={opacity} />
      {/* Left lung */}
      <path d="M60 72 C40 80, 25 100, 22 125 C20 150, 30 185, 55 195 C70 200, 80 190, 82 175 L80 100 C78 82, 68 72, 60 72Z"
        stroke={color} strokeWidth="1.2" fill="none" opacity={opacity} />
      {/* Right lung */}
      <path d="M140 72 C160 80, 175 100, 178 125 C180 150, 170 185, 145 195 C130 200, 120 190, 118 175 L120 100 C122 82, 132 72, 140 72Z"
        stroke={color} strokeWidth="1.2" fill="none" opacity={opacity} />
      {/* Bronchial branches left */}
      <path d="M72 90 C58 95, 48 108, 44 120" stroke={color} strokeWidth="0.7" fill="none" opacity={opacity * 0.7} />
      <path d="M72 90 C62 105, 55 118, 52 140" stroke={color} strokeWidth="0.7" fill="none" opacity={opacity * 0.7} />
      {/* Bronchial branches right */}
      <path d="M128 90 C142 95, 152 108, 156 120" stroke={color} strokeWidth="0.7" fill="none" opacity={opacity * 0.7} />
      <path d="M128 90 C138 105, 145 118, 148 140" stroke={color} strokeWidth="0.7" fill="none" opacity={opacity * 0.7} />
      {/* Rib-like lines */}
      {[100, 125, 150].map((y, i) => (
        <path key={i} d={`M35 ${y} Q100 ${y - 8} 165 ${y}`} stroke={color} strokeWidth="0.5" fill="none" opacity={opacity * 0.5} />
      ))}
    </svg>
  )
}

/* ── Cross-section circle (cell) ── */
function CellSVG({ size = 160, opacity = 0.07, color = '#67C5D5' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="80" cy="80" r="70" stroke={color} strokeWidth="1" fill="none" opacity={opacity} />
      <circle cx="80" cy="80" r="55" stroke={color} strokeWidth="0.6" fill="none" opacity={opacity * 0.6} strokeDasharray="4 4" />
      {/* Nucleus */}
      <circle cx="80" cy="80" r="22" stroke={color} strokeWidth="1" fill="none" opacity={opacity * 1.2} />
      <circle cx="80" cy="80" r="10" stroke={color} strokeWidth="0.8" fill="none" opacity={opacity} />
      <circle cx="80" cy="80" r="4" fill={color} opacity={opacity * 1.5} />
      {/* Organelles */}
      <ellipse cx="50" cy="55" rx="10" ry="5" stroke={color} strokeWidth="0.7" fill="none" opacity={opacity * 0.8} />
      <ellipse cx="115" cy="100" rx="10" ry="5" stroke={color} strokeWidth="0.7" fill="none" opacity={opacity * 0.8} />
      <ellipse cx="55" cy="115" rx="8" ry="4" stroke={color} strokeWidth="0.7" fill="none" opacity={opacity * 0.7} />
      <ellipse cx="110" cy="50" rx="7" ry="4" stroke={color} strokeWidth="0.7" fill="none" opacity={opacity * 0.7} />
      {/* Membrane details */}
      {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((angle, i) => {
        const r = 70, rad = (angle * Math.PI) / 180
        const x = 80 + r * Math.cos(rad), y = 80 + r * Math.sin(rad)
        return <circle key={i} cx={x} cy={y} r="2" fill={color} opacity={opacity * 0.8} />
      })}
    </svg>
  )
}


/* ══════════════════════════════
   Main export — layout of all elements
   ══════════════════════════════ */
export default function AnatomicalBG({ dark = true }) {
  const c = dark ? '#67C5D5' : '#0E7490'

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>

      {/* Heart — top left, slow float + rotate */}
      <motion.div
        style={{ position: 'absolute', top: '4%', left: '3%' }}
        animate={{ y: [0, -20, 0], rotate: [0, 4, 0], opacity: [1, 0.85, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      >
        <HeartSVG size={220} opacity={dark ? 0.09 : 0.06} color={c} />
      </motion.div>

      {/* DNA — right side, slow vertical drift */}
      <motion.div
        style={{ position: 'absolute', top: '8%', right: '4%' }}
        animate={{ y: [0, 30, 0], x: [0, -10, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      >
        <DNAHelix height={340} opacity={dark ? 0.08 : 0.055} color={c} />
      </motion.div>

      {/* ECG line — horizontal across upper area */}
      <motion.div
        style={{ position: 'absolute', top: '18%', left: '12%' }}
        animate={{ x: [0, 15, 0], opacity: [1, 0.7, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      >
        <ECGLine width={360} opacity={dark ? 0.10 : 0.07} color={c} />
      </motion.div>

      {/* Lung — bottom left */}
      <motion.div
        style={{ position: 'absolute', bottom: '6%', left: '6%' }}
        animate={{ y: [0, -15, 0], scale: [1, 1.03, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
      >
        <LungSVG size={210} opacity={dark ? 0.08 : 0.055} color={c} />
      </motion.div>

      {/* Neuron — center bottom */}
      <motion.div
        style={{ position: 'absolute', bottom: '2%', right: '18%' }}
        animate={{ y: [0, -18, 0], rotate: [0, -3, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 8 }}
      >
        <NeuronSVG size={270} opacity={dark ? 0.07 : 0.05} color={c} />
      </motion.div>

      {/* Cell — right center */}
      <motion.div
        style={{ position: 'absolute', top: '42%', right: '2%' }}
        animate={{ y: [0, 12, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      >
        <CellSVG size={170} opacity={dark ? 0.08 : 0.055} color={c} />
      </motion.div>

      {/* Molecule — center-left mid area */}
      <motion.div
        style={{ position: 'absolute', top: '40%', left: '2%' }}
        animate={{ y: [0, -12, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
      >
        <MoleculeLattice opacity={dark ? 0.07 : 0.05} color={c} />
      </motion.div>

      {/* Second ECG line — lower */}
      <motion.div
        style={{ position: 'absolute', bottom: '28%', right: '8%' }}
        animate={{ x: [0, -12, 0], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 9 }}
      >
        <ECGLine width={280} opacity={dark ? 0.07 : 0.05} color={c} />
      </motion.div>

      {/* Second cell — top center */}
      <motion.div
        style={{ position: 'absolute', top: '2%', left: '42%' }}
        animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <CellSVG size={120} opacity={dark ? 0.06 : 0.04} color={c} />
      </motion.div>

    </div>
  )
}
