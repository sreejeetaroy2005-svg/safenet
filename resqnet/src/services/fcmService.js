/**
 * fcmService.js
 * Firebase Cloud Messaging — push notification setup.
 *
 * SETUP STEPS:
 * 1. In Firebase Console → Project Settings → Cloud Messaging → Web Push Certificates
 *    Generate a VAPID key pair and paste the public key below.
 * 2. Create public/firebase-messaging-sw.js (see bottom of this file for template).
 * 3. Store FCM tokens in Firestore /users/{uid}/fcmToken for server-side targeting.
 */
import { getToken, onMessage } from 'firebase/messaging'
import { doc, updateDoc }      from 'firebase/firestore'
import { getMessagingInstance } from './firebase'
import { db }                   from './firebase'

// VAPID key from .env.local
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

/**
 * Request notification permission and get FCM token.
 * Saves token to Firestore for the current user.
 */
export async function initFCM(userId) {
  try {
    const messaging = await getMessagingInstance()
    if (!messaging) return null

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const token = await getToken(messaging, { vapidKey: VAPID_KEY })
    if (token && userId) {
      await updateDoc(doc(db, 'users', userId), { fcmToken: token })
    }
    return token
  } catch (err) {
    console.warn('FCM init failed:', err.message)
    return null
  }
}

/**
 * Listen for foreground push messages.
 * @param {function} onNotification - called with { title, body, data }
 */
export async function onForegroundMessage(onNotification) {
  const messaging = await getMessagingInstance()
  if (!messaging) return () => {}
  return onMessage(messaging, (payload) => {
    onNotification({
      title: payload.notification?.title || 'RESQNET Alert',
      body:  payload.notification?.body  || '',
      data:  payload.data || {},
    })
  })
}

/* ─────────────────────────────────────────────────────────────────────────────
   SERVICE WORKER TEMPLATE
   Create this file at: resqnet/public/firebase-messaging-sw.js
   ─────────────────────────────────────────────────────────────────────────────

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  self.registration.showNotification(
    payload.notification.title,
    { body: payload.notification.body, icon: '/icon-192.png', badge: '/icon-72.png' }
  );
});

─────────────────────────────────────────────────────────────────────────────── */
