/**
 * useLocation.js
 * React hook for GPS location with permission state, caching, and live tracking.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { getCurrentLocation, checkLocationPermission, cacheLocation } from '../services/locationService'

export function useLocation({ autoFetch = false, watch = false } = {}) {
  const [coords, setCoords] = useState(null)
  const [permission, setPermission] = useState('unknown') // granted|denied|prompt|unknown
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const watchIdRef = useRef(null)

  // Check permission on mount
  useEffect(() => {
    checkLocationPermission().then(setPermission)
  }, [])

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await getCurrentLocation()
    if (result) {
      setCoords(result)
      if (result.stale) setError('Using last known location — GPS unavailable.')
    } else {
      setError('Location unavailable. Enable GPS and try again.')
    }
    setLoading(false)
    return result
  }, [])

  // Auto-fetch on mount if requested
  useEffect(() => {
    if (autoFetch) fetch()
  }, [autoFetch])

  // Live watch mode (for SOS tracking)
  const startWatch = useCallback(() => {
    if (!navigator.geolocation || watchIdRef.current) return
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }
        setCoords(c)
        cacheLocation(c)
        setError(null)
      },
      () => setError('GPS signal lost.'),
      { enableHighAccuracy: true, maximumAge: 5000 }
    )
  }, [])

  const stopWatch = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  useEffect(() => {
    if (watch) startWatch()
    return stopWatch
  }, [watch])

  return { coords, permission, loading, error, fetch, startWatch, stopWatch }
}
