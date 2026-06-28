/**
 * offlineSync.js
 * Queues SOS alerts and reports locally when offline.
 * Auto-syncs to Firestore when connectivity is restored.
 */
import { sendSosAlert }   from './sosFirestore'
import { submitReport }   from './reportsFirestore'
import { pushNotification, PRIORITY } from './notificationService'

const SOS_QUEUE_KEY    = 'safenet_sos_queue'
const REPORT_QUEUE_KEY = 'safenet_report_queue'

// ── Queue helpers ────────────────────────────────────────────────
function readQueue(key)        { try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] } }
function writeQueue(key, data) { localStorage.setItem(key, JSON.stringify(data)) }
function clearQueue(key)       { localStorage.removeItem(key) }

export function queueSosOffline(payload)    { writeQueue(SOS_QUEUE_KEY,    [...readQueue(SOS_QUEUE_KEY),    { ...payload, queuedAt: Date.now() }]) }
export function queueReportOffline(payload) { writeQueue(REPORT_QUEUE_KEY, [...readQueue(REPORT_QUEUE_KEY), { ...payload, queuedAt: Date.now() }]) }

export function getPendingSosCount()    { return readQueue(SOS_QUEUE_KEY).length }
export function getPendingReportCount() { return readQueue(REPORT_QUEUE_KEY).length }
export function hasPendingSync()        { return getPendingSosCount() > 0 || getPendingReportCount() > 0 }

// ── Flush on reconnect ───────────────────────────────────────────
export async function flushOfflineQueue() {
  if (!navigator.onLine) return

  const sosQueue    = readQueue(SOS_QUEUE_KEY)
  const reportQueue = readQueue(REPORT_QUEUE_KEY)
  let flushed = 0

  for (const item of sosQueue) {
    try { await sendSosAlert(item); flushed++ } catch { /* keep in queue */ }
  }
  if (flushed === sosQueue.length) clearQueue(SOS_QUEUE_KEY)

  let reportFlushed = 0
  for (const item of reportQueue) {
    try { await submitReport(item); reportFlushed++ } catch {}
  }
  if (reportFlushed === reportQueue.length) clearQueue(REPORT_QUEUE_KEY)

  const total = flushed + reportFlushed
  if (total > 0) {
    pushNotification({
      title:    'Back Online',
      message:  `${total} queued item${total > 1 ? 's' : ''} synced to server.`,
      priority: PRIORITY.WARNING,
    })
  }
}

/** Call once on app start — listens for online event to flush */
export function initOfflineSync() {
  window.addEventListener('online', flushOfflineQueue)
  // Also try immediately in case we're already online with pending items
  if (navigator.onLine) flushOfflineQueue()
}
