import { useApp } from '../context/useApp'
import { Radio, AlertTriangle, Info, Clock, Megaphone } from 'lucide-react'

const TYPE_CONFIG = {
  warning:    { Icon: AlertTriangle, from: 'from-amber-500',  to: 'to-orange-500',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  badge: 'bg-amber-500/15 text-amber-500',  label: 'Warning' },
  evacuation: { Icon: AlertTriangle, from: 'from-red-500',    to: 'to-rose-600',    bg: 'bg-red-500/10',    border: 'border-red-500/30',    badge: 'bg-red-500/15 text-red-500',      label: 'Evacuation' },
  info:       { Icon: Info,          from: 'from-blue-500',   to: 'to-blue-600',    bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   badge: 'bg-blue-500/15 text-blue-500',    label: 'Info' },
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

export default function Broadcasts() {
  const { broadcasts } = useApp()

  return (
    <div className="flex flex-col min-h-full pb-24 pt-5 px-4 bg-slate-50 dark:bg-[#0a0a0f]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/30">
          <Radio size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black leading-tight">Emergency Broadcasts</h1>
          <p className="text-xs text-gray-400">{broadcasts.length} alert{broadcasts.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {broadcasts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
            <Megaphone size={28} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="font-bold text-gray-500">No broadcasts yet</p>
          <p className="text-sm text-gray-400 mt-1">Emergency alerts will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {broadcasts.map(b => {
            const cfg = TYPE_CONFIG[b.type] || TYPE_CONFIG.info
            const { Icon } = cfg
            return (
              <div key={b.id} className={`rounded-2xl overflow-hidden border ${cfg.border} ${cfg.bg}`}>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${cfg.from} ${cfg.to} flex items-center justify-center shrink-0 shadow-md`}>
                      <Icon size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${cfg.badge}`}>{cfg.label}</span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock size={10} /> {timeAgo(b.time)}
                        </span>
                      </div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">{b.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{b.message}</p>
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
