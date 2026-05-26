import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { authAPI, checkApiHealth, formatApiError } from '../api'

export default function AuthScreen({ onAuthenticated }) {
  const [apiStatus, setApiStatus] = useState(null)
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    if (mode === 'register' && password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      const res = mode === 'login'
        ? await authAPI.login(email.trim(), password)
        : await authAPI.register(email.trim(), password, name.trim())

      const { access_token, user_email, user_name } = res.data
      if (!access_token) {
        setError('Server returned no access token.')
        return
      }
      sessionStorage.setItem('cm_token', access_token)
      onAuthenticated({
        email: user_email,
        name: user_name || user_email.split('@')[0],
      })
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const isRegister = mode === 'register'

  useEffect(() => {
    let cancelled = false
    checkApiHealth().then(s => {
      if (!cancelled) setApiStatus(s)
    })
    return () => { cancelled = true }
  }, [])

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden bg-hero-aether"
      style={{ fontFamily: "'Source Sans 3', system-ui, sans-serif" }}
    >
      <div className="absolute inset-0 bg-grain opacity-20 pointer-events-none" />

      <header className="relative z-10 h-16 px-6 md:px-10 flex items-center justify-between">
        <a
          href="/"
          className="text-[1.125rem] font-semibold text-[#1a1a1a] tracking-[-0.02em]"
        >
          ClinicalMed
        </a>
        <a href="/" className="text-[0.8125rem] text-[#5c5c5c] hover:text-[#1a1a1a] transition-colors">
          Back
        </a>
      </header>

      <div className="relative z-10 flex-1 flex items-center justify-center px-6 pb-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[400px]"
        >
          <div className="mb-7">
            <h1 className="text-[1.75rem] font-semibold text-[#1a1a1a] tracking-[-0.03em] leading-tight">
              {isRegister ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-[0.9375rem] text-[#5c5c5c] mt-2 leading-relaxed font-normal">
              {isRegister
                ? 'Clinical evidence workspace — FHIR context, agent pipeline, EMR write-back.'
                : 'Sign in to access patients, evidence search, and your query history.'}
            </p>
          </div>

          {apiStatus?.online === false && (
            <div className="mb-4 text-[0.8125rem] leading-relaxed text-[#92400e] bg-[#fffbeb] border border-[#fde68a] rounded-lg px-3.5 py-2.5">
              <p className="font-medium mb-1">Cannot reach the API</p>
              <p className="text-[#78716c]">
                Run from project root:{' '}
                <code className="text-[0.75rem] bg-[#fef3c7] px-1 py-0.5 rounded">docker compose up</code>
                {' '}— ClinicalMed API is on port <strong>8001</strong> (port 8000 is used by another container on your machine).
              </p>
            </div>
          )}
          {apiStatus?.degraded && (
            <div className="mb-4 text-[0.8125rem] text-[#5c5c5c] bg-[#f4f1eb] border border-[#e0dcd4] rounded-lg px-3.5 py-2.5">
              API is up but some services are degraded (check Redis / database). Sign-in may still work.
            </div>
          )}

          <div className="bg-white border border-[#e0dcd4] rounded-2xl shadow-[0_12px_40px_rgba(26,26,26,0.08)] p-6 md:p-7">
            <div className="flex p-1 mb-6 bg-[#f4f1eb] rounded-lg">
              {['login', 'register'].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setError('') }}
                  className={`flex-1 py-2 text-[0.8125rem] font-medium rounded-md transition-all ${
                    mode === m
                      ? 'bg-white text-[#1a1a1a] shadow-sm'
                      : 'text-[#7a7a7a] hover:text-[#1a1a1a]'
                  }`}
                >
                  {m === 'login' ? 'Sign in' : 'Register'}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                onSubmit={submit}
                className="flex flex-col gap-4"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                {isRegister && (
                  <div>
                    <label htmlFor="name" className="block text-[0.8125rem] font-medium text-[#3d3d3d] mb-1.5">
                      Full name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Dr. Jane Smith"
                      autoComplete="name"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#e0dcd4] bg-[#faf9f7] text-[0.9375rem] text-[#1a1a1a] placeholder:text-[#a8a8a8] outline-none focus:border-[#5B8F85] focus:ring-1 focus:ring-[#5B8F85]/25 transition-shadow"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-[0.8125rem] font-medium text-[#3d3d3d] mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@hospital.org"
                    autoComplete="email"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#e0dcd4] bg-[#faf9f7] text-[0.9375rem] text-[#1a1a1a] placeholder:text-[#a8a8a8] outline-none focus:border-[#5B8F85] focus:ring-1 focus:ring-[#5B8F85]/25 transition-shadow"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-[0.8125rem] font-medium text-[#3d3d3d] mb-1.5">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={isRegister ? 'Minimum 8 characters' : 'Your password'}
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    minLength={isRegister ? 8 : 1}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#e0dcd4] bg-[#faf9f7] text-[0.9375rem] text-[#1a1a1a] placeholder:text-[#a8a8a8] outline-none focus:border-[#5B8F85] focus:ring-1 focus:ring-[#5B8F85]/25 transition-shadow"
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[0.8125rem] leading-relaxed text-[#9f1239] bg-[#fff1f2] border border-[#fecdd3] rounded-lg px-3.5 py-2.5"
                    role="alert"
                  >
                    {error}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-1 py-2.5 rounded-lg bg-[#1a1a1a] text-white text-[0.9375rem] font-medium hover:bg-[#333] disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
                </button>
              </motion.form>
            </AnimatePresence>
          </div>

          <p className="text-center text-[0.75rem] text-[#8a8a8a] mt-5">
            For research use only · Not a substitute for clinical judgment
          </p>
        </motion.div>
      </div>
    </div>
  )
}
