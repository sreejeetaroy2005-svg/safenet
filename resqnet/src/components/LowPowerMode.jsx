/**
 * LowPowerMode.jsx
 * Emergency low-connectivity/battery optimization mode.
 * When active: disables all CSS animations, reduces GPS polling, shows banner.
 * Uses a custom event so all components stay in sync.
 */
import { useState, useEffect } from 'react'
import { Battery, BatteryLow, X } from 'lucide-react'

const KEY   = 'resqnet_low_power'
const EVENT = 'resqnet-low-power-change'

function readEnabled() { return localStorage.getItem(KEY) === 'true' }

function setEnabled(val) {
  localStorage.setItem(KEY, val)
  document.documentElement.classList.toggle('low-power', val)
  window.dispatchEvent(new CustomEvent(EVENT, { detail: val }))
}

// Apply on page load in case it was previously enabled
if (readEnabled()) document.documentElement.classList.add('low-power')

export function useLowPower() {
  const [enabled, setLocalEnabled] = useState(readEnabled)

  useEffect(() => {
    const handler = (e) => setLocalEnabled(e.detail)
    window.addEventListener(EVENT, handler)
    return () => window.removeEventListener(EVENT, handler)
  }, [])

  const toggle = () => setEnabled(!readEnabled())

  return { enabled, toggle }
}

export default function LowPowerBanner() {
  const { enabled, toggle } = useLowPower()
  if (!enabled) return null

  return (
    <div className="bg-yellow-500 text-black px-4 py-2 flex items-center gap-2 text-xs font-bold z-50">
      <BatteryLow size={14} className="shrink-0" />
      <span className="flex-1">⚡ Low Power Mode — Animations disabled, GPS reduced</span>
      <button onClick={toggle} className="shrink-0 p-0.5"><X size={14} /></button>
    </div>
  )
}

export function LowPowerToggle() {
  const { enabled, toggle } = useLowPower()
  return (
    <button onClick={toggle}
      className={`flex items-center gap-2 px-4 py-3 rounded-2xl border font-semibold text-sm transition-all w-full ${
        enabled
          ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-600 dark:text-yellow-400'
          : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400'
      }`}>
      {enabled ? <BatteryLow size={16} /> : <Battery size={16} />}
      <span className="flex-1 text-left">Low Power Mode</span>
      <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${enabled ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
    </button>
  )
}
