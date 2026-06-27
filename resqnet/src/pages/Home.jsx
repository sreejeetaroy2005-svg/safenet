import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/useApp'
import {
  AlertCircle, Map, FileText, Phone, MessageCircle, Radio,
  Moon, Sun, Shield, Bell, ChevronRight, Check, Brain, Users,
  TriangleAlert, ClipboardList, Package
} from 'lucide-react'
import { useTranslation } from '../services/i18n'
import WeatherBanner from '../components/WeatherBanner'

const CHECKLIST_ITEMS = [
  'Store 3-day water supply',
  'Stock non-perishable food',
  'Keep ID documents safe',
  'Keep torch & batteries ready',
  'Prepare first aid kit',
  'Set family meeting point',
  'Save emergency numbers',
]

const quickActions = [
  { label: 'Early Warning',    icon: TriangleAlert,  path: '/early-warning',  from: 'from-orange-500', to: 'to-red-500',     glow: 'shadow-orange-500/25', desc: 'Earthquake · Cyclone · Flood', hot: true },
  { label: 'Disaster Map',     icon: Map,            path: '/map',            from: 'from-blue-500',   to: 'to-cyan-500',    glow: 'shadow-blue-500/25',   desc: 'Live hazards & shelters' },
  { label: 'Emergency Plan',   icon: ClipboardList,  path: '/emergency-plan', from: 'from-green-500',  to: 'to-emerald-500', glow: 'shadow-green-500/25',  desc: 'Build household plan' },
  { label: 'Supply Inventory', icon: Package,        path: '/inventory',      from: 'from-violet-500', to: 'to-purple-500',  glow: 'shadow-violet-500/25', desc: 'Track emergency supplies' },
  { label: 'File Report',      icon: FileText,       path: '/reports/new',    from: 'from-orange-500', to: 'to-amber-500',   glow: 'shadow-orange-500/25', desc: 'Submit incident' },
  { label: 'Helplines',        icon: Phone,          path: '/helplines',      from: 'from-green-500',  to: 'to-emerald-500', glow: 'shadow-green-500/25',  desc: 'Quick-dial numbers' },
  { label: 'AI Assistant',     icon: MessageCircle,  path: '/chat',           from: 'from-purple-500', to: 'to-violet-500',  glow: 'shadow-purple-500/25', desc: 'Gemini-powered chat' },
  { label: 'Damage AI',        icon: Brain,          path: '/ai-damage',      from: 'from-pink-500',   to: 'to-rose-500',    glow: 'shadow-pink-500/25',   desc: 'Analyze damage photo' },
]

