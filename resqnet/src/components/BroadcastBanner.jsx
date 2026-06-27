import { useState } from 'react'
import { useApp } from '../context/useApp'
import { X, AlertTriangle, Info, Megaphone } from 'lucide-react'

export default function BroadcastBanner() {
  const { broadcasts } = useApp()
  const [dismissed, setDismissed] = useState([])
  const visible = broadcasts.filter(b => !dismissed.includes(b.id)).slice(0, 1)
  if (!visible.length) return null

  const b = visible[0]
  const isEvac = b.type === 'evacuation'
  const isWarn = b.type === 'warning'

  const bg = isEvac ? 'bg-red-600' : isWarn ? 'bg-amber-500' : 'bg-blue-600'
  const Icon = isEvac || isWarn ? AlertTriangle : Info

  return (
    <div className={`${bg} text-white px-4 py-2.5 flex items-center gap-3 shadow-lg`}>
      <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
        <Icon size={13} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-xs leading-tight">{b.title}</p>
        <p className="text-[11px] opacity-80 truncate">{b.message}</p>
      </div>
      <button onClick={() => setDismissed(d => [...d, b.id])} className="shrink-0 w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
        <X size={12} />
      </button>
    </div>
  )
}
