/**
 * sosCategories.js
 * SOS emergency type definitions with priority, color, and icon metadata.
 */

export const SOS_CATEGORIES = [
  { id: 'medical',   label: 'Medical Emergency',    emoji: '🚑', priority: 1, color: 'from-red-600 to-rose-500',     badge: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { id: 'flood',     label: 'Flood Rescue',          emoji: '🌊', priority: 2, color: 'from-blue-600 to-cyan-500',    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { id: 'fire',      label: 'Fire Rescue',           emoji: '🔥', priority: 1, color: 'from-orange-600 to-red-500',   badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { id: 'earthquake',label: 'Earthquake Assistance', emoji: '🌍', priority: 2, color: 'from-yellow-600 to-orange-500',badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { id: 'trapped',   label: 'Trapped / Injured',     emoji: '🆘', priority: 1, color: 'from-red-700 to-red-500',      badge: 'bg-red-600/20 text-red-300 border-red-600/30' },
  { id: 'missing',   label: 'Missing Person',        emoji: '🔍', priority: 2, color: 'from-purple-600 to-violet-500',badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { id: 'supplies',  label: 'Food / Water Needed',   emoji: '🍶', priority: 3, color: 'from-green-600 to-emerald-500',badge: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { id: 'other',     label: 'Other Emergency',       emoji: '⚠️', priority: 3, color: 'from-gray-600 to-gray-500',    badge: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
]

export const PRIORITY_LABELS = { 1: 'Critical', 2: 'High', 3: 'Normal' }
export const PRIORITY_COLORS = {
  1: 'bg-red-500/20 text-red-400 border border-red-500/30',
  2: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  3: 'bg-green-500/20 text-green-400 border border-green-500/30',
}

export function getCategoryById(id) {
  return SOS_CATEGORIES.find(c => c.id === id) || SOS_CATEGORIES[SOS_CATEGORIES.length - 1]
}

/** Sort alerts by priority (critical first), then by time */
export function sortAlertsByPriority(alerts) {
  return [...alerts].sort((a, b) => {
    const pa = getCategoryById(a.emergencyType)?.priority ?? 3
    const pb = getCategoryById(b.emergencyType)?.priority ?? 3
    if (pa !== pb) return pa - pb
    return (b.time || 0) - (a.time || 0)
  })
}
