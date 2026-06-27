/**
 * sheltersFirestore.js
 * Shelter data from Firestore with real-time availability updates.
 *
 * Collection: /shelters
 * Fields: name, type, location {lat,lng}, capacity, occupied,
 *         available (bool), address, contact
 */
import {
  collection, onSnapshot, query,
  orderBy, getDocs, doc, updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'

const COL = 'shelters'

/** Subscribe to all shelters (real-time) */
export function subscribeShelters(callback) {
  const q = query(collection(db, COL), orderBy('name'))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

/** One-time fetch (for offline fallback) */
export async function fetchShelters() {
  const snap = await getDocs(collection(db, COL))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/** Admin: update shelter availability */
export async function updateShelterAvailability(id, available, occupied) {
  await updateDoc(doc(db, COL, id), { available, occupied })
}

/**
 * Seed default shelters (run once from admin or Firebase console).
 * Call seedShelters(centerLat, centerLng) to populate near a location.
 */
export async function seedShelters(lat = 20.5937, lng = 78.9629) {
  const { addDoc } = await import('firebase/firestore')
  const defaults = [
    { name: 'City Relief Camp',   type: 'Relief Camp',       capacity: 500, occupied: 120, available: true,  location: { lat: lat + 0.005, lng: lng + 0.007 }, address: 'Near City Hall', contact: '1078' },
    { name: 'St. Mary School',    type: 'School',            capacity: 300, occupied: 80,  available: true,  location: { lat: lat - 0.006, lng: lng + 0.009 }, address: 'Church Road',    contact: '100' },
    { name: 'District Hospital',  type: 'Hospital',          capacity: 200, occupied: 190, available: true,  location: { lat: lat + 0.009, lng: lng - 0.005 }, address: 'Hospital Road',  contact: '108' },
    { name: 'Community Hall',     type: 'Community Center',  capacity: 200, occupied: 200, available: false, location: { lat: lat - 0.010, lng: lng - 0.008 }, address: 'Main Street',    contact: '100' },
  ]
  for (const s of defaults) await addDoc(collection(db, COL), s)
}
