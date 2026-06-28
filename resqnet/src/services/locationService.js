/**
 * locationService.js
 * Handles GPS acquisition with fallback, caching, and permission state.
 */

const CACHE_KEY = 'safenet_last_location'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/** Save location to localStorage for offline fallback */
export function cacheLocation(coords) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ ...coords, cachedAt: Date.now() }))
}

/** Return cached location if still fresh, else null */
export function getCachedLocation() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (Date.now() - data.cachedAt < CACHE_TTL) return data
    return data // return stale cache anyway as last-known
  } catch {
    return null
  }
}

/**
 * Get current GPS position.
 * Resolves with { lat, lng, accuracy, stale? }
 * Never rejects — falls back to cache or null.
 */
export function getCurrentLocation({ highAccuracy = true, timeout = 10000 } = {}) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(getCachedLocation())
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }
        cacheLocation(coords)
        resolve(coords)
      },
      () => {
        // GPS failed — return cached location marked as stale
        const cached = getCachedLocation()
        resolve(cached ? { ...cached, stale: true } : null)
      },
      { enableHighAccuracy: highAccuracy, timeout, maximumAge: 30000 }
    )
  })
}

/** Check geolocation permission state (returns 'granted'|'denied'|'prompt'|'unknown') */
export async function checkLocationPermission() {
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' })
    return result.state
  } catch {
    return 'unknown'
  }
}
