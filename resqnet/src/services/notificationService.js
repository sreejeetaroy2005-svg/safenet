/**
 * notificationService.js
 * In-app notification queue with priority levels.
 * Priority: critical > warning > info
 */

let listeners = []
let queue = []
let idCounter = 0

export const PRIORITY = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  INFO: 'info',
}

/** Push a notification to the queue and notify listeners */
export function pushNotification({ title, message, priority = PRIORITY.INFO, duration = 4000 }) {
  const notification = {
    id: ++idCounter,
    title,
    message,
    priority,
    duration,
    time: Date.now(),
  }
  queue = [notification, ...queue].slice(0, 20) // keep last 20
  listeners.forEach(fn => fn([...queue]))
  return notification.id
}

/** Subscribe to notification queue changes */
export function subscribeNotifications(fn) {
  listeners.push(fn)
  fn([...queue])
  return () => { listeners = listeners.filter(l => l !== fn) }
}

/** Dismiss a notification by id */
export function dismissNotification(id) {
  queue = queue.filter(n => n.id !== id)
  listeners.forEach(fn => fn([...queue]))
}

export function getQueue() {
  return [...queue]
}
