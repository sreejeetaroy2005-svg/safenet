/**
 * FeatureTour.jsx
 * Professional onboarding feature introduction — shown for guest logins
 * and new user registrations. Pure presentational component; visibility
 * is controlled by AppContext.showTour.
 */
import { useState } from 'react'
import {
  AlertCircle, Map, Bot, Shield,
  ChevronRight, ChevronLeft, X, Brain,
  Users, CheckCircle, TriangleAlert, Home, Package
} from 'lucide-react'

const TOUR_STEPS = [
  {
    id: 'welcome',
    icon: Shield,
    iconBg: 'from-red-500 to-rose-600',
    iconGlow: 'shadow-red-500/40',
    tag: 'Welcome',
    title: 'Disaster response,\nreimagined.',
    description:
      'RESQNET is your all-in-one emergency management platform — connecting citizens, rescue teams, and command centers in real time.',
    visual: 'grid',
    visualItems: [
      { icon: '🆘', label: 'SOS Alerts', color: 'bg-red-500/10 text-red-500' },
      { icon: '🗺️', label: 'Live Map',   color: 'bg-blue-500/10 text-blue-500' },
      { icon: '🤖', label: 'AI Chat',    color: 'bg-purple-500/10 text-purple-500' },
      { icon: '📡', label: 'Broadcasts', color: 'bg-amber-500/10 text-amber-600' },
    ],
  },
  {
    id: 'sos',
    icon: AlertCircle,
    iconBg: 'from-red-600 to-red-500',
    iconGlow: 'shadow-red-500/40',
    tag: 'Emergency SOS',
    title: 'One tap.\nHelp is on the way.',
    description:
      'Send an SOS with your precise GPS location in under 3 seconds. Choose from 8 emergency categories, record a voice message, and get live location tracking until help arrives.',
    visual: 'sos',
    highlight: ['Medical', 'Flood', 'Fire', 'Trapped'],
  },
  {
    id: 'map',
    icon: Map,
    iconBg: 'from-blue-600 to-cyan-500',
    iconGlow: 'shadow-blue-500/40',
    tag: 'Disaster Map',
    title: 'See everything,\nstay safe.',
    description:
      'Real-time map with SOS alerts, nearby shelters, hazard reports, and risk zones. Report new hazards yourself and navigate to safe locations in one tap.',
    visual: 'map',
    visualItems: [
      { icon: '🏠', label: 'Shelters' },
      { icon: '🆘', label: 'SOS Alerts' },
      { icon: '⚠️', label: 'Hazards' },
      { icon: '🗺️', label: 'Risk Zones' },
    ],
  },
  {
    id: 'plan',
    icon: Shield,
    iconBg: 'from-blue-600 to-indigo-500',
    iconGlow: 'shadow-blue-500/40',
    tag: 'Emergency Plan',
    title: 'Prepare your household,\nspecifically for your area.',
    description:
      'Build a custom emergency plan. Autofills your GPS coordinates and recommends the nearest shelter based on your location. Tracks meeting points, emergency contacts, medical profiles, and utility shutoffs.',
    visual: 'plan',
  },
  {
    id: 'inventory',
    icon: Package,
    iconBg: 'from-amber-600 to-yellow-500',
    iconGlow: 'shadow-amber-500/40',
    tag: 'Resource Inventory',
    title: 'Smart supply recommendations,\ntuned to local hazards.',
    description:
      'Track your emergency supplies and expiry dates. Automatically detects local risk zones (like floods, cyclones, or high AQI) and adjusts target stock values. Highlights critical gear and appends location-specific necessities like N95 masks.',
    visual: 'inventory',
  },
  {
    id: 'earlywarning',
    icon: TriangleAlert,
    iconBg: 'from-orange-500 to-red-500',
    iconGlow: 'shadow-orange-500/40',
    tag: 'Early Warning',
    title: 'Know before\ndisaster strikes.',
    description:
      'Live earthquake, cyclone, flood, and AQI alerts dynamically filtered to your location radius. Geofence caution zones intelligently adjust to match your regional geography (like cyclone zones only near the coast).',
    visual: 'earlywarning',
    zones: [
      { emoji: '🌊', label: 'Flood Zone',      severity: 'HIGH',     color: 'border-orange-500/30 bg-orange-500/8 text-orange-400' },
      { emoji: '🌀', label: 'Cyclone Caution', severity: 'MEDIUM',   color: 'border-yellow-500/30 bg-yellow-500/8 text-yellow-400' },
      { emoji: '🚨', label: 'Critical Flood',  severity: 'CRITICAL', color: 'border-red-500/30 bg-red-500/8 text-red-400' },
    ],
  },
  {
    id: 'ai',
    icon: Bot,
    iconGlow: 'shadow-purple-500/40',
    tag: 'AI Assistant',
    title: 'Emergency guidance,\npowered by Gemini.',
    description:
      'Ask our Gemini-powered AI assistant anything — first aid, evacuation routes, flood safety, or what to pack. Works offline too, with a built-in emergency knowledge base.',
    visual: 'chat',
    messages: [
      { role: 'user', text: 'What do I do during a flood?' },
      { role: 'bot',  text: 'Move to higher ground immediately. Never walk through moving water. Call 1070 (Flood Control)…' },
    ],
  },
  {
    id: 'damage',
    icon: Brain,
    iconBg: 'from-violet-600 to-fuchsia-500',
    iconGlow: 'shadow-violet-500/40',
    tag: 'AI Damage Assessment',
    title: 'Photo in.\nReport out.',
    description:
      'Upload a photo of any damaged structure and our AI instantly assesses severity, calculates rescue priority, and generates a detailed risk report — ready to submit.',
    visual: 'damage',
  },
  {
    id: 'team',
    icon: Users,
    iconBg: 'from-blue-700 to-blue-500',
    iconGlow: 'shadow-blue-500/40',
    tag: 'Rescue Teams',
    title: 'Coordinated rescue,\nin the field.',
    description:
      'Rescue dispatch dashboard for field volunteers. Filters active SOS emergencies specifically within your customizable response radius (5km to 200km) and sorts them by proximity so you target the closest victims first.',
    visual: 'rescue',
    stats: [
      { val: '< 3s', label: 'SOS sent' },
      { val: '8',    label: 'Alert types' },
      { val: '3',    label: 'Languages' },
    ],
  },
  {
    id: 'ready',
    icon: CheckCircle,
    iconBg: 'from-green-500 to-emerald-600',
    iconGlow: 'shadow-green-500/40',
    tag: "You're all set",
    title: "Ready when\nyou need it.",
    description:
      "RESQNET works offline, syncs when reconnected, and runs on any device. Your data stays local unless Firebase is enabled. Stay safe.",
    visual: 'ready',
    features: [
      { icon: '🔒', text: 'Privacy-first — data stays on your device' },
      { icon: '📡', text: 'Offline mode with automatic sync' },
      { icon: '🌐', text: 'English, Hindi, Tamil supported' },
      { icon: '⚡', text: 'Low power mode for emergencies' },
    ],
  },
]

