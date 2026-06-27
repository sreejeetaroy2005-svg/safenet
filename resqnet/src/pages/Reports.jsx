import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/useApp'
import { Plus, Clock, MapPin, ClipboardList } from 'lucide-react'

const TYPE_CONFIG = {
  flood:      { emoji: '🌊', from: 'from-blue-500',   to: 'to-cyan-500',    badge: 'bg-blue-500/15 text-blue-500' },
  fire:       { emoji: '🔥', from: 'from-red-500',    to: 'to-orange-500',  badge: 'bg-red-500/15 text-red-500' },
  earthquake: { emoji: '🌍', from: 'from-orange-500', to: 'to-amber-500',   badge: 'bg-orange-500/15 text-orange-500' },
  accident:   { emoji: '🚗', from: 'from-yellow-500', to: 'to-orange-400',  badge: 'bg-yellow-500/15 text-yellow-600' },
  other:      { emoji: '⚠️', from: 'from-gray-500',   to: 'to-gray-600',    badge: 'bg-gray-500/15 text-gray-500' },
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

export default function Reports() {
  const { reports } = useApp()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-full pb-24 pt-5 px-4 bg-slate-50 dark:bg-[#0a0a0f]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Incident Reports</h1>
          <p className="text-xs text-gray-400 mt-0.5">{reports.length} report{reports.length !== 1 ? 's' : ''} submitted</p>
        </div>
        <button onClick={() => navigate('/reports/new')}
          className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-500 text-white px-4 py-2.5 rounded-2xl text-sm font-bold shadow-lg shadow-red-500/25 active:scale-95 transition-transform">
          <Plus size={16} /> New
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
          <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
            <ClipboardList size={28} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="font-bold text-gray-500">No reports yet</p>
          <p className="text-sm text-gray-400 mt-1">Be the first to report an incident</p>
          <button onClick={() => navigate('/reports/new')}
            className="mt-5 btn-danger text-sm px-6">
            Submit Report
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => {
            const cfg = TYPE_CONFIG[r.type] || TYPE_CONFIG.other
            return (
              <div key={r.id} className="card-solid p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${cfg.from} ${cfg.to} flex items-center justify-center text-xl shrink-0 shadow-md`}>
                    {cfg.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold capitalize ${cfg.badge}`}>{r.type}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${r.status === 'pending' ? 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400' : 'bg-green-500/15 text-green-600'}`}>
                        {r.status}
                      </span>
                      {r.simulated && <span className="text-[10px] bg-gray-100 dark:bg-white/8 text-gray-400 px-1.5 py-0.5 rounded font-medium">SIM</span>}
                    </div>
                    <p className="font-bold text-sm">{r.title}</p>
                    {r.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{r.description}</p>}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {r.location && r.location.lat !== 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin size={10} /> {r.location.lat?.toFixed(3)}, {r.location.lng?.toFixed(3)}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={10} /> {timeAgo(r.time)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
