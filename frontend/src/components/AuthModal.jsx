import React, { useState } from 'react'
import { authAPI } from '../api'

export default function AuthModal({ onAuth, onClose }) {
  const [mode, setMode]         = useState('login')   // 'login' | 'register'
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = mode === 'login'
        ? await authAPI.login(email, password)
        : await authAPI.register(email, password, name)

      const { access_token, user_email, user_name } = res.data
      sessionStorage.setItem('cm_token', access_token)
      onAuth({ email: user_email, name: user_name, token: access_token })
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl border border-clinical-border
                      bg-clinical-card shadow-2xl animate-slide-up opacity-0"
           style={{ animationFillMode: 'forwards' }}>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-clinical-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              {mode === 'login' ? 'Sign in to ClinicalMind' : 'Create your account'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {mode === 'login' ? 'Access your search history and saved reports' : 'Free account — no credit card required'}
            </p>
          </div>
          <button onClick={onClose}
                  className="text-gray-600 hover:text-gray-300 transition-colors text-xl leading-none">
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="p-6 flex flex-col gap-4">
          {mode === 'register' && (
            <div>
              <label className="text-xs font-medium text-gray-400 block mb-1.5">Full name</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Dr. Jane Smith"
                className="input-clinical w-full rounded-lg px-4 py-2.5 text-sm"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1.5">Email</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@hospital.org"
              className="input-clinical w-full rounded-lg px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1.5">Password</label>
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
              minLength={mode === 'register' ? 8 : 1}
              className="input-clinical w-full rounded-lg px-4 py-2.5 text-sm"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-sm text-red-300">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
                  className="btn-primary w-full py-2.5 rounded-xl text-sm mt-1">
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>

          <p className="text-center text-xs text-gray-500">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button type="button" onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError('') }}
                    className="text-blue-400 hover:text-blue-300 transition-colors">
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