/* ── Visual sub-components ─────────────────────────────────── */

function GridVisual({ items }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 w-full">
      {items.map(({ icon, label, color }) => (
        <div key={label} className={`flex items-center gap-2.5 ${color} rounded-xl px-3 py-3 font-semibold text-sm`}>
          <span className="text-xl">{icon}</span> {label}
        </div>
      ))}
    </div>
  )
}

function SosVisual({ highlight }) {
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="relative flex items-center justify-center">
        <span className="absolute w-28 h-28 rounded-full border border-red-500/20 animate-ping" style={{ animationDuration: '2s' }} />
        <span className="absolute w-20 h-20 rounded-full border border-red-500/30 animate-ping" style={{ animationDuration: '1.5s' }} />
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-rose-500 flex items-center justify-center shadow-xl shadow-red-500/40 relative z-10">
          <AlertCircle size={30} className="text-white" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-center mt-2">
        {highlight.map(h => (
          <span key={h} className="text-xs bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-1 rounded-full font-semibold">{h}</span>
        ))}
      </div>
    </div>
  )
}

function MapVisual({ items }) {
  return (
    <div className="w-full rounded-xl overflow-hidden bg-slate-800/50 border border-white/10 p-3">
      <div className="grid grid-cols-2 gap-2">
        {items.map(({ icon, label }) => (
          <div key={label} className="flex items-center gap-2 bg-white/8 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-300">
            <span>{icon}</span> {label}
          </div>
        ))}
      </div>
      <div className="mt-3 h-24 rounded-lg bg-slate-700/60 flex items-center justify-center relative overflow-hidden">
        {/* Fake map grid */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />
        <div className="relative flex gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center text-xs">📍</div>
          <div className="w-5 h-5 rounded-full bg-green-500 border-2 border-white shadow flex items-center justify-center text-[10px]">🏠</div>
          <div className="w-5 h-5 rounded-full bg-red-500 border-2 border-white shadow flex items-center justify-center text-[10px]">🆘</div>
        </div>
      </div>
    </div>
  )
}

function ChatVisual({ messages }) {
  return (
    <div className="w-full space-y-2">
      {messages.map((m, i) => (
        <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${m.role === 'bot' ? 'bg-gradient-to-br from-purple-500 to-violet-600' : 'bg-gray-600'}`}>
            {m.role === 'bot' ? '🤖' : '👤'}
          </div>
          <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${m.role === 'bot' ? 'bg-white/10 text-gray-200 rounded-tl-sm' : 'bg-blue-600 text-white rounded-tr-sm'}`}>
            {m.text}
          </div>
        </div>
      ))}
    </div>
  )
}

