import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { WifiOff } from 'lucide-react'

export default function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null
  return (
    <div className="bg-gray-900 text-white text-xs font-semibold flex items-center justify-center gap-2 py-2 px-4 border-b border-white/10">
      <WifiOff size={11} className="text-yellow-400" />
      <span className="text-gray-300">Offline Mode</span>
      <span className="text-gray-500">— SOS alerts will queue and send when reconnected</span>
    </div>
  )
}
