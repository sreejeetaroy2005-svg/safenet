/**
 * MapView.jsx — Disaster visualization map.
 * Shows: user location, shelters, active SOS alerts, hazard markers, incident reports.
 * Includes: layer filters, hazard reporting, list view, safe route hint.
 */
import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useApp } from '../context/useApp'
import { MapPin, Navigation, List, Map, RefreshCw, AlertTriangle, Plus, Filter, X } from 'lucide-react'
import { getHazards, addHazard, voteHazard, HAZARD_TYPES, getHazardType } from '../services/hazardService'
import { getCategoryById } from '../services/sosCategories'
import 'leaflet/dist/leaflet.css'

// Fix leaflet icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const makeIcon = (html, size = 34) => L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2] })

const shelterIcon = makeIcon('<div style="background:#16A34A;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:15px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🏠</div>')
const userIcon    = makeIcon('<div style="background:#2563EB;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid white;box-shadow:0 2px 10px rgba(37,99,235,0.5)">📍</div>', 36)
const sosIcon     = makeIcon('<div style="background:#DC2626;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:15px;border:2px solid white;box-shadow:0 0 12px rgba(220,38,38,0.6)">🆘</div>')

function makeHazardIcon(emoji) {
  return makeIcon(`<div style="background:#1F2937;color:white;border-radius:10px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid rgba(255,255,255,0.2);box-shadow:0 2px 8px rgba(0,0,0,0.4)">${emoji}</div>`)
}

function RecenterMap({ coords }) {
  const map = useMap()
  useEffect(() => { if (coords) map.setView([coords.lat, coords.lng], 14) }, [coords])
  return null
}

const MOCK_SHELTERS = [
  { id: 1, name: 'City Relief Camp',  type: 'Relief Camp',      available: true,  capacity: '500', offset: [0.005, 0.007] },
  { id: 2, name: 'St. Mary School',   type: 'School',           available: true,  capacity: '300', offset: [-0.006, 0.009] },
  { id: 3, name: 'District Hospital', type: 'Hospital',         available: true,  capacity: '200', offset: [0.009, -0.005] },
  { id: 4, name: 'Community Hall',    type: 'Community Center', available: false, capacity: '200', offset: [-0.010, -0.008] },
]

const LAYERS = ['shelters', 'sos', 'hazards', 'incidents', 'risk zones']

