import { useState } from 'react'
import { useApp } from '../context/useApp'
import { Shield, User, Eye, EyeOff, ArrowLeft, Zap } from 'lucide-react'

const ADMIN_CREDS = { email: 'admin@resqnet.com', password: 'admin123' }

export default function Auth() {
  const { login, register, firebaseEnabled } = useApp()
  const [screen, setScreen] = useState('pick')
  const [mode,   setMode]   = useState('login')
  const [form,   setForm]   = useState({ name: '', email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [error,  setError]  = useState('')
  const [loading, setLoading] = useState(false)

  const reset = (s) => { setScreen(s); setForm({ name: '', email: '', password: '' }); setError(''); setMode('login') }
  const localUsers = () => JSON.parse(localStorage.getItem('resqnet_users') || '[]')

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await new Promise(r => setTimeout(r, 500))

      if (screen === 'admin') {
        // Admin always uses hardcoded creds (or Firebase if enabled)
        if (form.email === ADMIN_CREDS.email && form.password === ADMIN_CREDS.password) {
          await login({ id: 'admin', name: 'Admin', email: form.email, role: 'admin' })
        } else { setError('Invalid admin credentials.') }
        setLoading(false); return
      }

      if (firebaseEnabled) {
        // Firebase auth
        if (mode === 'login') {
          await login({ email: form.email, password: form.password })
        } else {
          if (!form.name.trim()) { setError('Name is required.'); setLoading(false); return }
          await register({ name: form.name, email: form.email, password: form.password })
        }
      } else {
        // localStorage auth
        if (mode === 'login') {
          const found = localUsers().find(u => u.email === form.email && u.password === form.password)
          if (!found) { setError('Invalid email or password.'); setLoading(false); return }
          await login(found)
        } else {
          if (!form.name.trim()) { setError('Name is required.'); setLoading(false); return }
          if (localUsers().find(u => u.email === form.email)) { setError('Email already registered.'); setLoading(false); return }
          await register({ name: form.name, email: form.email, password: form.password })
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.')
    }
    setLoading(false)
  }

  /* ── PICK SCREEN ── */
  if (screen === 'pick') return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden bg-[#0a0a0f]">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm animate-fade-up">
        <div className="flex flex-col items-center mb-12">
          <div className="relative mb-5">
            <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-900/50 animate-glow">
              <Shield size={44} className="text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-[#0a0a0f] flex items-center justify-center">
              <Zap size={10} className="text-white" fill="white" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">RESQNET</h1>
          <p className="text-sm text-gray-400 mt-2 text-center">Disaster Response &amp; Emergency Network</p>
        </div>

        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center mb-5">Select your role</p>

        <div className="space-y-3">
          <button onClick={() => reset('user')}
            className="w-full group rounded-2xl p-px bg-gradient-to-r from-blue-500/30 to-blue-600/30 hover:from-blue-500/60 hover:to-blue-600/60 transition-all duration-200 active:scale-95">
            <div className="bg-[#0f0f1a] rounded-2xl p-5 flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl flex items-center justify-center shrink-0 border border-blue-500/30">
                <User size={26} className="text-blue-400" />
              </div>
              <div className="text-left flex-1">
                <p className="font-black text-white text-base">User</p>
                <p className="text-xs text-gray-400 mt-0.5">SOS alerts, shelters, incident reports</p>
              </div>
              <ArrowLeft size={16} className="text-gray-500 rotate-180 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button onClick={() => reset('admin')}
            className="w-full group rounded-2xl p-px bg-gradient-to-r from-red-500/30 to-rose-600/30 hover:from-red-500/60 hover:to-rose-600/60 transition-all duration-200 active:scale-95">
            <div className="bg-[#0f0f1a] rounded-2xl p-5 flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-red-500/20 to-rose-600/20 rounded-2xl flex items-center justify-center shrink-0 border border-red-500/30">
                <Shield size={26} className="text-red-400" />
              </div>
              <div className="text-left flex-1">
                <p className="font-black text-white text-base">Admin</p>
                <p className="text-xs text-gray-400 mt-0.5">Manage alerts, broadcasts, reports</p>
              </div>
              <ArrowLeft size={16} className="text-gray-500 rotate-180 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
        <p className="text-center text-xs text-gray-600 mt-8">Secured · End-to-end encrypted · Always available</p>
      </div>
    </div>
  )

  const isAdmin = screen === 'admin'
  const accentFrom = isAdmin ? 'from-red-500' : 'from-blue-500'
  const accentTo   = isAdmin ? 'to-rose-600'  : 'to-blue-600'
  const accentRing = isAdmin ? 'focus:ring-red-500/50' : 'focus:ring-blue-500/50'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden bg-[#0a0a0f]">
      <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 ${isAdmin ? 'bg-red-600/15' : 'bg-blue-600/15'} rounded-full blur-3xl pointer-events-none`} />

      <div className="relative z-10 w-full max-w-sm animate-fade-up">
        <button onClick={() => reset('pick')} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex flex-col items-center mb-8">
          <div className={`w-16 h-16 bg-gradient-to-br ${accentFrom} ${accentTo} rounded-2xl flex items-center justify-center mb-4 shadow-2xl`}>
            {isAdmin ? <Shield size={30} className="text-white" /> : <User size={30} className="text-white" />}
          </div>
          <h2 className="text-2xl font-black text-white">{isAdmin ? 'Admin Login' : 'Welcome Back'}</h2>
          <p className="text-xs text-gray-500 mt-1">{isAdmin ? 'RESQNET Control Center' : 'Sign in to your account'}</p>
        </div>

        {!isAdmin && (
          <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 mb-5">
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${mode === m ? 'bg-white/10 text-white' : 'text-gray-500'}`}>
                {m}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isAdmin && mode === 'register' && (
            <input className={`w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 ${accentRing} transition-all`}
              placeholder="Full Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          )}
          <input className={`w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 ${accentRing} transition-all`}
            type="email" placeholder="Email address" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          <div className="relative">
            <input className={`w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 pr-12 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 ${accentRing} transition-all`}
              type={showPw ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5">
              <p className="text-xs text-red-400 font-medium">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className={`w-full py-4 rounded-2xl font-bold text-white text-sm transition-all active:scale-95 disabled:opacity-50 bg-gradient-to-r ${accentFrom} ${accentTo} shadow-lg mt-1`}>
            {loading
              ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Please wait…</span>
              : isAdmin ? 'Sign In as Admin' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {!isAdmin && (
          <>
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/8" /><span className="text-xs text-gray-600">or</span><div className="flex-1 h-px bg-white/8" />
            </div>
            <button onClick={() => login({ id: 'guest', name: 'Guest User', email: '', role: 'user' })}
              className="w-full py-3.5 rounded-2xl border border-white/10 text-sm font-semibold text-gray-400 hover:text-white hover:border-white/20 transition-all">
              Continue as Guest
            </button>
          </>
        )}
        {isAdmin && <p className="text-center text-xs text-gray-600 mt-5">admin@resqnet.com · admin123</p>}
      </div>
    </div>
  )
}
