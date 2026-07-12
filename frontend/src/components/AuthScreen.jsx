import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Zap, FileCheck, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react'
import { authAPI, checkApiHealth, formatApiError } from '../api'
import AnatomicalBG from './AnatomicalBG'

const FEATURES = [
  { icon: Shield,    text: 'HIPAA-ready infrastructure' },
  { icon: FileCheck, text: 'FHIR R4 native integration' },
  { icon: Zap,       text: 'Real-time evidence synthesis' },
]
const STATS = [
  { value: '35M+',  label: 'PubMed papers indexed' },
  { value: '8',     label: 'AI agents per run' },
  { value: '~60 sec', label: 'Full synthesis time' },
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

  const inputBase = (field) =>
    `w-full px-4 py-3 rounded-xl border font-sans text-[14px] text-slate-800 placeholder:text-slate-300 outline-none transition-all bg-white ${
      focused === field
        ? 'border-[#0891B2] shadow-[0_0_0_3px_rgba(8,145,178,0.12)]'
        : 'border-slate-200 hover:border-slate-300'
    }`

  return (
    <div className="min-h-screen flex font-sans bg-white relative overflow-hidden">
      {/* Anatomical illustrations — sit between panel bg and text content */}
      <AnatomicalBG dark={false} />

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex w-[52%] flex-shrink-0 flex-col justify-between border-r border-slate-100 px-14 py-12 relative" style={{ zIndex: 3, background: 'rgba(248,250,252,0.92)' }}>

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0891B2] flex items-center justify-center">
            <span className="font-sans text-[11px] font-extrabold text-white">CM</span>
          </div>
          <span className="font-sans text-[15px] font-bold text-slate-900">ClinicalMind</span>
        </motion.div>

        {/* Hero copy */}
        <div>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}>
            <span className="inline-flex items-center gap-2 text-[11px] font-bold text-[#0891B2] tracking-[0.12em] uppercase bg-[#ECFEFF] border border-[#A5F3FC] px-3 py-1.5 rounded-full mb-6">
              <motion.span className="w-1.5 h-1.5 rounded-full bg-[#0891B2]"
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
              AI Clinical Evidence Platform
            </span>
            <h1 className="font-sans font-black text-slate-900 tracking-[-0.04em] leading-[1.06] mb-5"
              style={{ fontSize: 'clamp(2rem, 3vw, 2.8rem)' }}>
              Clinical intelligence<br />
              <span className="text-[#0891B2]">built for medicine.</span>
            </h1>
            <p className="font-sans text-[14px] text-slate-500 leading-relaxed max-w-[340px]">
              Eight AI agents connect live FHIR patient context, investigate 35 million papers,
              surface contradictions, and synthesize evidence-graded reports written back to the EMR.
            </p>
          </motion.div>

          {/* Feature bullets */}
          <div className="mt-8 flex flex-col gap-3.5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div key={f.text}
                  initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Icon size={14} className="text-[#0891B2]" strokeWidth={2} />
                  </div>
                  <span className="font-sans text-[13px] text-slate-600">{f.text}</span>
                </motion.div>
              )
            })}
          </div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-3 gap-6">
            {STATS.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.75 + i * 0.1 }}>
                <p className="font-sans text-[1.5rem] font-black text-slate-900 leading-none tracking-tight">{s.value}</p>
                <p className="font-sans text-[11px] text-slate-400 mt-1.5 leading-snug">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="font-sans text-[11px] text-slate-400">
          For research use only · Not a substitute for clinical judgment
        </motion.p>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative" style={{ zIndex: 3, background: 'rgba(255,255,255,0.92)' }}>

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8 self-start">
          <div className="w-7 h-7 rounded-lg bg-[#0891B2] flex items-center justify-center">
            <span className="font-sans text-[10px] font-extrabold text-white">CM</span>
          </div>
          <span className="font-sans text-[14px] font-bold text-slate-900">ClinicalMind</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[400px]">

          {/* Heading */}
          <AnimatePresence mode="wait">
            <motion.div key={mode}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mb-7">
              <h1 className="font-sans text-[1.75rem] font-black text-slate-900 tracking-[-0.04em] leading-tight mb-2">
                {isRegister ? 'Create account' : 'Welcome back'}
              </h1>
              <p className="font-sans text-[14px] text-slate-500">
                {isRegister
                  ? 'Join clinical teams using AI evidence synthesis.'
                  : 'Sign in to your clinical evidence workspace.'}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* API warning */}
          {apiStatus?.online === false && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-[12px] text-amber-800">
              <p className="font-semibold mb-0.5">Cannot reach the API</p>
              <p className="text-amber-700">Run: <code className="bg-amber-100 px-1.5 py-0.5 rounded">docker compose up</code></p>
            </motion.div>
          )}

          {/* Card */}
          <motion.div layout
            className="rounded-2xl border border-slate-200 overflow-hidden bg-white"
            style={{ boxShadow: '0 4px 24px rgba(15,23,42,0.07), 0 1px 4px rgba(15,23,42,0.04)' }}>

            {/* Tabs */}
            <div className="flex border-b border-slate-100">
              {[['login', 'Sign in'], ['register', 'Create account']].map(([m, label]) => (
                <button key={m} type="button" onClick={() => { setMode(m); setError('') }}
                  className="relative flex-1 py-3.5 font-sans text-[13px] font-semibold transition-colors"
                  style={{ color: mode === m ? '#0891B2' : '#94A3B8', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {label}
                  {mode === m && (
                    <motion.div layoutId="auth-tab-line"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0891B2]"
                      style={{ borderRadius: '2px 2px 0 0' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }} />
                  )}
                </button>
              ))}
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.form key={mode} onSubmit={submit}
                  initial={{ opacity: 0, x: isRegister ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-4">

                  {isRegister && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}>
                      <label className="block font-sans text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-[0.08em]">Full name</label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)}
                        onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
                        placeholder="Dr. Jane Smith" autoComplete="name"
                        className={inputBase('name')} />
                    </motion.div>
                  )}

                  <div>
                    <label className="block font-sans text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-[0.08em]">Email</label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                      placeholder="you@hospital.org" autoComplete="email"
                      className={inputBase('email')} />
                  </div>

                  <div>
                    <label className="block font-sans text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-[0.08em]">Password</label>
                    <div className="relative">
                      <input type={showPass ? 'text' : 'password'} required value={password}
                        onChange={e => setPassword(e.target.value)}
                        onFocus={() => setFocused('pass')} onBlur={() => setFocused(null)}
                        placeholder={isRegister ? 'Minimum 8 characters' : 'Your password'}
                        autoComplete={isRegister ? 'new-password' : 'current-password'}
                        minLength={isRegister ? 8 : 1}
                        className={inputBase('pass')}
                        style={{ paddingRight: '2.75rem' }} />
                      <button type="button" onClick={() => setShowPass(s => !s)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>

                    {isRegister && password.length > 0 && (
                      <div className="mt-2 h-1 rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: password.length < 6 ? '#EF4444' : password.length < 10 ? '#F59E0B' : '#10B981' }}
                          animate={{ width: `${Math.min(100, (password.length / 12) * 100)}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    )}
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -6, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="font-sans text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button type="submit" disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.015 }}
                    whileTap={{ scale: loading ? 1 : 0.975 }}
                    className="w-full py-3.5 rounded-xl font-sans text-[14px] font-semibold text-white flex items-center justify-center gap-2 mt-1 transition-colors"
                    style={{
                      background: loading ? '#94A3B8' : '#0891B2',
                      border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    }}>
                    {loading ? (
                      <>
                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" />
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

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-center font-sans text-[11px] text-slate-400 mt-5">
            For research use only · Not a substitute for clinical judgment
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
