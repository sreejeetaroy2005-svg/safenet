import { useState, useEffect } from 'react'
import { useApp } from '../context/useApp'
import {
  Shield, AlertCircle, FileText, Radio, Users, Send, Clock,
  MapPin, LogOut, Bell, CheckCircle, Mic, ChevronDown, ChevronUp,
  Sun, Moon, RefreshCw, Check, Eye
} from 'lucide-react'

const TABS = [
  { id: 'sos',       label: 'SOS',       icon: AlertCircle },
  { id: 'reports',   label: 'Reports',   icon: FileText },
  { id: 'broadcast', label: 'Broadcast', icon: Radio },
  { id: 'users',     label: 'Users',     icon: Users },
]

const REPORT_TYPES = ['all', 'flood', 'fire', 'earthquake', 'accident', 'other']

const SOS_STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-yellow-500/15 text-yellow-500',  dot: 'bg-yellow-500' },
  received:  { label: 'Received',  color: 'bg-blue-500/15 text-blue-500',      dot: 'bg-blue-500' },
  responded: { label: 'Responded', color: 'bg-purple-500/15 text-purple-500',  dot: 'bg-purple-500' },
  resolved:  { label: 'Resolved',  color: 'bg-green-500/15 text-green-500',    dot: 'bg-green-500' },
  active:    { label: 'Active',    color: 'bg-red-500/15 text-red-500',         dot: 'bg-red-500 animate-pulse' },
}

