import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative bg-white overflow-hidden" style={{ minHeight: '100svh' }}>

      {/* Subtle dot grid — left side only */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #CBD5E1 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          opacity: 0.28,
          maskImage: 'radial-gradient(ellipse 55% 80% at 15% 50%, black 10%, transparent 75%)',
        }} />

      <div className="relative z-10 max-w-[1280px] mx-auto px-6 md:px-14 flex items-center"
        style={{ minHeight: '100svh', paddingTop: 96, paddingBottom: 80 }}>
        <div className="grid lg:grid-cols-[1fr_1.12fr] gap-12 lg:gap-16 items-center w-full">

          {/* Left: text */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}>

            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="font-sans text-[11px] font-bold tracking-[0.18em] uppercase text-[#1a56db] mb-8">
              Clinical Evidence Intelligence
            </motion.p>

            <h1 className="text-slate-900 leading-[1.06] tracking-[-0.02em] mb-7"
              style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(2.6rem, 5vw, 4.2rem)', fontWeight: 800 }}>
              Clinical intelligence,
              <br />
              <em style={{ fontStyle: 'italic', color: '#1a56db', fontWeight: 700 }}>
                built for medicine.
              </em>
            </h1>

            <p className="font-sans text-[17px] text-slate-500 leading-[1.7] max-w-[460px] mb-10">
              Eight AI agents search 35 million papers, grade evidence, check
              drug interactions, and write structured reports back to your EMR —
              in about 60 seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 items-start mb-10">
              <a href="#cta"
                className="px-7 py-3.5 rounded-full bg-[#1a56db] hover:bg-[#1648c2] text-white font-sans text-[14px] font-semibold transition-colors shadow-sm">
                Request access
              </a>
              <a href="#features"
                className="inline-flex items-center gap-1.5 px-5 py-3.5 font-sans text-[14px] font-medium text-slate-600 hover:text-slate-900 transition-colors">
                How it works <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="flex items-center gap-6 flex-wrap">
              {['FHIR R4 Native', 'LangGraph · 8 Agents', 'HIPAA Ready', 'EMR Write-back'].map(t => (
                <span key={t} className="font-sans text-[12px] text-slate-400 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  {t}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right: photo + floating cards */}
          <motion.div
            initial={{ opacity: 0, x: 36 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.85, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden lg:block">

            {/* Main photo */}
            <div className="relative rounded-[2rem] overflow-hidden" style={{ height: 620 }}>
              <img
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80"
                alt="Clinical professional reviewing evidence"
                className="w-full h-full object-cover"
              />
              {/* Subtle blue wash on top-right */}
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(135deg, rgba(26,86,219,0.07) 0%, transparent 55%, rgba(15,23,42,0.18) 100%)'
              }} />
            </div>

            {/* Card: FHIR loaded — top left, overlaps photo edge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.5 }}
              className="absolute -left-12 top-12">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
                className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{ boxShadow: '0 8px 40px rgba(15,23,42,0.13)', border: '1px solid #F1F5F9', minWidth: 240 }}>
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-600 text-[13px] font-bold">✓</span>
                </div>
                <div>
                  <p className="font-sans text-[12px] font-bold text-slate-800">FHIR context loaded</p>
                  <p className="font-sans text-[11px] text-slate-400">Sarah K. · MRN-00421 · HFrEF</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Card: 8 agents running — top right */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.15, duration: 0.5 }}
              className="absolute -right-6 top-14">
              <motion.div
                animate={{ y: [0, 9, 0] }}
                transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                className="bg-[#1a56db] rounded-2xl px-4 py-3"
                style={{ boxShadow: '0 8px 32px rgba(26,86,219,0.38)' }}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse" />
                  <p className="font-sans text-[12px] font-bold text-white">8 agents running</p>
                </div>
                <p className="font-sans text-[11px] text-blue-200">PubMed · ClinicalTrials · Synthesis</p>
              </motion.div>
            </motion.div>

            {/* Card: Drug interaction — bottom left */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.5 }}
              className="absolute -left-12 bottom-24">
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 1.1 }}
                className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{ boxShadow: '0 8px 40px rgba(15,23,42,0.13)', border: '1px solid #F1F5F9', minWidth: 258 }}>
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-500 text-[14px]">⚠</span>
                </div>
                <div>
                  <p className="font-sans text-[12px] font-bold text-slate-800">Drug interaction flagged</p>
                  <p className="font-sans text-[11px] text-slate-400">Clarithromycin + Atorvastatin · Major</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Card: Level 1A — right middle */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.45, duration: 0.5 }}
              className="absolute -right-8" style={{ top: '42%' }}>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
                className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{ boxShadow: '0 8px 40px rgba(15,23,42,0.13)', border: '1px solid #F1F5F9' }}>
                <div className="w-8 h-8 rounded-lg bg-[#1a56db] flex items-center justify-center flex-shrink-0">
                  <span className="font-sans text-[10px] font-extrabold text-white">1A</span>
                </div>
                <div>
                  <p className="font-sans text-[12px] font-bold text-slate-800">Level 1A · 94% confidence</p>
                  <p className="font-sans text-[11px] text-slate-400">EMPEROR-Reduced · NEJM 2020</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Card: Written to EMR — bottom right (on photo) */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 0.5 }}
              className="absolute right-8 bottom-10">
              <motion.div
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut', delay: 1.6 }}
                className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{ boxShadow: '0 8px 40px rgba(15,23,42,0.13)', border: '1px solid #F1F5F9', minWidth: 224 }}>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-[14px]">📄</span>
                </div>
                <div>
                  <p className="font-sans text-[12px] font-bold text-slate-800">Written to EMR</p>
                  <p className="font-sans text-[11px] text-slate-400">DocumentReference · HAPI FHIR R4</p>
                </div>
              </motion.div>
            </motion.div>

          </motion.div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 lg:left-[28%]"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}>
        <div className="w-5 h-8 rounded-full border-2 border-slate-200 flex items-start justify-center pt-1.5">
          <div className="w-1 h-2 rounded-full bg-slate-300" />
        </div>
      </motion.div>

    </section>
  )
}
