import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Zap, FileCheck, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { authAPI, checkApiHealth, formatApiError } from '../api'
import AnatomicalBG from './AnatomicalBG'

const FEATURES = [
  { icon: Shield,    text: 'HIPAA-ready infrastructure' },
  { icon: FileCheck, text: 'FHIR R4 native integration' },
  { icon: Zap,       text: 'Real-time evidence synthesis' },
]
const STATS = [
  { value: '36M+',  label: 'PubMed papers' },
  { value: '8',     label: 'AI agents' },
  { value: '<4min', label: 'Full synthesis' },
]

export default function AuthScreen({ onAuthenticated }) {
  const [apiStatus, setApiStatus] = useState(null)
  const [mode, setMode]           = useState('login')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [name, setName]           = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [focused, setFocused]     = useState(null)
  const isRegister = mode === 'register'

  useEffect(() => {
    let cancelled = false
    checkApiHealth().then(s => { if (!cancelled) setApiStatus(s) })
    return () => { cancelled = true }
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (isRegister && password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      const res = isRegister
        ? await authAPI.register(email.trim(), password, name.trim())
        : await authAPI.login(email.trim(), password)
      const { access_token, user_email, user_name } = res.data
      if (!access_token) { setError('Server returned no access token.'); return }
      sessionStorage.setItem('cm_token', access_token)
      onAuthenticated({ email: user_email, name: user_name || user_email.split('@')[0] })
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const inputCls = (field) =>
    `w-full px-4 py-3 rounded-xl border font-sans text-sm text-cyan-50 placeholder:text-[rgba(148,220,232,0.3)] outline-none transition-all ${
      focused === field
        ? 'border-cyan-400 bg-[rgba(6,182,212,0.08)] shadow-[0_0_0_3px_rgba(6,182,212,0.15)]'
        : 'border-[rgba(103,197,213,0.15)] bg-[rgba(255,255,255,0.04)] hover:border-[rgba(103,197,213,0.3)]'
    }`

  return (
    <div style={{ display: 'flex', minHeight: '100vh', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative', background: '#060E1A' }}>
      <AnatomicalBG dark={true} />

      {/* ══════════════════════════════════════════
          LEFT PANEL — dark brand
      ══════════════════════════════════════════ */}
      <div style={{
        display: 'none',
        width: '52%',
        flexShrink: 0,
        position: 'relative',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'transparent',
        overflow: 'hidden',
        padding: '3rem 3.5rem',
        zIndex: 1,
      }}
        className="lg:flex"
      >
        {/* Large teal glow — TOP RIGHT */}
        <motion.div
          style={{
            position: 'absolute', top: '-15%', right: '-10%',
            width: 600, height: 600, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.35) 0%, rgba(14,116,144,0.15) 50%, transparent 70%)',
            pointerEvents: 'none',
          }}
          animate={{ scale: [1, 1.25, 1], x: [0, -40, 0], y: [0, 50, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Blue glow — BOTTOM LEFT */}
        <motion.div
          style={{
            position: 'absolute', bottom: '-10%', left: '-15%',
            width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(14,165,233,0.25) 0%, rgba(56,189,248,0.1) 50%, transparent 70%)',
            pointerEvents: 'none',
          }}
          animate={{ scale: [1, 1.2, 1], y: [0, -40, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        />
        {/* Purple accent — MIDDLE */}
        <motion.div
          style={{
            position: 'absolute', top: '40%', left: '30%',
            width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
          animate={{ scale: [1, 1.4, 1], x: [0, 30, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />

        {/* Floating cross icons */}
        {[
          { top: '9%',  left: '6%',   size: 28, delay: 0 },
          { top: '36%', right: '4%',  size: 18, delay: 1.5 },
          { bottom: '26%', left: '10%', size: 22, delay: 3 },
          { top: '66%', right: '14%', size: 12, delay: 2 },
          { bottom: '10%', right: '30%', size: 16, delay: 4.5 },
        ].map((pos, i) => (
          <motion.div key={i} style={{ position: 'absolute', ...pos, pointerEvents: 'none' }}
            animate={{ y: [0, -14, 0], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 4 + i * 0.8, repeat: Infinity, ease: 'easeInOut', delay: pos.delay }}>
            <svg width={pos.size} height={pos.size} viewBox="0 0 16 16" fill="none">
              <rect x="6" y="0" width="4" height="16" rx="1.5" fill="white" />
              <rect x="0" y="6" width="16" height="4" rx="1.5" fill="white" />
            </svg>
          </motion.div>
        ))}

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'rgba(6,182,212,0.18)', border: '1px solid rgba(6,182,212,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 800, color: '#67E8F9' }}>CM</span>
          </div>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>
            ClinicalMed
          </span>
        </motion.div>

        {/* Hero copy */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)',
              borderRadius: 999, padding: '6px 14px', marginBottom: 24,
            }}>
              <motion.span
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ width: 7, height: 7, borderRadius: '50%', background: '#22D3EE', display: 'inline-block' }}
              />
              <span style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: '#67E8F9', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                AI Clinical Evidence Platform
              </span>
            </div>

            <h1 style={{ fontFamily: 'Inter', fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.03em', color: 'white', marginBottom: 20 }}>
              Clinical intelligence<br />
              <span style={{ color: '#67E8F9' }}>built for medicine.</span>
            </h1>
            <p style={{ fontFamily: 'Inter', fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, maxWidth: 360 }}>
              Eight AI agents connect live FHIR patient context, investigate 36 million papers, surface contradictions, and synthesize evidence-graded reports — written back to the EMR.
            </p>
          </motion.div>

          {/* Features */}
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div key={f.text}
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 9,
                    background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={13} color="#67E8F9" strokeWidth={2} />
                  </div>
                  <span style={{ fontFamily: 'Inter', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{f.text}</span>
                </motion.div>
              )
            })}
          </div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {STATS.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.85 + i * 0.1 }}>
                <p style={{ fontFamily: 'Inter', fontSize: '1.6rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 6, letterSpacing: '0.06em' }}>{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
          style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgba(255,255,255,0.18)', position: 'relative', zIndex: 10 }}>
          For research use only · Not a substitute for clinical judgment
        </motion.p>
      </div>

      {/* ══════════════════════════════════════════
          RIGHT PANEL — form
      ══════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(6,14,26,0.75)', backdropFilter: 'blur(2px)', position: 'relative', overflow: 'hidden', zIndex: 1 }}>

        {/* Subtle background glow */}
        <motion.div
          style={{
            position: 'absolute', top: '-20%', right: '-10%',
            width: 450, height: 450, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
          animate={{ scale: [1, 1.2, 1], x: [0, -25, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          style={{
            position: 'absolute', bottom: '-10%', left: '10%',
            width: 350, height: 350, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
          animate={{ scale: [1, 1.15, 1], y: [0, -20, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        />

        {/* Mobile logo */}
        <div className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '24px 24px 0' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: '#060E1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#67E8F9' }}>CM</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>ClinicalMed</span>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative', zIndex: 10 }}>
          <motion.div
            initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            style={{
              width: '100%', maxWidth: 420,
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(103,197,213,0.15)',
              borderRadius: 20,
              padding: '2.5rem 2.25rem',
              boxShadow: '0 24px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            {/* Heading */}
            <AnimatePresence mode="wait">
              <motion.div key={mode}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
                style={{ marginBottom: 28 }}>
                <h1 style={{ fontFamily: 'Inter', fontSize: '1.875rem', fontWeight: 800, color: '#F0FDFF', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 8 }}>
                  {isRegister ? 'Create account' : 'Welcome back'}
                </h1>
                <p style={{ fontFamily: 'Inter', fontSize: 14, color: 'rgba(148,220,232,0.75)', lineHeight: 1.6 }}>
                  {isRegister
                    ? 'Join clinical teams using AI evidence synthesis.'
                    : 'Sign in to your clinical evidence workspace.'}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* API warning */}
            {apiStatus?.online === false && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: 20, padding: '12px 16px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, fontSize: 12, color: '#92400E' }}>
                <p style={{ fontWeight: 600, marginBottom: 2 }}>Cannot reach the API</p>
                <p style={{ color: '#B45309' }}>Run: <code style={{ background: '#FEF3C7', padding: '1px 4px', borderRadius: 4 }}>docker compose up</code></p>
              </motion.div>
            )}

            {/* Card */}
            <motion.div layout
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(103,197,213,0.12)', borderRadius: 16, overflow: 'hidden' }}>

              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(103,197,213,0.12)' }}>
                {[['login','Sign in'],['register','Create account']].map(([m, label]) => (
                  <button key={m} type="button" onClick={() => { setMode(m); setError('') }}
                    style={{
                      flex: 1, padding: '14px 0', fontFamily: 'Inter', fontSize: 13, fontWeight: 600,
                      background: 'none', border: 'none', cursor: 'pointer', position: 'relative',
                      color: mode === m ? '#E0FFFE' : 'rgba(148,220,232,0.45)', transition: 'color 0.2s',
                    }}>
                    {label}
                    {mode === m && (
                      <motion.div layoutId="tab-line"
                        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #0E7490, #06B6D4)', borderRadius: '2px 2px 0 0' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }} />
                    )}
                  </button>
                ))}
              </div>

              <div style={{ padding: '28px' }}>
                <AnimatePresence mode="wait">
                  <motion.form key={mode} onSubmit={submit}
                    initial={{ opacity: 0, x: isRegister ? 12 : -12 }}
                    animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {isRegister && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
                        <label style={{ display: 'block', fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: 'rgba(148,220,232,0.6)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Full name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)}
                          onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
                          placeholder="Dr. Jane Smith" autoComplete="name"
                          className={inputCls('name')} />
                      </motion.div>
                    )}

                    <div>
                      <label style={{ display: 'block', fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: 'rgba(148,220,232,0.6)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email</label>
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                        onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                        placeholder="you@hospital.org" autoComplete="email"
                        className={inputCls('email')} />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: 'rgba(148,220,232,0.6)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Password</label>
                      <div style={{ position: 'relative' }}>
                        <input type={showPass ? 'text' : 'password'} required value={password}
                          onChange={e => setPassword(e.target.value)}
                          onFocus={() => setFocused('pass')} onBlur={() => setFocused(null)}
                          placeholder={isRegister ? 'Minimum 8 characters' : 'Your password'}
                          autoComplete={isRegister ? 'new-password' : 'current-password'}
                          minLength={isRegister ? 8 : 1}
                          className={inputCls('pass')}
                          style={{ paddingRight: 44 }} />
                        <button type="button" onClick={() => setShowPass(s => !s)}
                          style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}>
                          {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>

                      {/* Password strength */}
                      {isRegister && password.length > 0 && (
                        <div style={{ marginTop: 8, height: 4, borderRadius: 4, background: 'rgba(103,197,213,0.1)', overflow: 'hidden' }}>
                          <motion.div
                            style={{
                              height: '100%', borderRadius: 4,
                              background: password.length < 6 ? '#EF4444' : password.length < 10 ? '#F59E0B' : '#10B981',
                            }}
                            animate={{ width: `${Math.min(100, (password.length / 12) * 100)}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      )}
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{ fontFamily: 'Inter', fontSize: 12, color: '#B91C1C', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px' }}>
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.button type="submit" disabled={loading}
                      whileHover={{ scale: loading ? 1 : 1.02, boxShadow: loading ? 'none' : '0 8px 24px rgba(6,182,212,0.3)' }}
                      whileTap={{ scale: loading ? 1 : 0.97 }}
                      style={{
                        width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                        background: 'linear-gradient(135deg, #0E7490 0%, #06B6D4 100%)',
                        color: 'white', fontFamily: 'Inter', fontSize: 14, fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        marginTop: 4, transition: 'opacity 0.2s',
                      }}>
                      {loading ? (
                        <>
                          <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                            style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} />
                          Please wait…
                        </>
                      ) : (
                        <>{isRegister ? 'Create account' : 'Sign in'}<ArrowRight size={15} /></>
                      )}
                    </motion.button>
                  </motion.form>
                </AnimatePresence>
              </div>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              style={{ textAlign: 'center', fontFamily: 'Inter', fontSize: 11, color: '#94A3B8', marginTop: 20 }}>
              For research use only · Not a substitute for clinical judgment
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
