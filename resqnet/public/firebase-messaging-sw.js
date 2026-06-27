// Firebase Cloud Messaging Service Worker
// Replace config values with your own Firebase project credentials

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyAtG6FUa6_doX21LyiJ2xAwouIM__sllzE",
  authDomain: "resqnet-d125d.firebaseapp.com",
  projectId: "resqnet-d125d",
  storageBucket: "resqnet-d125d.firebasestorage.app",
  messagingSenderId: "41108096814",
  appId: "1:41108096814:web:5c65a442c0405c2b685cbf",
  measurementId: "G-CV9E7N2M98"
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
