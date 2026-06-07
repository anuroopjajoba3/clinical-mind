import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, X } from 'lucide-react'
import { authAPI, formatApiError } from '../api'

export default function AuthModal({ onAuth, onClose }) {
  const [mode, setMode]         = useState('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [focused, setFocused]   = useState(null)
  const isRegister = mode === 'register'

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = isRegister
        ? await authAPI.register(email.trim(), password, name.trim())
        : await authAPI.login(email.trim(), password)
      const { access_token, user_email, user_name } = res.data
      sessionStorage.setItem('cm_token', access_token)
      onAuth({ email: user_email, name: user_name, token: access_token })
    } catch (err) {
      setError(formatApiError ? formatApiError(err) : (err.response?.data?.detail || 'An error occurred.'))
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px] rounded-2xl bg-white border border-slate-200 overflow-hidden"
        style={{ boxShadow: '0 24px 80px rgba(15,23,42,0.18), 0 4px 16px rgba(15,23,42,0.08)' }}>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between">
          <AnimatePresence mode="wait">
            <motion.div key={mode}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}>
              <h2 className="font-sans text-[18px] font-black text-slate-900 tracking-tight leading-tight">
                {isRegister ? 'Create account' : 'Welcome back'}
              </h2>
              <p className="font-sans text-[13px] text-slate-500 mt-1">
                {isRegister
                  ? 'Join clinical teams using AI evidence synthesis.'
                  : 'Sign in to your clinical evidence workspace.'}
              </p>
            </motion.div>
          </AnimatePresence>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0 ml-3"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={15} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          {[['login', 'Sign in'], ['register', 'Create account']].map(([m, label]) => (
            <button key={m} type="button" onClick={() => { setMode(m); setError('') }}
              className="relative flex-1 py-3 font-sans text-[13px] font-semibold transition-colors"
              style={{ color: mode === m ? '#0891B2' : '#94A3B8', background: 'none', border: 'none', cursor: 'pointer' }}>
              {label}
              {mode === m && (
                <motion.div layoutId="modal-tab-line"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0891B2]"
                  style={{ borderRadius: '2px 2px 0 0' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }} />
              )}
            </button>
          ))}
        </div>

        {/* Form */}
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
                    placeholder={isRegister ? 'Minimum 8 characters' : "Your password"}
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
                className="w-full py-3.5 rounded-xl font-sans text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-colors"
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

        <div className="px-6 pb-5 text-center">
          <p className="font-sans text-[11px] text-slate-400">
            For research use only · Not a substitute for clinical judgment
          </p>
        </div>
      </motion.div>
    </div>
  )
}