function timeAgo(ts) {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function AdminDashboard() {
  const { user, logout, sosAlerts, reports, addBroadcast, updateSosStatus, darkMode, setDarkMode, pendingSync } = useApp()
  const [tab,          setTab]          = useState('sos')
  const [bForm,        setBForm]        = useState({ title: '', message: '', type: 'warning' })
  const [broadcastSent, setBroadcastSent] = useState(false)
  const [expandedSos,  setExpandedSos]  = useState(null)
  const [reportFilter, setReportFilter] = useState('all')
  const [tick,         setTick]         = useState(0)

  useEffect(() => { const t = setInterval(() => setTick(n => n + 1), 30000); return () => clearInterval(t) }, [])

  const allUsers    = JSON.parse(localStorage.getItem('resqnet_users') || '[]')
  const activeAlerts = sosAlerts.filter(s => s.status === 'active' || s.status === 'pending')
  const filteredReports = reportFilter === 'all' ? reports : reports.filter(r => r.type === reportFilter)

  const handleBroadcast = (e) => {
    e.preventDefault()
    if (!bForm.title.trim() || !bForm.message.trim()) return
    addBroadcast(bForm)
    setBForm({ title: '', message: '', type: 'warning' })
    setBroadcastSent(true)
    setTimeout(() => setBroadcastSent(false), 3000)
  }

  const nextStatus = { active: 'received', pending: 'received', received: 'responded', responded: 'resolved' }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f]">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 to-red-600 px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-white text-base leading-none">RESQNET Admin</h1>
              <p className="text-xs text-red-200">{user?.name} · Control Center</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingSync && (
              <div className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/40 rounded-full px-2 py-1">
                <RefreshCw size={10} className="text-yellow-400 animate-spin" />
                <span className="text-[10px] text-yellow-400 font-bold">Syncing</span>
              </div>
            )}
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
              {darkMode ? <Sun size={15} className="text-white" /> : <Moon size={15} className="text-white" />}
            </button>
            <button onClick={logout} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
              <LogOut size={15} className="text-white" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Active SOS', value: activeAlerts.length, urgent: activeAlerts.length > 0 },
            { label: 'Reports',    value: reports.length,      urgent: false },
            { label: 'Users',      value: allUsers.length,     urgent: false },
          ].map(({ label, value, urgent }) => (
            <div key={label} className={`rounded-2xl px-3 py-2.5 text-center ${urgent && value > 0 ? 'bg-white/25' : 'bg-white/10'}`}>
              <p className={`text-2xl font-black text-white ${urgent && value > 0 ? 'animate-pulse' : ''}`}>{value}</p>
              <p className="text-[11px] text-red-100 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Active SOS banner */}
      {activeAlerts.length > 0 && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2 flex items-center gap-2">
          <Bell size={13} className="text-red-500 animate-bounce shrink-0" />
          <p className="text-xs font-bold text-red-500">
            {activeAlerts.length} active SOS alert{activeAlerts.length > 1 ? 's' : ''} — immediate response needed
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/8 bg-[#0f0f1a] px-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-bold transition-colors border-b-2 relative ${tab === id ? 'border-red-500 text-red-500' : 'border-transparent text-gray-500'}`}>
            <Icon size={15} />
            {label}
            {id === 'sos' && activeAlerts.length > 0 && (
              <span className="absolute top-1.5 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {activeAlerts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">

        {/* ── SOS ALERTS ── */}
        {tab === 'sos' && (
          <div className="space-y-3">
            {sosAlerts.length === 0 ? (
              <div className="text-center py-16 text-gray-600">
                <AlertCircle size={44} className="mx-auto mb-3 opacity-20" />
                <p className="font-semibold">No SOS alerts yet</p>
                <p className="text-sm mt-1 text-gray-600">Alerts appear here in real time</p>
              </div>
            ) : sosAlerts.map(a => {
              const sc = SOS_STATUS_CONFIG[a.status] || SOS_STATUS_CONFIG.active
              return (
                <div key={a.id} className={`rounded-2xl overflow-hidden border ${a.status === 'resolved' ? 'border-white/8 bg-white/3' : 'border-red-500/30 bg-red-500/5'}`}>
                  <button className="w-full p-4 text-left" onClick={() => setExpandedSos(expandedSos === a.id ? null : a.id)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${sc.dot}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm text-white">{a.user}</p>
                            {a.simulated && <span className="text-[9px] bg-white/10 text-gray-400 px-1.5 py-0.5 rounded font-medium">SIM</span>}
                          </div>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Clock size={9} /> {timeAgo(a.time)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${sc.color}`}>{sc.label}</span>
                        {expandedSos === a.id ? <ChevronUp size={13} className="text-gray-500" /> : <ChevronDown size={13} className="text-gray-500" />}
                      </div>
                    </div>
                  </button>

                  {expandedSos === a.id && (
                    <div className="px-4 pb-4 border-t border-white/8 pt-3 space-y-3">
                      {a.location?.lat !== 0 ? (
                        <div className="flex items-center gap-2">
                          <MapPin size={13} className="text-blue-400 shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-gray-300">GPS Location</p>
                            <p className="text-xs text-gray-500 font-mono">{a.location?.lat?.toFixed(5)}, {a.location?.lng?.toFixed(5)}</p>
                            {a.location?.accuracy && <p className="text-xs text-gray-600">±{Math.round(a.location.accuracy)}m accuracy</p>}
                          </div>
                          <a href={`https://www.google.com/maps?q=${a.location?.lat},${a.location?.lng}`} target="_blank" rel="noreferrer"
                            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-xl font-semibold shrink-0">
                            Open Map
                          </a>
                        </div>
                      ) : <p className="text-xs text-gray-600">Location unavailable</p>}

                      {a.audioBlob && <p className="flex items-center gap-1.5 text-xs text-blue-400 font-medium"><Mic size={11} /> Voice message attached</p>}

                      {/* Status action buttons */}
                      {a.status !== 'resolved' && (
                        <div className="flex gap-2 pt-1">
                          {nextStatus[a.status] && (
                            <button onClick={() => updateSosStatus(a.id, nextStatus[a.status])}
                              className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/15 text-white px-3 py-2 rounded-xl font-semibold transition-colors">
                              <Check size={11} /> Mark {nextStatus[a.status]}
                            </button>
                          )}
                          <button onClick={() => updateSosStatus(a.id, 'resolved')}
                            className="flex items-center gap-1.5 text-xs bg-green-500/15 hover:bg-green-500/25 text-green-400 px-3 py-2 rounded-xl font-semibold transition-colors">
                            <CheckCircle size={11} /> Resolve
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── REPORTS ── */}
        {tab === 'reports' && (
          <div>
            <div className="flex gap-2 overflow-x-auto pb-3 mb-3 no-scrollbar">
              {REPORT_TYPES.map(t => (
                <button key={t} onClick={() => setReportFilter(t)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${reportFilter === t ? 'bg-red-600 text-white' : 'bg-white/8 text-gray-400 hover:bg-white/12'}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {filteredReports.length === 0 ? (
                <div className="text-center py-12 text-gray-600">
                  <FileText size={40} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No {reportFilter !== 'all' ? reportFilter : ''} reports</p>
                </div>
              ) : filteredReports.map(r => (
                <div key={r.id} className="rounded-2xl bg-white/5 border border-white/8 p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs bg-orange-500/15 text-orange-400 px-2.5 py-0.5 rounded-full font-bold capitalize">{r.type}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${r.status === 'pending' ? 'bg-yellow-500/15 text-yellow-500' : 'bg-green-500/15 text-green-500'}`}>{r.status}</span>
                    {r.hasPhoto && <span className="text-xs text-gray-500">📷</span>}
                    {r.hasAudio && <span className="text-xs text-gray-500">🎙️</span>}
                    {r.simulated && <span className="text-[9px] bg-white/8 text-gray-500 px-1.5 py-0.5 rounded font-medium">SIM</span>}
                  </div>
                  <p className="font-bold text-sm text-white">{r.title}</p>
                  {r.description && <p className="text-xs text-gray-500 mt-1">{r.description}</p>}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {r.location?.lat !== 0 && (
                      <a href={`https://www.google.com/maps?q=${r.location?.lat},${r.location?.lng}`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-400">
                        <MapPin size={9} /> {r.location?.lat?.toFixed(3)}, {r.location?.lng?.toFixed(3)}
                      </a>
                    )}
                    <span className="flex items-center gap-1 text-xs text-gray-600"><Clock size={9} /> {timeAgo(r.time)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BROADCAST ── */}
        {tab === 'broadcast' && (
          <div>
            <p className="text-sm text-gray-500 mb-5">Send an emergency alert to all users. Appears as a banner instantly.</p>
            <form onSubmit={handleBroadcast} className="space-y-4">
              <div>
                <p className="section-label">Alert Type</p>
                <div className="flex gap-2">
                  {[
                    { val: 'warning',    label: '⚠️ Warning',    active: 'bg-amber-500' },
                    { val: 'evacuation', label: '🚨 Evacuation', active: 'bg-red-600' },
                    { val: 'info',       label: 'ℹ️ Info',       active: 'bg-blue-600' },
                  ].map(({ val, label, active }) => (
                    <button key={val} type="button" onClick={() => setBForm(f => ({ ...f, type: val }))}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${bForm.type === val ? `${active} text-white` : 'bg-white/8 text-gray-400 hover:bg-white/12'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="section-label">Title</p>
                <input className="input-field" placeholder="e.g. Flood Warning – Coastal Areas" value={bForm.title} onChange={e => setBForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div>
                <p className="section-label">Message</p>
                <textarea className="input-field resize-none" rows={4} placeholder="Detailed instructions for users…" value={bForm.message} onChange={e => setBForm(f => ({ ...f, message: e.target.value }))} required />
              </div>
              {broadcastSent && (
                <div className="flex items-center gap-2 text-green-400 font-semibold text-sm bg-green-500/10 border border-green-500/30 px-4 py-3 rounded-2xl">
                  <CheckCircle size={15} /> Broadcast sent to all users!
                </div>
              )}
              <button type="submit" className="w-full btn-danger flex items-center justify-center gap-2 py-4">
                <Send size={16} /> Send Broadcast Now
              </button>
            </form>
          </div>
        )}

        {/* ── USERS ── */}
        {tab === 'users' && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-red-500/8 border border-red-500/20 p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shrink-0">
                <Shield size={17} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-white">Admin</p>
                <p className="text-xs text-gray-500">admin@resqnet.com</p>
              </div>
              <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">Admin</span>
            </div>
            {allUsers.length === 0 ? (
              <div className="text-center py-10 text-gray-600">
                <Users size={36} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">No registered users yet</p>
              </div>
            ) : allUsers.map(u => (
              <div key={u.id} className="rounded-2xl bg-white/5 border border-white/8 p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/15 rounded-xl flex items-center justify-center shrink-0">
                  <Users size={17} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-white truncate">{u.name}</p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
                <span className="text-xs bg-blue-500/15 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold">User</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
