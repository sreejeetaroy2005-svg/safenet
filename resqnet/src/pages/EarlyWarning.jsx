/**
 * EarlyWarning.jsx
 * Multi-hazard early warning dashboard.
 *
 * Tabs: All | Earthquake | Cyclone | Flood | Air Quality
 * Data: USGS (real) + OpenWeatherMap (real if key set) + curated mock fallback
 * Refreshes every 5 minutes automatically.
 */
import { useState, useEffect, useCallback } from 'react'
import {
  AlertTriangle, RefreshCw, Wifi, WifiOff,
  ChevronRight, Clock, MapPin, Wind, Droplets,
  Activity, Cloud, Thermometer, ExternalLink, Bell
} from 'lucide-react'
import { useApp } from '../context/useApp'
import { fetchAllWarnings, SEVERITY_CONFIG } from '../services/earlyWarningService'
import { buildRiskZones, getActiveZones } from '../services/geofenceService'
import { pushNotification, PRIORITY } from '../services/notificationService'
import InfoTooltip from '../components/InfoTooltip'

/* ── Tab config ─────────────────────────────────────────────── */
const TABS = [
  { id: 'all',        label: 'All',          emoji: '⚡' },
  { id: 'earthquake', label: 'Earthquake',   emoji: '🌍' },
  { id: 'cyclone',    label: 'Cyclone',      emoji: '🌀' },
  { id: 'flood',      label: 'Flood',        emoji: '🌊' },
  { id: 'heatwave',   label: 'Heat / Cold',  emoji: '🌡️' },
  { id: 'aqi',        label: 'Air Quality',  emoji: '💨' },
]

/* ── Helpers ────────────────────────────────────────────────── */
function timeAgo(ts) {
  const m = Math.floor((Date.now() - ts) / 60000)
  if (m < 1)  return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function timeUntil(ts) {
  const m = Math.floor((ts - Date.now()) / 60000)
  if (m <= 0)  return 'Expired'
  if (m < 60)  return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h`
  return `${Math.floor(h / 24)}d`
}

/* ── Severity badge ─────────────────────────────────────────── */
function SeverityBadge({ severity }) {
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.INFO
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${severity === 'CRITICAL' ? 'animate-pulse' : ''}`} />
      {cfg.label}
    </span>
  )
}

