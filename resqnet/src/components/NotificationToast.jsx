import { useEffect } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { dismissNotification, PRIORITY } from '../services/notificationService'
import { X, AlertCircle, AlertTriangle, Info } from 'lucide-react'

const STYLES = {
  [PRIORITY.CRITICAL]: { bg: 'bg-red-600',   border: 'border-red-500',   Icon: AlertCircle },
  [PRIORITY.WARNING]:  { bg: 'bg-amber-500',  border: 'border-amber-400', Icon: AlertTriangle },
  [PRIORITY.INFO]:     { bg: 'bg-blue-600',   border: 'border-blue-500',  Icon: Info },
}

function Toast({ n }) {
  const { bg, border, Icon } = STYLES[n.priority] || STYLES[PRIORITY.INFO]
  useEffect(() => {
    const t = setTimeout(() => dismissNotification(n.id), n.duration || 4000)
    return () => clearTimeout(t)
  }, [n.id])

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-2xl shadow-2xl border ${bg} ${border} text-white animate-slide-in`}>
      <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm leading-tight">{n.title}</p>
        {n.message && <p className="text-xs opacity-80 mt-0.5 line-clamp-2">{n.message}</p>}
      </div>
      <button onClick={() => dismissNotification(n.id)} className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0 hover:bg-white/30 transition-colors">
        <X size={12} />
      </button>
    </div>
  )
}

export default function NotificationToast() {
  const { notifications } = useNotifications()
  const visible = notifications.slice(0, 3)
  if (!visible.length) return null

  return (
    <div className="fixed top-4 left-0 right-0 z-[100] px-4 space-y-2 max-w-lg mx-auto pointer-events-none">
      {visible.map(n => (
        <div key={n.id} className="pointer-events-auto">
          <Toast n={n} />
        </div>
      ))}
    </div>
  )
}
