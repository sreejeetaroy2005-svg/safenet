/**
 * sosService.js
 * SOS state machine and offline queue logic.
 * States: idle → locating → sending → sent | failed
 */

const QUEUE_KEY = 'safenet_sos_queue'

/** Add an SOS alert to the offline queue */
export function queueSosAlert(alert) {
  const queue = getPendingQueue()
  queue.push({ ...alert, queuedAt: Date.now() })
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

/** Get all queued (unsent) SOS alerts */
export function getPendingQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
  } catch {
    return []
  }
}

/** Clear the offline queue after successful send */
export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY)
}

/** Check if device is online */
export function isOnline() {
  return navigator.onLine
}

/**
 * Attempt to flush queued SOS alerts.
 * Calls onFlush(alert) for each queued item.
 * Returns number of flushed alerts.
 */
export function flushQueue(onFlush) {
  if (!isOnline()) return 0
  const queue = getPendingQueue()
  if (!queue.length) return 0
  queue.forEach(alert => onFlush(alert))
  clearQueue()
  return queue.length
}
