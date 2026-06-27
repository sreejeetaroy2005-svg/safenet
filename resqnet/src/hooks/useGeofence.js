/**
 * useGeofence.js
 * Background GPS watcher that fires in-app notifications when the user
 * enters a risk zone. Zones are rebuilt around the user's ACTUAL GPS
 * position each time it updates — not hardcoded coordinates.
 */
import { useEffect, useRef } from 'react'
import { useApp } from '../context/useApp'
import { buildRiskZones, GeofenceWatcher, notifyZoneEntry } from '../services/geofenceService'

export function useGeofence() {
  const { setLocation } = useApp()
  const watcherRef  = useRef(null)
  const watchIdRef  = useRef(null)
  const firstPosRef = useRef(null) // anchor: first real GPS fix

  useEffect(() => {
    if (!navigator.geolocation) return

    watcherRef.current = new GeofenceWatcher((zone) => {
      notifyZoneEntry(zone)
    })

    const handlePosition = (pos) => {
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      const accuracy = pos.coords.accuracy

      // Store first real fix as the zone anchor
      if (!firstPosRef.current) {
        firstPosRef.current = { lat, lng }
      }

      // Update context location
      setLocation(prev => {
        if (prev?.lat === lat && prev?.lng === lng) return prev
        return { lat, lng, accuracy }
      })

      // Rebuild zones around ACTUAL location each update
      const zones = buildRiskZones(lat, lng)
      watcherRef.current.update(lat, lng, zones)
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      () => {}, // silent — no GPS = no alerts
      { enableHighAccuracy: false, maximumAge: 30000, timeout: 15000 }
    )

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      watcherRef.current?.reset()
    }
  }, [setLocation])
}
