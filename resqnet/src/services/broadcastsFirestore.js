/**
 * broadcastsFirestore.js
 * Admin emergency broadcasts via Firestore.
 *
 * Collection: /broadcasts
 * Fields: title, message, type (warning|evacuation|info), adminId, timestamp
 */
import {
  collection, addDoc, onSnapshot,
  query, orderBy, serverTimestamp, limit,
} from 'firebase/firestore'
import { db } from './firebase'

const COL = 'broadcasts'

/** Admin sends a broadcast */
export async function sendBroadcast({ title, message, type, adminId }) {
  const ref = await addDoc(collection(db, COL), {
    title, message, type, adminId,
    timestamp: serverTimestamp(),
  })
  return ref.id
}

/** Subscribe to all broadcasts (real-time, newest first) */
export function subscribeBroadcasts(callback) {
  const q = query(collection(db, COL), orderBy('timestamp', 'desc'), limit(50))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data(), time: d.data().timestamp?.toMillis?.() || Date.now() })))
  })
}
