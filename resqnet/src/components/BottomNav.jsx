import { useNavigate, useLocation } from 'react-router-dom'
import { Home, AlertCircle, Map, TriangleAlert, User } from 'lucide-react'

const tabs = [
  { path: '/',              icon: Home,          label: 'Home' },
  { path: '/sos',           icon: AlertCircle,   label: 'SOS' },
  { path: '/map',           icon: Map,           label: 'Map' },
  { path: '/early-warning', icon: TriangleAlert, label: 'Warnings', warn: true },
  { path: '/profile',       icon: User,          label: 'Profile' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-3 mb-3 bg-white/85 dark:bg-[#141420]/90 backdrop-blur-xl border border-gray-200/60 dark:border-white/10 rounded-3xl shadow-xl shadow-black/10 dark:shadow-black/40">
        <div className="flex items-center justify-around px-2 py-2">
          {tabs.map(({ path, icon: Icon, label, warn }) => {
            const active = pathname === path
            const isSOS = path === '/sos'

            if (isSOS) return (
              <button key={path} onClick={() => navigate(path)}
                className="flex flex-col items-center justify-center -mt-6 relative">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-200 active:scale-90 relative
                  ${active ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/50' : 'bg-gradient-to-br from-red-600 to-rose-500 shadow-red-500/40'}`}>
                  <AlertCircle size={26} className="text-white" />
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-400 rounded-full border-2 border-white dark:border-[#141420] animate-ping" />
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-[#141420]" />
                </div>
                <span className="text-[10px] font-bold text-red-500 mt-1">SOS</span>
              </button>
            )

            return (
              <button key={path} onClick={() => navigate(path)}
                className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all duration-200 active:scale-90 ${active ? (warn ? 'text-orange-500' : 'text-blue-600 dark:text-blue-400') : 'text-gray-400 dark:text-gray-500'}`}>
                <div className={`p-1.5 rounded-xl transition-all ${active ? (warn ? 'bg-orange-50 dark:bg-orange-500/15' : 'bg-blue-50 dark:bg-blue-500/15') : ''}`}>
                  <Icon size={19} strokeWidth={active ? 2.5 : 1.8} className={active && warn ? 'text-orange-500' : ''} />
                </div>
                <span className={`text-[10px] font-semibold ${active ? (warn ? 'text-orange-500' : 'text-blue-600 dark:text-blue-400') : 'text-gray-400'}`}>{label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