function DamageVisual() {
  return (
    <div className="w-full">
      <div className="rounded-xl bg-white/8 border border-white/10 p-3 flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-lg bg-violet-500/20 flex items-center justify-center text-2xl">📸</div>
        <div className="flex-1">
          <div className="h-2 bg-violet-500 rounded-full mb-1.5" style={{ width: '72%' }} />
          <p className="text-xs text-gray-400">Analyzing structural damage…</p>
        </div>
        <span className="text-sm font-black text-violet-400">72%</span>
      </div>
      <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🚨</span>
          <div>
            <p className="text-sm font-black text-red-400">Severe Damage</p>
            <p className="text-xs text-gray-500">HIGH rescue priority</p>
          </div>
          <span className="ml-auto text-xl font-black text-red-400">91%</span>
        </div>
        <div className="flex gap-1">
          {[1,2,3,4].map(i => (
            <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= 3 ? 'bg-red-500' : 'bg-white/10'}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

function RescueVisual({ stats }) {
  return (
    <div className="w-full space-y-2">
      <div className="grid grid-cols-3 gap-2 mb-3">
        {stats.map(({ val, label }) => (
          <div key={label} className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-2.5 text-center">
            <p className="text-lg font-black text-blue-400">{val}</p>
            <p className="text-[10px] text-gray-400">{label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 flex items-center gap-3">
        <span className="text-2xl">🆘</span>
        <div className="flex-1">
          <p className="text-xs font-bold text-white">Raj Kumar</p>
          <p className="text-xs text-gray-500">Medical · 1.2 km away</p>
        </div>
        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-lg font-bold">Accept</span>
      </div>
    </div>
  )
}

function ReadyVisual({ features }) {
  return (
    <div className="w-full space-y-2">
      {features.map(({ icon, text }) => (
        <div key={text} className="flex items-center gap-3 bg-green-500/8 border border-green-500/15 rounded-xl px-3 py-2.5">
          <span className="text-base">{icon}</span>
          <p className="text-xs text-gray-300 font-medium">{text}</p>
        </div>
      ))}
    </div>
  )
}

function PlanVisual() {
  return (
    <div className="w-full space-y-2">
      <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 flex items-center gap-3">
        <span className="text-xl">📍</span>
        <div className="flex-1">
          <p className="text-xs font-bold text-white">Family Meeting Point</p>
          <p className="text-[10px] text-blue-400">Coordinates Auto-filled ✓</p>
        </div>
      </div>
      <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 flex items-center gap-3">
        <span className="text-xl">🏠</span>
        <div className="flex-1">
          <p className="text-xs font-bold text-white">Evacuation Destination</p>
          <p className="text-[10px] text-green-400">Nearest Shelter Suggested ✓</p>
        </div>
      </div>
    </div>
  )
}

function InventoryVisual() {
  return (
    <div className="w-full space-y-2">
      <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-3">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-bold text-white">💧 Drinking Water (Adjusted)</p>
          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500 text-slate-900 uppercase">Local Flood Alert</span>
        </div>
        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden mb-1">
          <div className="h-full bg-amber-500 w-1/2" />
        </div>
        <p className="text-[10px] text-gray-400">Target stock increased: 20L ➔ 40L</p>
      </div>
      <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 flex items-center justify-between">
        <p className="text-xs font-bold text-white">💊 N95 Face Masks</p>
        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-red-500 text-white uppercase">AQI Recommended</span>
      </div>
    </div>
  )
}

/* ── Main Component ─────────────────────────────────────────── */

export default function FeatureTour({ onDismiss }) {
  const [step, setStep] = useState(0)
  const [exiting, setExiting] = useState(false)
  const current = TOUR_STEPS[step]
  const isLast = step === TOUR_STEPS.length - 1
  const Icon = current.icon

  const advance = () => {
    if (isLast) { handleDismiss(); return }
    setStep(s => s + 1)
  }

  const back = () => {
    if (step > 0) setStep(s => s - 1)
  }

  const handleDismiss = () => {
    setExiting(true)
    setTimeout(onDismiss, 300)
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-300 ${exiting ? 'opacity-0' : 'opacity-100'}`}
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className={`relative w-full max-w-md bg-[#0f0f1a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${exiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="h-0.5 w-full bg-white/8">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex gap-1">
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-blue-400' : i < step ? 'w-1.5 bg-blue-600/50' : 'w-1.5 bg-white/15'}`}
              />
            ))}
          </div>
          <button
            onClick={handleDismiss}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center transition-colors"
            aria-label="Close tour"
          >
            <X size={13} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Icon */}
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${current.iconBg} flex items-center justify-center shadow-xl ${current.iconGlow} mb-4 animate-tour-float`}>
            <Icon size={26} className="text-white" />
          </div>

          {/* Tag */}
          <span className="inline-block text-[10px] font-black uppercase tracking-[0.12em] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full mb-2">
            {current.tag}
          </span>

          {/* Title */}
          <h2 className="text-2xl font-black text-white leading-tight mb-3 whitespace-pre-line">
            {current.title}
          </h2>

          {/* Description */}
          <p className="text-sm text-gray-400 leading-relaxed mb-5">
            {current.description}
          </p>

          {/* Visual */}
          <div className="mb-6">
            {current.visual === 'grid'   && <GridVisual items={current.visualItems} />}
            {current.visual === 'sos'    && <SosVisual highlight={current.highlight} />}
            {current.visual === 'map'    && <MapVisual items={current.visualItems} />}
            {current.visual === 'chat'   && <ChatVisual messages={current.messages} />}
            {current.visual === 'damage' && <DamageVisual />}
            {current.visual === 'rescue' && <RescueVisual stats={current.stats} />}
            {current.visual === 'ready'  && <ReadyVisual features={current.features} />}
            {current.visual === 'plan'   && <PlanVisual />}
            {current.visual === 'inventory' && <InventoryVisual />}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button
                onClick={back}
                className="w-10 h-10 rounded-xl bg-white/8 hover:bg-white/12 flex items-center justify-center transition-colors"
              >
                <ChevronLeft size={18} className="text-gray-400" />
              </button>
            )}
            <button
              onClick={advance}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold text-sm transition-all active:scale-95 shadow-lg shadow-blue-500/25"
            >
              {isLast ? (
                <><CheckCircle size={16} /> Get started</>
              ) : (
                <>Next <ChevronRight size={16} /></>
              )}
            </button>
          </div>

          {!isLast && (
            <button onClick={handleDismiss} className="w-full mt-3 text-center text-xs text-gray-600 hover:text-gray-400 transition-colors py-1">
              Skip tour
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