export default function MapView() {
  const { location, setLocation, sosAlerts, reports } = useApp()
  const [coords,       setCoords]       = useState(location || { lat: 20.5937, lng: 78.9629 })
  const [view,         setView]         = useState('map')
  const [loading,      setLoading]      = useState(false)
  const [activeLayers, setActiveLayers] = useState(new Set(['shelters', 'sos', 'hazards', 'risk zones']))
  const [hazards,      setHazards]      = useState(getHazards)
  const [showAddHazard, setShowAddHazard] = useState(false)
  const [hazardForm,   setHazardForm]   = useState({ type: 'flooded_road', description: '' })

  const fetchLocation = useCallback(() => {
    setLoading(true)
    navigator.geolocation?.getCurrentPosition(
      pos => { const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setCoords(c); setLocation(c); setLoading(false) },
      () => setLoading(false),
      { enableHighAccuracy: true }
    )
  }, [setLocation])

  useEffect(() => { fetchLocation() }, [])

  const shelters = MOCK_SHELTERS.map(s => ({ ...s, lat: coords.lat + s.offset[0], lng: coords.lng + s.offset[1] }))

  const toggleLayer = (l) => setActiveLayers(prev => {
    const next = new Set(prev)
    next.has(l) ? next.delete(l) : next.add(l)
    return next
  })

  const handleAddHazard = () => {
    const h = addHazard({ ...hazardForm, lat: coords.lat + (Math.random() - 0.5) * 0.01, lng: coords.lng + (Math.random() - 0.5) * 0.01, reportedBy: 'You' })
    setHazards(getHazards())
    setShowAddHazard(false)
    setHazardForm({ type: 'flooded_road', description: '' })
  }

  const activeAlerts = sosAlerts.filter(a => a.status !== 'resolved' && a.location?.lat)

  return (
    <div className="flex flex-col pb-24 md:pb-8 pt-6 min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-[#0a0a0f]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-black">Disaster Map</h1>
          <p className="text-xs text-gray-400">{activeAlerts.length} active SOS · {hazards.length} hazards</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchLocation} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/8 flex items-center justify-center">
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-500' : 'text-gray-500'} />
          </button>
          <div className="flex bg-gray-100 dark:bg-white/8 rounded-xl p-1">
            <button onClick={() => setView('map')} className={`p-1.5 rounded-lg transition-colors ${view === 'map' ? 'bg-white dark:bg-white/15 shadow-sm' : ''}`}>
              <Map size={15} className={view === 'map' ? 'text-blue-600' : 'text-gray-400'} />
            </button>
            <button onClick={() => setView('list')} className={`p-1.5 rounded-lg transition-colors ${view === 'list' ? 'bg-white dark:bg-white/15 shadow-sm' : ''}`}>
              <List size={15} className={view === 'list' ? 'text-blue-600' : 'text-gray-400'} />
            </button>
          </div>
        </div>
      </div>

      {/* Layer filters */}
      <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
        {LAYERS.map(l => (
          <button key={l} onClick={() => toggleLayer(l)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${activeLayers.has(l) ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-white/8 text-gray-500'}`}>
            {l === 'sos' ? `🆘 SOS (${activeAlerts.length})` : l === 'hazards' ? `⚠️ Hazards (${hazards.length})` : l === 'shelters' ? '🏠 Shelters' : l === 'incidents' ? '📋 Incidents' : '🗺️ Risk Zones'}
          </button>
        ))}
        <button onClick={() => setShowAddHazard(true)}
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-orange-500/15 text-orange-500 border border-orange-500/30">
          <Plus size={11} /> Report Hazard
        </button>
      </div>

      {/* Location bar */}
      <div className="mb-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
        <MapPin size={13} className="text-blue-500 shrink-0" />
        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>
      </div>

      {/* Add Hazard Modal — fixed overlay so map doesn't block it */}
      {showAddHazard && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center px-4 pb-6" onClick={() => setShowAddHazard(false)}>
          <div className="w-full max-w-lg bg-white dark:bg-[#141420] border border-orange-500/30 rounded-3xl p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-black text-base">Report Hazard Near You</p>
              <button onClick={() => setShowAddHazard(false)} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/8 flex items-center justify-center">
                <X size={15} className="text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {HAZARD_TYPES.map(ht => (
                <button key={ht.id} onClick={() => setHazardForm(f => ({ ...f, type: ht.id }))}
                  className={`flex items-center gap-2 p-3 rounded-2xl border text-xs font-semibold transition-all ${hazardForm.type === ht.id ? 'bg-orange-500/15 border-orange-500/40 text-orange-500' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400'}`}>
                  <span className="text-lg">{ht.emoji}</span> {ht.label}
                </button>
              ))}
            </div>
            <input
              className="input-field mb-4 text-sm"
              placeholder="Brief description (optional)"
              value={hazardForm.description}
              onChange={e => setHazardForm(f => ({ ...f, description: e.target.value }))}
            />
            <button
              onClick={handleAddHazard}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-black shadow-lg shadow-orange-500/25 active:scale-95 transition-transform">
              ⚠️ Add Hazard Marker
            </button>
          </div>
        </div>
      )}

      {view === 'map' ? (
        <div className="rounded-2xl overflow-hidden" style={{ height: '520px' }}>
          <MapContainer center={[coords.lat, coords.lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
            <RecenterMap coords={coords} />

            {/* User */}
            <Marker position={[coords.lat, coords.lng]} icon={userIcon}>
              <Popup><strong>You are here</strong></Popup>
            </Marker>
            <Circle center={[coords.lat, coords.lng]} radius={2000} pathOptions={{ color: '#2563EB', fillOpacity: 0.04, weight: 1 }} />

            {/* Shelters */}
            {activeLayers.has('shelters') && shelters.map(s => (
              <Marker key={s.id} position={[s.lat, s.lng]} icon={shelterIcon}>
                <Popup><strong>{s.name}</strong><br />{s.type}<br />{s.available ? '✅ Open' : '❌ Full'} · {s.capacity} capacity</Popup>
              </Marker>
            ))}

            {/* Active SOS */}
            {activeLayers.has('sos') && activeAlerts.map(a => (
              <Marker key={a.id} position={[a.location.lat, a.location.lng]} icon={sosIcon}>
                <Popup>
                  <strong>🆘 {a.user}</strong><br />
                  {getCategoryById(a.emergencyType)?.label || 'Emergency'}<br />
                  Status: {a.status}
                </Popup>
              </Marker>
            ))}

            {/* Hazards */}
            {activeLayers.has('hazards') && hazards.map(h => {
              const ht = getHazardType(h.type)
              return (
                <Marker key={h.id} position={[h.lat, h.lng]} icon={makeHazardIcon(ht.emoji)}>
                  <Popup>
                    <strong>{ht.emoji} {ht.label}</strong><br />
                    {h.description || 'No description'}<br />
                    👍 {h.votes} confirmations
                  </Popup>
                </Marker>
              )
            })}

            {/* Incident reports */}
            {activeLayers.has('incidents') && reports.filter(r => r.location?.lat).map(r => (
              <Circle key={r.id} center={[r.location.lat, r.location.lng]} radius={300}
                pathOptions={{ color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.15, weight: 2 }}>
                <Popup><strong>📋 {r.title}</strong><br />{r.type} · {r.status}</Popup>
              </Circle>
            ))}

            {/* Risk zones */}
            {activeLayers.has('risk zones') && (
              <>
                <Circle center={[coords.lat + 0.015, coords.lng + 0.015]} radius={1500}
                  pathOptions={{ color: '#DC2626', fillColor: '#DC2626', fillOpacity: 0.15, weight: 1, dashArray: '4' }}>
                  <Popup><strong>⚠️ High Flood Risk Zone</strong><br/>Evacuation recommended during heavy rain.</Popup>
                </Circle>
                
                <Circle center={[coords.lat - 0.01, coords.lng + 0.02]} radius={2000}
                  pathOptions={{ color: '#EAB308', fillColor: '#EAB308', fillOpacity: 0.15, weight: 1, dashArray: '4' }}>
                  <Popup><strong>⚡ Low Flood Risk Zone</strong><br/>Stay alert for waterlogging.</Popup>
                </Circle>

                <Circle center={[coords.lat - 0.02, coords.lng - 0.015]} radius={3000}
                  pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.1, weight: 1 }}>
                  <Popup><strong>🌀 Cyclone Caution Zone</strong><br/>High winds expected. Secure outdoor objects.</Popup>
                </Circle>
              </>
            )}
          </MapContainer>
        </div>
      ) : (
        <div className="overflow-y-auto space-y-3 pb-4">
          {/* Shelters list */}
          <p className="section-label">Shelters</p>
          {shelters.map(s => (
            <div key={s.id} className="card-solid p-4 flex items-start gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 ${s.available ? 'bg-green-500/15' : 'bg-gray-100 dark:bg-white/8'}`}>🏠</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm truncate">{s.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${s.available ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500'}`}>{s.available ? 'Open' : 'Full'}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.type} · {s.capacity} capacity</p>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-xl font-semibold">
                  <Navigation size={11} /> Navigate
                </a>
              </div>
            </div>
          ))}

          {/* Hazards list */}
          {hazards.length > 0 && <>
            <p className="section-label mt-2">Active Hazards</p>
            {hazards.map(h => {
              const ht = getHazardType(h.type)
              return (
                <div key={h.id} className="card-solid p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/15 flex items-center justify-center text-xl shrink-0">{ht.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{ht.label}</p>
                    {h.description && <p className="text-xs text-gray-500 mt-0.5">{h.description}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-400">👍 {h.votes} confirmations</span>
                      <button onClick={() => { voteHazard(h.id); setHazards(getHazards()) }} className="text-xs text-blue-500 font-semibold">Confirm</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </>}
        </div>
      )}
    </div>
  )
}
