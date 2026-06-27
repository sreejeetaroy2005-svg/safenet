/**
 * firebase.js
 * Central Firebase initialization.
 * Credentials are read from .env.local — never hardcode them here.
 * Copy .env to .env.local and fill in your values.
 */

// Config read from Vite environment variables (.env.local)
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

import { initializeApp, getApps } from 'firebase/app'
import { getAuth }                 from 'firebase/auth'
import { getFirestore }            from 'firebase/firestore'
import { getStorage }              from 'firebase/storage'
import { getMessaging, isSupported } from 'firebase/messaging'

// Prevent double-init in hot-reload
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

export const auth      = getAuth(app)
export const db        = getFirestore(app)
export const storage   = getStorage(app)

// FCM only works in browsers that support service workers
export const getMessagingInstance = async () => {
  const supported = await isSupported()
  return supported ? getMessaging(app) : null
}

export default app
