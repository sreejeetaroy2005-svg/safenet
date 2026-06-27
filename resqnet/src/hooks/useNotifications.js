/**
 * useNotifications.js
 * React hook to subscribe to the in-app notification queue.
 */
import { useState, useEffect } from 'react'
import { subscribeNotifications, dismissNotification } from '../services/notificationService'

export function useNotifications() {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const unsub = subscribeNotifications(setNotifications)
    return unsub
  }, [])

  return { notifications, dismiss: dismissNotification }
}