/* ── Earthquake card ────────────────────────────────────────── */
function EarthquakeCard({ item }) {
  const cfg = SEVERITY_CONFIG[item.severity]
  return (
    <div className={`card-solid p-4 border-l-4 ${item.severity === 'CRITICAL' ? 'border-red-500' : item.severity === 'HIGH' ? 'border-orange-500' : item.severity === 'MEDIUM' ? 'border-yellow-500' : 'border-green-500'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl font-black ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
          {item.mag.toFixed(1)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight line-clamp-2">{item.title}</p>
            <SeverityBadge severity={item.severity} />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1.5">
            <span className="flex items-center gap-1"><MapPin size={10} /> {item.place}</span>
            {item.depth != null && <span className="flex items-center gap-1"><Activity size={10} /> Depth {item.depth} km</span>}
            <span className="flex items-center gap-1"><Clock size={10} /> {timeAgo(item.time)}</span>
            <span className="text-gray-400">{item.source}</span>
          </div>
        </div>
      </div>
      {item.url && (
        <a href={item.url} target="_blank" rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-400 font-semibold transition-colors">
          USGS Details <ExternalLink size={11} />
        </a>
      )}
    </div>
  )
}

/* ── Weather / hazard card ──────────────────────────────────── */
const TYPE_ICONS = {
  cyclone:  { Icon: Wind,        emoji: '🌀' },
  flood:    { Icon: Droplets,    emoji: '🌊' },
  heatwave: { Icon: Thermometer, emoji: '🌡️' },
  cold:     { Icon: Thermometer, emoji: '❄️' },
  aqi:      { Icon: Cloud,       emoji: '💨' },
}

function HazardCard({ item }) {
  const cfg  = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.INFO
  const meta = TYPE_ICONS[item.type] || { Icon: AlertTriangle, emoji: '⚠️' }

  return (
    <div className={`card-solid p-4 border-l-4 ${item.severity === 'CRITICAL' ? 'border-red-500' : item.severity === 'HIGH' ? 'border-orange-500' : item.severity === 'MEDIUM' ? 'border-yellow-500' : 'border-blue-500'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl ${cfg.bg} border ${cfg.border}`}>
          {meta.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{item.title}</p>
            <SeverityBadge severity={item.severity} />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-1">{item.desc}</p>

          <div className="flex flex-wrap gap-3 mt-2.5 text-xs text-gray-500">
            {item.affected && (
              <span className="flex items-center gap-1"><MapPin size={10} /> {item.affected}</span>
            )}
            {item.validUntil && (
              <span className="flex items-center gap-1"><Clock size={10} /> Valid for {timeUntil(item.validUntil)}</span>
            )}
            {item.windSpeed && (
              <span className="flex items-center gap-1"><Wind size={10} /> {item.windSpeed}</span>
            )}
            {item.waterLevel && (
              <span className="flex items-center gap-1"><Droplets size={10} /> {item.waterLevel} · {item.trend}</span>
            )}
            {item.aqi != null && (
              <span className={`font-bold ${cfg.color}`}>AQI {item.aqi} · {item.category}</span>
            )}
            {item.category && !item.aqi && (
              <span className="text-gray-400">{item.category}</span>
            )}
            <span className="text-gray-400">{item.source}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Active risk zone banner ────────────────────────────────── */
function ActiveZoneBanner({ zones }) {
  if (!zones.length) return null
  const top = zones[0]
  const cfg = SEVERITY_CONFIG[top.severity]
  return (
    <div className={`rounded-xl p-4 mb-5 flex items-start gap-3 border ${cfg.bg} ${cfg.border}`}>
      <span className="text-2xl shrink-0">{top.emoji}</span>
      <div className="flex-1">
        <p className={`text-sm font-black ${cfg.color}`}>⚠ You are currently in a risk zone</p>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{top.message}</p>
        {zones.length > 1 && (
          <p className="text-xs text-gray-500 mt-1">+{zones.length - 1} more zone{zones.length > 2 ? 's' : ''} active</p>
        )}
      </div>
      <SeverityBadge severity={top.severity} />
    </div>
  )
}

/* ── Summary stat cards ─────────────────────────────────────── */
function StatCard({ emoji, label, count, severity }) {
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.INFO
  return (
    <div className={`card-solid p-4 flex flex-col gap-2 border ${count > 0 && severity !== 'LOW' ? cfg.border : 'border-transparent'}`}>
      <div className="flex items-center justify-between">
        <span className="text-2xl">{emoji}</span>
        {count > 0 && severity !== 'LOW' && <SeverityBadge severity={severity} />}
      </div>
      <p className={`text-2xl font-black ${count > 0 ? cfg.color : 'text-gray-400'}`}>{count}</p>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
    </div>
  )
}

/* ── Main page ──────────────────────────────────────────────── */
export default function EarlyWarning() {
  const { location } = useApp()
  const [tab,          setTab]          = useState('all')
  const [data,         setData]         = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [lastUpdated,  setLastUpdated]  = useState(null)
  const [activeZones,  setActiveZones]  = useState([])
  const [alertsOn,     setAlertsOn]     = useState(() => {
    return localStorage.getItem('ew_alerts') !== 'false'
  })

  const load = useCallback(async () => {
    setLoading(true)
    // Use real GPS location if available, otherwise use a sensible India-centre fallback
    const lat = location?.lat ?? 20.5937
    const lng = location?.lng ?? 78.9629
    const result = await fetchAllWarnings(lat, lng)
    setData(result)
    setLastUpdated(result.lastUpdated)

    // Build zones from REAL location and check if user is inside any
    const zones = buildRiskZones(lat, lng)
    const active = getActiveZones(lat, lng, zones)
    setActiveZones(active)

    // Push notification if in a zone and alerts are on
    if (active.length > 0 && alertsOn) {
      const top = active[0]
      pushNotification({
        title:    `${top.emoji} Risk Zone Detected`,
        message:  top.message,
        priority: top.severity === 'CRITICAL' ? PRIORITY.CRITICAL : PRIORITY.WARNING,
        duration: 8000,
      })
    }

    setLoading(false)
  }, [location?.lat, location?.lng, alertsOn])

  // Load on mount + every 5 minutes
  useEffect(() => {
    load()
    const interval = setInterval(load, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [load])

  const toggleAlerts = () => {
    const next = !alertsOn
    setAlertsOn(next)
    localStorage.setItem('ew_alerts', String(next))
  }

  /* ── Build flat list for display ── */
  const allItems = data ? [
    ...(data.earthquakes || []),
    ...(data.weather     || []),
    ...(data.cyclone     || []),
    ...(data.flood       || []),
    ...(data.aqi         || []),
  ] : []

  const criticalCount = allItems.filter(i => i.severity === 'CRITICAL').length
  const highCount     = allItems.filter(i => i.severity === 'HIGH').length

  const filtered = tab === 'all' ? allItems : allItems.filter(i => {
    if (tab === 'earthquake') return i.type === 'earthquake'
    if (tab === 'cyclone')    return i.type === 'cyclone'
    if (tab === 'flood')      return i.type === 'flood'
    if (tab === 'heatwave')   return i.type === 'heatwave' || i.type === 'cold'
    if (tab === 'aqi')        return i.type === 'aqi'
    return true
  })

  // Sort: CRITICAL → HIGH → MEDIUM → LOW, then newest
  const SORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 }
  const sorted = [...filtered].sort((a, b) => {
    const sd = (SORDER[a.severity] ?? 5) - (SORDER[b.severity] ?? 5)
    if (sd !== 0) return sd
    return (b.time || 0) - (a.time || 0)
  })

  return (
    <div className="pb-24 md:pb-8 pt-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            Early Warning
            {criticalCount > 0 && (
              <span className="text-sm bg-red-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                {criticalCount} CRITICAL
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
            <MapPin size={12} />
            <span>
              {location ? `Filtered near your location (${location.lat.toFixed(2)}, ${location.lng.toFixed(2)})` : 'Filtered near Default (Central India)'}
            </span>
            <InfoTooltip text="Calculates spherical distance to USGS and weather feeds using the Haversine formula, filtering out alerts beyond threat-specific ranges (e.g., 300km for cyclones)." />
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Alerts toggle */}
          <button
            onClick={toggleAlerts}
            title={alertsOn ? 'Disable zone alerts' : 'Enable zone alerts'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${alertsOn ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' : 'bg-gray-100 dark:bg-white/8 border-gray-200 dark:border-white/10 text-gray-400'}`}
          >
            <Bell size={13} /> {alertsOn ? 'Alerts On' : 'Alerts Off'}
          </button>
          {/* Refresh */}
          <button
            onClick={load}
            className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/8 border border-gray-200 dark:border-white/10 flex items-center justify-center"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-500' : 'text-gray-500'} />
          </button>
        </div>
      </div>

      {lastUpdated && (
        <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
          <Clock size={10} /> Updated {timeAgo(lastUpdated)}
          {!navigator.onLine && <span className="ml-2 flex items-center gap-1 text-yellow-500"><WifiOff size={10} /> Offline — showing cached data</span>}
        </p>
      )}

      {/* Active zone banner */}
      <ActiveZoneBanner zones={activeZones} />

      {/* Summary stat row */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard emoji="🌍" label="Earthquakes"  count={data.earthquakes?.length || 0} severity={data.earthquakes?.find(e => e.severity === 'CRITICAL') ? 'CRITICAL' : data.earthquakes?.find(e => e.severity === 'HIGH') ? 'HIGH' : 'LOW'} />
          <StatCard emoji="🌀" label="Cyclone Alerts" count={(data.cyclone?.length || 0) + (data.weather?.filter(w => w.type === 'cyclone').length || 0)} severity={(data.cyclone || []).find(c => c.severity === 'CRITICAL') ? 'CRITICAL' : 'HIGH'} />
          <StatCard emoji="🌊" label="Flood Alerts" count={data.flood?.length || 0} severity={data.flood?.find(f => f.severity === 'CRITICAL') ? 'CRITICAL' : data.flood?.find(f => f.severity === 'HIGH') ? 'HIGH' : 'MEDIUM'} />
          <StatCard emoji="💨" label="AQI Alerts"   count={data.aqi?.length || 0}  severity={data.aqi?.find(a => a.severity === 'CRITICAL') ? 'CRITICAL' : 'HIGH'} />
        </div>
      )}

      {/* Critical banner if any */}
      {criticalCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-500 shrink-0 animate-pulse" />
          <div>
            <p className="text-sm font-black text-red-500">{criticalCount} Critical Alert{criticalCount > 1 ? 's' : ''} Active</p>
            <p className="text-xs text-red-400/80">Immediate action may be required. Check details below.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-5">
        {TABS.map(t => {
          const count = t.id === 'all' ? sorted.length :
            allItems.filter(i => {
              if (t.id === 'earthquake') return i.type === 'earthquake'
              if (t.id === 'cyclone')    return i.type === 'cyclone'
              if (t.id === 'flood')      return i.type === 'flood'
              if (t.id === 'heatwave')   return i.type === 'heatwave' || i.type === 'cold'
              if (t.id === 'aqi')        return i.type === 'aqi'
              return false
            }).length

          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${tab === t.id ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-gray-100 dark:bg-white/8 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${tab === t.id ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-white/15 text-gray-600 dark:text-gray-400'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {loading && !data ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card-solid p-4 h-24 animate-pulse">
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-gray-200 dark:bg-white/8 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 bg-gray-200 dark:bg-white/8 rounded w-3/4" />
                  <div className="h-2.5 bg-gray-200 dark:bg-white/8 rounded w-1/2" />
                  <div className="h-2 bg-gray-200 dark:bg-white/8 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <span className="text-5xl mb-4 block">✅</span>
          <p className="font-semibold text-gray-600 dark:text-gray-400">No active {tab === 'all' ? '' : tab} warnings</p>
          <p className="text-sm mt-1">All clear for this category right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(item =>
            item.type === 'earthquake'
              ? <EarthquakeCard key={item.id} item={item} />
              : <HazardCard     key={item.id} item={item} />
          )}
          <p className="text-xs text-center text-gray-400 pt-2">
            Data from USGS, IMD, CWC, CPCB · Auto-refreshes every 5 minutes
          </p>
        </div>
      )}
    </div>
  )
}