export default function Home() {
  const navigate = useNavigate()
  const { user, darkMode, setDarkMode, broadcasts, sosStage, pendingSync, lang } = useApp()
  const [checklist, setChecklist] = useState(() => {
    const saved = localStorage.getItem('preparedness_checklist')
    return saved ? JSON.parse(saved) : Array(7).fill(false)
  })

  const toggleChecklist = (index) => {
    const updated = [...checklist]
    updated[index] = !updated[index]
    setChecklist(updated)
    localStorage.setItem('preparedness_checklist', JSON.stringify(updated))
  }

  const completedCount = checklist.filter(Boolean).length
  const progressPercent = Math.round((completedCount / checklist.length) * 100)
  const allCompleted = completedCount === checklist.length
  const { t } = useTranslation(lang)
  const latestBroadcast = broadcasts[0]
  const sosActive = sosStage === 'sent'

  return (
    <div className="pb-24 md:pb-8 pt-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Welcome back, <span className="font-semibold text-gray-700 dark:text-gray-300">{user?.name || 'Guest'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {sosActive && (
            <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-red-500">SOS ACTIVE</span>
            </div>
          )}
          {pendingSync && (
            <div className="hidden md:flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-2.5 py-1.5">
              <span className="text-xs font-bold text-yellow-500">⏳ Syncing</span>
            </div>
          )}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/8 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:scale-105 transition-transform"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      <WeatherBanner />

      {/* Top grid: SOS + status card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* SOS button — spans 2 cols on md+ */}
        <div className="md:col-span-2">
          <button
            onClick={() => navigate('/sos')}
            className="relative w-full overflow-hidden rounded-2xl active:scale-[0.98] hover:scale-[1.01] transition-transform duration-150 shadow-xl shadow-red-500/20"
          >
            <div className={`relative p-6 flex items-center gap-5 ${sosActive ? 'bg-gradient-to-r from-red-700 to-red-600' : 'bg-gradient-to-r from-red-600 to-rose-500'}`}>
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/2 left-20 -translate-y-1/2 w-40 h-40 bg-white/5 rounded-full" />
                <div className="absolute top-1/2 left-12 -translate-y-1/2 w-64 h-64 bg-white/3 rounded-full" />
              </div>
              <div className="relative w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                <AlertCircle size={32} className="text-white" />
                {sosActive && <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-red-600 animate-pulse" />}
              </div>
              <div className="relative flex-1">
                <p className="text-3xl font-black text-white tracking-widest">SOS</p>
                <p className="text-sm text-red-100 font-medium mt-0.5">
                  {sosActive ? '🟢 Alert Active — Help Notified' : 'Tap to send emergency alert'}
                </p>
              </div>
              <ChevronRight size={22} className="text-white/60 relative shrink-0" />
            </div>
          </button>
        </div>

        {/* Status / readiness card */}
        <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-slate-800 to-slate-900 dark:from-[#141420] dark:to-[#0f0f1a] border border-white/10">
          <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">System Status</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-green-400 font-semibold">All systems online</span>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Readiness</span>
              <span className="font-bold text-white">{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-700 rounded-full" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
          {latestBroadcast && (
            <div className="mt-4 pt-3 border-t border-white/8">
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Latest Alert</p>
              <p className="text-xs text-gray-300 font-medium mt-1 line-clamp-2">{latestBroadcast.title}</p>
            </div>
          )}
        </div>
      </div>

      {/* Early Warning highlight banner */}
      <button
        onClick={() => navigate('/early-warning')}
        className="w-full text-left mb-6 relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/25 hover:border-orange-500/50 hover:scale-[1.01] transition-all duration-150 shadow-sm"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0">
            <TriangleAlert size={22} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-black text-gray-900 dark:text-white">Early Warning Dashboard</p>
              <span className="text-[10px] font-black bg-orange-500 text-white px-2 py-0.5 rounded-full">NEW</span>
            </div>
            <p className="text-xs text-gray-500">Live earthquake · cyclone · flood · AQI alerts with geofence zone detection</p>
          </div>
          <ChevronRight size={18} className="text-orange-400 shrink-0" />
        </div>
      </button>

      {/* Quick Actions */}
      <div className="mb-6">
        <p className="section-label">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {quickActions.map(({ label, icon: Icon, path, from, to, glow, desc, hot }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="group card-solid p-4 flex flex-col items-start gap-3 active:scale-95 hover:scale-[1.02] transition-all duration-150 hover:shadow-md text-left relative"
            >
              {hot && (
                <span className="absolute top-2 right-2 text-[9px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded-full">HOT</span>
              )}
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${from} ${to} flex items-center justify-center shadow-lg ${glow} group-hover:scale-110 transition-transform`}>
                <Icon size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom grid: Preparedness tools + Broadcasts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Preparedness tools */}
        <div>
          <p className="section-label">Preparedness</p>

          {/* Plan builder shortcut */}
          <button onClick={() => navigate('/emergency-plan')}
            className="w-full text-left card-solid p-4 flex items-center gap-3 hover:scale-[1.01] transition-transform mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center shrink-0">
              <ClipboardList size={18} className="text-green-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Emergency Plan Builder</p>
              <p className="text-xs text-gray-400">Family contacts · Meeting point · Evacuation routes</p>
            </div>
            <ChevronRight size={15} className="text-gray-400" />
          </button>

          {/* Inventory shortcut */}
          <button onClick={() => navigate('/inventory')}
            className="w-full text-left card-solid p-4 flex items-center gap-3 hover:scale-[1.01] transition-transform mb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
              <Package size={18} className="text-violet-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Supply Inventory</p>
              <p className="text-xs text-gray-400">Track water, food, medical kits &amp; expiry dates</p>
            </div>
            <ChevronRight size={15} className="text-gray-400" />
          </button>

          {/* Compact checklist */}
          <div className="card-solid p-4">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-bold">Quick Checklist</p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${progressPercent === 100 ? 'bg-green-500/15 text-green-500' : 'bg-blue-500/15 text-blue-500'}`}>{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500 rounded-full" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="space-y-2">
              {CHECKLIST_ITEMS.map((item, i) => (
                <div key={i} onClick={() => toggleChecklist(i)} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all shrink-0 ${checklist[i] ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600 group-hover:border-blue-400'}`}>
                    {checklist[i] && <Check size={11} className="text-white" />}
                  </div>
                  <p className={`text-xs flex-1 ${checklist[i] ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>{item}</p>
                </div>
              ))}
            </div>
            {allCompleted && (
              <div className="mt-3 p-2 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
                <p className="text-xs font-bold text-green-600 dark:text-green-400">✓ Fully prepared!</p>
              </div>
            )}
          </div>
        </div>

        {/* Latest Broadcast */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="section-label mb-0">Emergency Broadcasts</p>
            <button onClick={() => navigate('/broadcasts')} className="text-xs text-blue-500 font-semibold hover:text-blue-400 transition-colors">View all →</button>
          </div>
          {latestBroadcast ? (
            <button onClick={() => navigate('/broadcasts')} className="w-full text-left card-solid p-5 hover:scale-[1.01] transition-transform">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                  <Bell size={16} className="text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-0.5">Latest Alert</p>
                  <p className="font-bold text-sm text-gray-900 dark:text-white">{latestBroadcast.title}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{latestBroadcast.message}</p>
                </div>
                <ChevronRight size={15} className="text-gray-400 shrink-0 mt-1" />
              </div>
            </button>
          ) : (
            <div className="card-solid p-5 text-center text-gray-400">
              <Radio size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No broadcasts yet</p>
              <p className="text-xs text-gray-500 mt-1">Emergency alerts will appear here</p>
            </div>
          )}

          {/* Helpline shortcut */}
          <button onClick={() => navigate('/helplines')} className="w-full mt-3 card-solid p-4 flex items-center gap-3 hover:scale-[1.01] transition-transform text-left">
            <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center shrink-0">
              <Phone size={16} className="text-green-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Emergency Helplines</p>
              <p className="text-xs text-gray-400">Police · Ambulance · Fire · NDMA</p>
            </div>
            <ChevronRight size={15} className="text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  )
}
