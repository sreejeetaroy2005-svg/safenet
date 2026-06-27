/**
 * SideNav.jsx
 * Responsive sidebar navigation for the web layout.
 * - Desktop (lg+): permanent sidebar
 * - Tablet (md): collapsible icon-only sidebar
 * - Mobile: hidden (bottom bar used instead)
 */
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/useApp'
import {
  Home, AlertCircle, Map, FileText, User, MessageCircle,
  Radio, Phone, Shield, Moon, Sun, LogOut, Brain, Users,
  ChevronLeft, ChevronRight, RotateCcw, TriangleAlert,
  ClipboardList, Package
} from 'lucide-react'

const NAV_ITEMS = [
  { path: '/',               icon: Home,           label: 'Home',              group: 'main' },
  { path: '/sos',            icon: AlertCircle,    label: 'SOS Emergency',     group: 'main', danger: true },
  { path: '/early-warning',  icon: TriangleAlert,  label: 'Early Warning',     group: 'main', warn: true },
  { path: '/map',            icon: Map,            label: 'Disaster Map',      group: 'main' },
  { path: '/chat',           icon: MessageCircle,  label: 'AI Assistant',      group: 'main' },
  { path: '/emergency-plan', icon: ClipboardList,  label: 'Emergency Plan',    group: 'prep' },
  { path: '/inventory',      icon: Package,        label: 'Supply Inventory',  group: 'prep' },
  { path: '/reports',        icon: FileText,       label: 'Reports',           group: 'tools' },
  { path: '/broadcasts',     icon: Radio,          label: 'Broadcasts',        group: 'tools' },
  { path: '/helplines',      icon: Phone,          label: 'Helplines',         group: 'tools' },
  { path: '/ai-damage',      icon: Brain,          label: 'Damage AI',         group: 'tools' },
  { path: '/rescue',         icon: Users,          label: 'Rescue Teams',      group: 'tools' },
  { path: '/profile',        icon: User,           label: 'Profile',           group: 'bottom' },
]

const GROUP_LABELS = {
  main:   'Core',
  prep:   'Preparedness',
  tools:  'Tools',
  bottom: 'Account',
}

