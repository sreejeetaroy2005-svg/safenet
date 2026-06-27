/**
 * RescueDashboard.jsx
 * Rescue team / volunteer panel — view nearby SOS, accept missions, navigate to victims.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/useApp'
import { ArrowLeft, MapPin, Clock, CheckCircle, Navigation, AlertCircle, Users, Zap } from 'lucide-react'
import { getCategoryById, PRIORITY_LABELS, PRIORITY_COLORS, sortAlertsByPriority } from '../services/sosCategories'
import InfoTooltip from '../components/InfoTooltip'

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function timeAgo(ts) {
  const m = Math.floor((Date.now() - ts) / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ago`
}

export default function RescueDashboard() {
  const navigate = useNavigate()
  const { sosAlerts, updateSosStatus, location } = useApp()
  const [accepted, setAccepted] = useState(new Set())
  const [filter, setFilter] = useState('all')
  const [radius, setRadius] = useState(50) // Default response range in km

  const myLoc = location || { lat: 20.5937, lng: 78.9629 }

  const mappedAlerts = sosAlerts.map(a => {
    const dist = a.location?.lat ? distanceKm(myLoc.lat, myLoc.lng, a.location.lat, a.location.lng) : Infinity
    return { ...a, distance: dist }
  })

  const activeAlerts = mappedAlerts.filter(
    a => a.status !== 'resolved' && a.location?.lat && a.distance <= radius
  )

  const filtered = filter === 'all' ? activeAlerts : activeAlerts.filter(a => {
    const cat = getCategoryById(a.emergencyType)
    return cat?.priority === parseInt(filter)
  })

  // Sort by priority first (Critical -> High -> Normal), then by distance (closest first)
  const SORDER = { 1: 0, 2: 1, 3: 2 }
  const sorted = [...filtered].sort((a, b) => {
    const catA = getCategoryById(a.emergencyType)
    const catB = getCategoryById(b.emergencyType)
    const prioA = catA?.priority || 3
    const prioB = catB?.priority || 3
    if (prioA !== prioB) {
      return (SORDER[prioA] ?? 3) - (SORDER[prioB] ?? 3)
    }
    return a.distance - b.distance
  })

  const handleAccept = (id) => {
    setAccepted(prev => new Set([...prev, id]))
    updateSosStatus(id, 'responded')
  }

  const handleComplete = (id) => {
    setAccepted(prev => { const n = new Set(prev); n.delete(id); return n })
    updateSosStatus(id, 'resolved')
  }

  return (
    <div className="flex flex-col pb-24 md:pb-8 bg-slate-50 dark:bg-[#0a0a0f]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-4 pt-6 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <ArrowLeft size={17} className="text-white" />
          </button>
          <div>
            <h1 className="font-black text-white text-lg leading-none">Rescue Dashboard</h1>
            <p className="text-xs text-blue-200 mt-1 flex items-center">
              <MapPin size={11} className="mr-1" />
              <span>
                {location ? `${location.lat.toFixed(3)}, ${location.lng.toFixed(3)}` : 'Default Location'}
              </span>
              <InfoTooltip text="Calculates the physical distance in kilometers to incoming SOS emergencies from these coordinates using the Haversine formula." />
            </p>
          </div>
          <div className="ml-auto w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <Users size={17} className="text-white" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Active Near', value: activeAlerts.length },
            { label: 'Accepted',   value: accepted.size },
            { label: 'Critical Near', value: activeAlerts.filter(a => getCategoryById(a.emergencyType)?.priority === 1).length },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/10 rounded-2xl px-3 py-2.5 text-center">
              <p className="text-xl font-black text-white">{value}</p>
              <p className="text-[11px] text-blue-200">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Response Radius Control */}
      <div className="px-4 py-2 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/2">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center">
            <span>Response Search Radius</span>
            <InfoTooltip text="Filters out any emergency alerts situated beyond this range to focus volunteer efforts locally, and automatically sorts the feed by proximity." />
          </label>
          <span className="text-xs font-black text-blue-500">{radius} km</span>
        </div>
        <input 
          type="range" 
          min="5" 
          max="200" 
          step="5"
          value={radius} 
          onChange={e => setRadius(Number(e.target.value))}
          className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      {/* Priority filter */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
        {[['all', 'All'], ['1', '🔴 Critical'], ['2', '🟡 High'], ['3', '🟢 Normal']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filter === val ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-white/8 text-gray-500'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-3">
        {sorted.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CheckCircle size={44} className="mx-auto mb-3 opacity-20" />
            <p className="font-semibold">No active emergencies</p>
            <p className="text-sm mt-1">All clear within {radius} km of your location</p>
          </div>
        ) : sorted.map(alert => {
          const cat = getCategoryById(alert.emergencyType)
          const isAccepted = accepted.has(alert.id)
          const dist = alert.distance !== Infinity ? alert.distance.toFixed(1) : '?'

          return (
            <div key={alert.id} className={`rounded-2xl overflow-hidden border ${isAccepted ? 'border-blue-500/40 bg-blue-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${cat?.color || 'from-red-600 to-rose-500'} flex items-center justify-center text-xl shrink-0 shadow-md`}>
                    {cat?.emoji || '🆘'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-black text-sm">{alert.user}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${PRIORITY_COLORS[cat?.priority || 3]}`}>
                        {PRIORITY_LABELS[cat?.priority || 3]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{cat?.label || 'Emergency'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-blue-500">{dist} km</p>
                    <p className="text-[10px] text-gray-400">{timeAgo(alert.time)}</p>
                  </div>
                </div>

                {alert.location?.lat !== 0 && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <MapPin size={11} className="text-gray-400 shrink-0" />
                    <p className="text-xs text-gray-500 font-mono">{alert.location.lat?.toFixed(4)}, {alert.location.lng?.toFixed(4)}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  {!isAccepted ? (
                    <button onClick={() => handleAccept(alert.id)}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5">
                      <Zap size={12} /> Accept Mission
                    </button>
                  ) : (
                    <button onClick={() => handleComplete(alert.id)}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5">
                      <CheckCircle size={12} /> Mark Complete
                    </button>
                  )}
                  {alert.location?.lat !== 0 && (
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${alert.location.lat},${alert.location.lng}`}
                      target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/8 text-xs font-bold text-gray-600 dark:text-gray-400">
                      <Navigation size={12} /> Navigate
                    </a>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
