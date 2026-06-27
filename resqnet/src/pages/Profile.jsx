import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/useApp'
import { User, LogOut, Moon, Sun, Shield, ChevronRight, Phone, Radio, FileText, Users, Zap, Globe, Brain } from 'lucide-react'
import { useTranslation, LANGUAGES } from '../services/i18n'
import { LowPowerToggle } from '../components/LowPowerMode'

export default function Profile() {
  const { user, logout, darkMode, setDarkMode, lang, changeLang } = useApp()
  const { t } = useTranslation(lang)
  const navigate = useNavigate()

  const menuItems = [
    { icon: FileText, label: 'My Reports',         sub: 'View submitted incidents',  path: '/reports',   color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { icon: Phone,    label: 'Emergency Helplines', sub: 'Quick-dial numbers',        path: '/helplines', color: 'text-green-500',  bg: 'bg-green-500/10' },
    { icon: Radio,    label: 'Broadcasts',          sub: 'Emergency alerts',          path: '/broadcasts',color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { icon: Brain,    label: 'AI Damage Assessment',sub: 'Analyze damage photos',     path: '/ai-damage', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { icon: Users,    label: 'Rescue Dashboard',    sub: 'Field operations panel',    path: '/rescue',    color: 'text-blue-500',   bg: 'bg-blue-500/10' },
  ]

  return (
    <div className="flex flex-col pb-24 md:pb-8 bg-slate-50 dark:bg-[#0a0a0f]">
      {/* Hero */}
      <div className="relative overflow-hidden px-4 pt-8 pb-6 bg-gradient-to-br from-slate-800 to-slate-900 dark:from-[#141420] dark:to-[#0f0f1a]">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className={`w-[72px] h-[72px] rounded-3xl flex items-center justify-center shadow-xl ${user?.role === 'admin' ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/30' : 'bg-gradient-to-br from-blue-500 to-blue-700 shadow-blue-500/30'}`}>
            {user?.role === 'admin' ? <Shield size={32} className="text-white" /> : <User size={32} className="text-white" />}
          </div>
          <div>
            <p className="text-xl font-black text-white">{user?.name}</p>
            <p className="text-sm text-gray-400">{user?.email || 'Guest account'}</p>
            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold mt-1.5 ${user?.role === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
              {user?.role === 'admin' ? '🛡️ Admin' : '👤 User'}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-3">
        {/* Dark mode */}
        <div className="card-solid p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${darkMode ? 'bg-blue-500/10' : 'bg-yellow-500/10'}`}>
              {darkMode ? <Moon size={17} className="text-blue-400" /> : <Sun size={17} className="text-yellow-500" />}
            </div>
            <div>
              <p className="font-semibold text-sm">Dark Mode</p>
              <p className="text-xs text-gray-400">{darkMode ? 'On' : 'Off'}</p>
            </div>
          </div>
          <button onClick={() => setDarkMode(!darkMode)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${darkMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${darkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Language */}
        <div className="card-solid p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Globe size={17} className="text-indigo-500" />
            </div>
            <p className="font-semibold text-sm">Language</p>
          </div>
          <div className="flex gap-2">
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => changeLang(l.code)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${lang === l.code ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-white/8 text-gray-500'}`}>
                {l.flag} {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Low power mode */}
        <LowPowerToggle />

        {/* Menu */}
        <div className="card-solid overflow-hidden">
          {menuItems.map(({ icon: Icon, label, sub, path, color, bg }, i) => (
            <button key={path} onClick={() => navigate(path)}
              className={`w-full flex items-center gap-3 px-4 py-4 text-left transition-colors active:bg-gray-50 dark:active:bg-white/5 ${i < menuItems.length - 1 ? 'border-b border-gray-100 dark:border-white/5' : ''}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                <Icon size={17} className={color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
              <ChevronRight size={15} className="text-gray-300 dark:text-gray-600" />
            </button>
          ))}
        </div>

        <button onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-red-200 dark:border-red-500/20 text-red-500 font-semibold text-sm">
          <LogOut size={16} /> Sign Out
        </button>
        <p className="text-center text-xs text-gray-400 pb-2">RESQNET v3.0 · Disaster Response Ecosystem</p>
      </div>
    </div>
  )
}
