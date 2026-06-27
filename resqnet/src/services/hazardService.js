/**
 * hazardService.js
 * Crowdsourced hazard markers — stored in localStorage, expire after TTL.
 */

const KEY = 'resqnet_hazards'
const TTL = 6 * 60 * 60 * 1000 // 6 hours

export const HAZARD_TYPES = [
  { id: 'flooded_road',   label: 'Flooded Road',     emoji: '🌊', color: '#3B82F6' },
  { id: 'blocked_road',   label: 'Blocked Road',     emoji: '🚧', color: '#F59E0B' },
  { id: 'fire_zone',      label: 'Fire Zone',        emoji: '🔥', color: '#EF4444' },
  { id: 'fallen_tree',    label: 'Fallen Tree',      emoji: '🌳', color: '#10B981' },
  { id: 'unsafe_building',label: 'Unsafe Building',  emoji: '🏚️', color: '#8B5CF6' },
  { id: 'power_line',     label: 'Downed Power Line',emoji: '⚡', color: '#F97316' },
]

export function getHazards() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]')
    const now = Date.now()
    // Filter expired hazards
    return raw.filter(h => now - h.createdAt < TTL)
  } catch { return [] }
}

export function addHazard({ type, lat, lng, description, reportedBy }) {
  const hazards = getHazards()
  const newHazard = {
    id: Date.now().toString(),
    type, lat, lng, description,
    reportedBy: reportedBy || 'Anonymous',
    votes: 1,
    createdAt: Date.now(),
  }
  localStorage.setItem(KEY, JSON.stringify([newHazard, ...hazards]))
  return newHazard
}

export function voteHazard(id) {
  const hazards = getHazards()
  const updated = hazards.map(h => h.id === id ? { ...h, votes: h.votes + 1 } : h)
  localStorage.setItem(KEY, JSON.stringify(updated))
  return updated
}

export function removeHazard(id) {
  const hazards = getHazards().filter(h => h.id !== id)
  localStorage.setItem(KEY, JSON.stringify(hazards))
}

export function getHazardType(id) {
  return HAZARD_TYPES.find(t => t.id === id) || HAZARD_TYPES[0]
}