export default function SideNav({ collapsed, setCollapsed }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user, logout, darkMode, setDarkMode, sosStage, pendingSync, setShowTour } = useApp()

  const sosActive = sosStage === 'sent'
  const mainItems   = NAV_ITEMS.filter(i => i.group === 'main')
  const prepItems   = NAV_ITEMS.filter(i => i.group === 'prep')
  const toolItems   = NAV_ITEMS.filter(i => i.group === 'tools')
  const bottomItems = NAV_ITEMS.filter(i => i.group === 'bottom')

  const NavItem = ({ item }) => {
    const active = pathname === item.path
    const Icon = item.icon
    const isSos  = item.danger
    const isWarn = item.warn

    if (collapsed) {
      return (
        <button
          onClick={() => navigate(item.path)}
          title={item.label}
          className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 mx-auto
            ${active
              ? isSos  ? 'bg-red-600 shadow-lg shadow-red-500/40'
              : isWarn ? 'bg-orange-500/20 text-orange-400'
              : 'bg-blue-500/15 text-blue-500'
              : isSos  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
              : isWarn ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
              : 'text-gray-400 hover:bg-white/8 hover:text-gray-200'
            }`}
        >
          <Icon size={18} />
          {isSos && sosActive && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border border-[#0f0f1a]" />
          )}
        </button>
      )
    }

    return (
      <button
        onClick={() => navigate(item.path)}
        className={`sidebar-nav-item
          ${active ? (isSos ? '!bg-red-500/15 !text-red-400' : isWarn ? '!bg-orange-500/15 !text-orange-400' : 'active') : ''}
          ${!active && isSos  ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' : ''}
          ${!active && isWarn ? 'text-orange-400 hover:bg-orange-500/10 hover:text-orange-300' : ''}
        `}
      >
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all
          ${active
            ? isSos  ? 'bg-red-600 shadow-md shadow-red-500/30'
            : isWarn ? 'bg-orange-500/20'
            : 'bg-blue-500/15'
            : isSos  ? 'bg-red-500/10'
            : isWarn ? 'bg-orange-500/10'
            : ''
          }`}
        >
          <Icon size={16} className={
            active && !isSos && !isWarn ? 'text-blue-500'
            : isSos  ? 'text-red-400'
            : isWarn ? 'text-orange-400'
            : ''
          } />
        </div>
        <span className="flex-1 truncate">{item.label}</span>
        {isSos && sosActive && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-full shrink-0">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            LIVE
          </span>
        )}
      </button>
    )
  }

  const GroupSection = ({ items, label }) => (
    <div className="space-y-0.5">
      {!collapsed && (
        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-3 mb-1.5">{label}</p>
      )}
      {items.map(item => <NavItem key={item.path} item={item} />)}
    </div>
  )

  return (
    <aside className={`hidden md:flex flex-col h-full bg-[#0c0c18] border-r border-white/8 transition-all duration-300 shrink-0 ${collapsed ? 'w-16' : 'w-56'}`}>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/8 ${collapsed ? 'justify-center px-2' : ''}`}>
        <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30 shrink-0">
          <Shield size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-black text-white tracking-tight leading-none">RESQNET</p>
            <p className="text-[9px] text-gray-500 font-medium tracking-widest">RESPONSE NETWORK</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto thin-scrollbar px-2 py-4 space-y-5">
        <GroupSection items={mainItems} label={GROUP_LABELS.main} />
        <div className="border-t border-white/5 pt-4">
          <GroupSection items={prepItems} label={GROUP_LABELS.prep} />
        </div>
        <div className="border-t border-white/5 pt-4">
          <GroupSection items={toolItems} label={GROUP_LABELS.tools} />
        </div>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/8 px-2 py-3 space-y-1">
        {!collapsed && pendingSync && (
          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-2 mb-2">
            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
            <p className="text-xs font-semibold text-yellow-400">Syncing…</p>
          </div>
        )}

        {/* User info */}
        {!collapsed && user && (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl mb-1">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${user.role === 'admin' ? 'bg-red-600/20' : 'bg-blue-600/20'}`}>
              {user.role === 'admin' ? <Shield size={14} className="text-red-400" /> : <User size={14} className="text-blue-400" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-gray-500 truncate">{user.role === 'admin' ? 'Administrator' : 'User'}</p>
            </div>
          </div>
        )}

        <GroupSection items={bottomItems} label={GROUP_LABELS.bottom} />

        {/* Dark mode toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`sidebar-nav-item ${collapsed ? 'justify-center w-10 h-10 mx-auto' : ''}`}
          title="Toggle dark mode"
        >
          <div className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center shrink-0">
            {darkMode ? <Sun size={15} className="text-yellow-400" /> : <Moon size={15} className="text-blue-400" />}
          </div>
          {!collapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* Re-open tour */}
        <button
          onClick={() => setShowTour(true)}
          className={`sidebar-nav-item ${collapsed ? 'justify-center w-10 h-10 mx-auto' : ''}`}
          title="Replay feature tour"
        >
          <div className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center shrink-0">
            <RotateCcw size={14} className="text-gray-400" />
          </div>
          {!collapsed && <span>Feature Tour</span>}
        </button>

        {/* Sign out */}
        <button
          onClick={logout}
          className={`sidebar-nav-item text-red-400 hover:bg-red-500/10 hover:text-red-300 ${collapsed ? 'justify-center w-10 h-10 mx-auto' : ''}`}
          title="Sign out"
        >
          <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
            <LogOut size={14} className="text-red-400" />
          </div>
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="border-t border-white/8 py-2.5 flex items-center justify-center text-gray-600 hover:text-gray-400 transition-colors"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  )
}
