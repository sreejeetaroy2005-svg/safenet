// Firebase Cloud Messaging Service Worker
// Values below are injected at build time from .env.local — do NOT hardcode secrets here.

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "__VITE_FIREBASE_API_KEY__",
  authDomain: "__VITE_FIREBASE_AUTH_DOMAIN__",
  projectId: "__VITE_FIREBASE_PROJECT_ID__",
  storageBucket: "__VITE_FIREBASE_STORAGE_BUCKET__",
  messagingSenderId: "__VITE_FIREBASE_MESSAGING_SENDER_ID__",
  appId: "__VITE_FIREBASE_APP_ID__",
});

const messaging = firebase.messaging();

// Handle background push notifications
messaging.onBackgroundMessage(payload => {
  const { title, body } = payload.notification || {}
  self.registration.showNotification(title || 'RESQNET Alert', {
    body:  body || '',
    icon:  '/icon-192.png',
    badge: '/icon-72.png',
    vibrate: [200, 100, 200],
    data:  payload.data || {},
  });
});
