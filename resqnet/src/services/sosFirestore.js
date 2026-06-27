/**
 * sosFirestore.js
 * Real-time SOS alert CRUD via Firestore.
 *
 * Collection: /sos_alerts
 * Document fields:
 *   userId, userName, location {lat,lng,accuracy},
 *   status (pending|received|responded|resolved),
 *   emergencyType, message, audioUrl, timestamp, updatedAt
 */
import {
  collection, addDoc, updateDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp, where, limit,
} from 'firebase/firestore'
import { db } from './firebase'

const COL = 'sos_alerts'

/** Send a new SOS alert to Firestore */
export async function sendSosAlert(payload) {
  const ref = await addDoc(collection(db, COL), {
    ...payload,
    status:    'pending',
    timestamp: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

/** Update SOS status (admin action) */
export async function updateSosStatus(id, status) {
  await updateDoc(doc(db, COL, id), { status, updatedAt: serverTimestamp() })
}

/**
 * Subscribe to all active SOS alerts (admin).
 * @param {function} callback - called with array of alerts
 */
export function subscribeAllSos(callback) {
  const q = query(collection(db, COL), orderBy('timestamp', 'desc'), limit(50))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data(), time: d.data().timestamp?.toMillis?.() || Date.now() })))
  })
}

/**
 * Subscribe to a specific user's SOS alerts.
 */
export function subscribeUserSos(userId, callback) {
  const q = query(collection(db, COL), where('userId', '==', userId), orderBy('timestamp', 'desc'), limit(10))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data(), time: d.data().timestamp?.toMillis?.() || Date.now() })))
  })
}
