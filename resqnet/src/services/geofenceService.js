/**
 * geofenceService.js
 * Checks if a GPS coordinate falls inside any defined risk zone polygon/circle.
 * Fires a callback when the user enters a zone they weren't previously in.
 *
 * Uses Haversine distance for circular zones — no external library needed.
 */

import { pushNotification, PRIORITY } from './notificationService'

/* ── Haversine distance (km) ────────────────────────────────── */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Static risk zone definitions.
 * In a real system these would come from Firestore / an API.
 * Centres are offset from a base coordinate; at runtime we create real
 * zones around the user's actual location for demo purposes.
 */
export function buildRiskZones(userLat, userLng) {
  const zones = [
    {
      id:        'flood-high',
      name:      'High Flood Risk Zone',
      type:      'flood',
      severity:  'HIGH',
      radiusKm:  1.5,
      center:    { lat: userLat + 0.015, lng: userLng + 0.015 },
      message:   'You have entered a HIGH FLOOD RISK zone. Move to higher ground and avoid water bodies.',
      emoji:     '🌊',
      color:     'text-orange-500',
    },
    {
      id:        'flood-critical',
      name:      'Critical Flood Zone',
      type:      'flood',
      severity:  'CRITICAL',
      radiusKm:  0.8,
      center:    { lat: userLat - 0.008, lng: userLng + 0.012 },
      message:   'CRITICAL FLOOD ZONE entered. Immediate evacuation recommended. Call 1070.',
      emoji:     '🚨',
      color:     'text-red-500',
    },
  ]

  // Cyclone Caution Zone (ONLY if near coast: East coast lng > 80, West coast lng < 74.5)
  const isNearCoast = (userLng > 80 && userLat < 23) || (userLng < 74.5 && userLat < 20)
  if (isNearCoast) {
    zones.push({
      id:        'cyclone-caution',
      name:      'Cyclone Caution Zone',
      type:      'cyclone',
      severity:  'MEDIUM',
      radiusKm:  3.0,
      center:    { lat: userLat - 0.02,  lng: userLng - 0.015 },
      message:   'You are in a CYCLONE CAUTION ZONE. Secure outdoor objects and stay alert for updates.',
      emoji:     '🌀',
      color:     'text-yellow-500',
    })
  }

  // Earthquake Prone Area (ONLY in seismic zones, e.g. North/Northeast India: lat > 26)
  const isSeismicZone = userLat > 26
  if (isSeismicZone) {
    zones.push({
      id:        'earthquake-prone',
      name:      'Earthquake-Prone Area',
      type:      'earthquake',
      severity:  'MEDIUM',
      radiusKm:  2.5,
      center:    { lat: userLat + 0.01,  lng: userLng - 0.02 },
      message:   'This is an EARTHQUAKE-PRONE area. Know your Drop-Cover-Hold-On procedure.',
      emoji:     '🌍',
      color:     'text-yellow-500',
    })
  }

  return zones
}

/** Returns an array of zone IDs the coord is currently inside. */
export function getActiveZones(lat, lng, zones) {
  return zones.filter(z => haversineKm(lat, lng, z.center.lat, z.center.lng) <= z.radiusKm)
}

/**
 * Geofence watcher class.
 * Usage:
 *   const watcher = new GeofenceWatcher(onEnter)
 *   watcher.update(lat, lng, zones)
 *   watcher.reset()
 */
export class GeofenceWatcher {
  constructor(onEnter) {
    this._onEnter    = onEnter   // callback(zone)
    this._activeIds  = new Set() // zones the user is currently inside
  }

  /** Call this whenever user location changes. */
  update(lat, lng, zones) {
    const nowInside = getActiveZones(lat, lng, zones)

    for (const zone of nowInside) {
      if (!this._activeIds.has(zone.id)) {
        // User just entered this zone
        this._activeIds.add(zone.id)
        this._onEnter(zone)
      }
    }

    // Remove zones user has left
    const nowIds = new Set(nowInside.map(z => z.id))
    for (const id of this._activeIds) {
      if (!nowIds.has(id)) this._activeIds.delete(id)
    }
  }

  reset() { this._activeIds.clear() }

  get active() { return [...this._activeIds] }
}

/** Convenience: fire an in-app notification when a zone is entered. */
export function notifyZoneEntry(zone) {
  const priorityMap = {
    CRITICAL: PRIORITY.CRITICAL,
    HIGH:     PRIORITY.WARNING,
    MEDIUM:   PRIORITY.INFO,
    LOW:      PRIORITY.INFO,
  }
  pushNotification({
    title:    `${zone.emoji} Risk Zone Alert`,
    message:  zone.message,
    priority: priorityMap[zone.severity] ?? PRIORITY.INFO,
    duration: 10000,
  })
}
