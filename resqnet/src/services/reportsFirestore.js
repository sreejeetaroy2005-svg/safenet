/**
 * reportsFirestore.js
 * Incident reports CRUD via Firestore.
 *
 * Collection: /incident_reports
 * Fields: userId, userName, type, title, description,
 *         location, photoUrl, audioUrl, status, timestamp
 */
import {
  collection, addDoc, updateDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp, limit,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from './firebase'

const COL = 'incident_reports'

/** Upload a file to Firebase Storage and return its download URL */
async function uploadFile(file, path) {
  if (!file) return null
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

/** Submit a new incident report (with optional photo/audio upload) */
export async function submitReport({ userId, userName, type, title, description, location, photoFile, audioBlob }) {
  const timestamp = Date.now()
  const photoUrl = photoFile  ? await uploadFile(photoFile,  `reports/${userId}/${timestamp}_photo`) : null
  const audioUrl = audioBlob  ? await uploadFile(audioBlob,  `reports/${userId}/${timestamp}_audio.webm`) : null

  const ref2 = await addDoc(collection(db, COL), {
    userId, userName, type, title, description, location,
    photoUrl, audioUrl,
    status:    'pending',
    timestamp: serverTimestamp(),
  })
  return ref2.id
}

/** Subscribe to all reports (admin, real-time) */
export function subscribeAllReports(callback) {
  const q = query(collection(db, COL), orderBy('timestamp', 'desc'), limit(100))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data(), time: d.data().timestamp?.toMillis?.() || Date.now() })))
  })
}

/** Update report status */
export async function updateReportStatus(id, status) {
  await updateDoc(doc(db, COL, id), { status })
}
