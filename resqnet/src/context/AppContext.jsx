/**
 * AppContext.jsx
 * Global state — Firebase-powered with localStorage fallback.
 *
 * Firebase is used when configured (firebaseConfig has real values).
 * Falls back to localStorage when Firebase is not yet configured,
 * so the app always works during development.
 */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { pushNotification, PRIORITY } from '../services/notificationService'
import { startSosSimulation, stopSosSimulation, startReportSimulation, stopReportSimulation } from '../services/simulationService'
import { initOfflineSync, hasPendingSync } from '../services/offlineSync'
import { getLang, setLang, LANGUAGES } from '../services/i18n'

// ── Firebase feature flag ────────────────────────────────────────
// Set to true once you've added your Firebase config in firebase.js
const FIREBASE_ENABLED = import.meta.env.VITE_FIREBASE_ENABLED === 'true'

// Firebase service references (populated lazily inside effects)
// eslint-disable-next-line no-unused-vars
let _fbPlaceholder

const AppContext = createContext(null)
export { AppContext }

// ── localStorage helpers ─────────────────────────────────────────
const ls = {
  get: (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def } catch { return def } },
  set: (k, v)   => localStorage.setItem(k, JSON.stringify(v)),
  del: (k)      => localStorage.removeItem(k),
}

export function AppProvider({ children }) {
  const [user,       setUser]       = useState(() => ls.get('safenet_user', null))
  const [darkMode,   setDarkMode]   = useState(() => ls.get('safenet_dark', false))
  const [lang,       setLangState]  = useState(getLang)
  const [sosStage,   setSosStage]   = useState('idle')
  const [location,   setLocation]   = useState(null)
  const [pendingSync, setPendingSync] = useState(false)
  // Tour is shown only for guest logins and new registrations
  const [showTour,   setShowTour]   = useState(false)

  const [broadcasts, setBroadcasts] = useState(() => ls.get('safenet_broadcasts', [
    { id: 1, title: 'Flood Warning', message: 'Heavy rainfall expected in coastal areas. Stay indoors.', type: 'warning', time: Date.now() - 3600000 },
  ]))
  const [reports,    setReports]    = useState(() => ls.get('safenet_reports', []))
  const [sosAlerts,  setSosAlerts]  = useState(() => ls.get('safenet_sos', []))

  // Firestore unsubscribe refs
  const unsubRefs = useRef([])

  // ── Dark mode ──────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    ls.set('safenet_dark', darkMode)
  }, [darkMode])

  // ── Persist to localStorage (always, as cache) ─────────────────
  useEffect(() => { if (user) ls.set('safenet_user', user); else ls.del('safenet_user') }, [user])
  useEffect(() => { ls.set('safenet_reports',    reports)    }, [reports])
  useEffect(() => { ls.set('safenet_sos',        sosAlerts)  }, [sosAlerts])
  useEffect(() => { ls.set('safenet_broadcasts', broadcasts) }, [broadcasts])

  // ── Offline sync indicator ─────────────────────────────────────
  useEffect(() => {
    initOfflineSync()
    const check = () => setPendingSync(hasPendingSync())
    check()
    window.addEventListener('online',  check)
    window.addEventListener('offline', check)
    return () => { window.removeEventListener('online', check); window.removeEventListener('offline', check) }
  }, [])

  // ── Firebase real-time subscriptions ──────────────────────────
  useEffect(() => {
    if (!FIREBASE_ENABLED || !user) return
    let unsubs = []
    Promise.all([
      import('../services/sosFirestore'),
      import('../services/reportsFirestore'),
      import('../services/broadcastsFirestore'),
    ]).then(([sos, rep, brd]) => {
      unsubs = [
        sos.subscribeAllSos(setSosAlerts),
        rep.subscribeAllReports(setReports),
        brd.subscribeBroadcasts(setBroadcasts),
      ]
      unsubRefs.current = unsubs
    })
    return () => unsubRefs.current.forEach(fn => fn?.())
  }, [user?.uid, FIREBASE_ENABLED])

  // ── Firebase auth state listener ──────────────────────────────
  useEffect(() => {
    if (!FIREBASE_ENABLED) return
    let unsub
    import('../services/authService').then(m => { unsub = m.subscribeAuth(setUser) })
    return () => unsub?.()
  }, [FIREBASE_ENABLED])

  // ── Simulation (admin only, when Firebase not enabled) ─────────
  useEffect(() => {
    if (FIREBASE_ENABLED) return   // real data comes from Firestore
    if (user?.role === 'admin') {
      startSosSimulation(alert => addSosAlert(alert), 40000)
      startReportSimulation(report => addReport(report), 55000)
    }
    return () => { stopSosSimulation(); stopReportSimulation() }
  }, [user?.role])

  // ── Auth actions ───────────────────────────────────────────────
  const login = useCallback(async (credOrUser) => {
    // If it's already a user object (guest, admin, localStorage user), set directly
    if (!FIREBASE_ENABLED || credOrUser.role || credOrUser.id) {
      // Show tour for guest users
      if (credOrUser.id === 'guest') setShowTour(true)
      setUser(credOrUser)
      return
    }
    const { loginUser } = await import('../services/authService')
    const profile = await loginUser(credOrUser.email, credOrUser.password)
    setUser(profile)
    return profile
  }, [])

  const register = useCallback(async ({ name, email, password }) => {
    if (!FIREBASE_ENABLED) {
      const u = { id: Date.now().toString(), name, email, password, role: 'user' }
      const users = ls.get('safenet_users', [])
      ls.set('safenet_users', [...users, u])
      setUser(u)
      // Show tour for new registrations
      setShowTour(true)
      return u
    }
    const { registerUser } = await import('../services/authService')
    const profile = await registerUser({ name, email, password })
    setUser(profile)
    // Show tour for new Firebase registrations
    setShowTour(true)
    return profile
  }, [])

  const logout = useCallback(async () => {
    if (FIREBASE_ENABLED) {
      const { logoutUser } = await import('../services/authService')
      await logoutUser()
    }
    setUser(null)
    setSosStage('idle')
    stopSosSimulation()
    stopReportSimulation()
    unsubRefs.current.forEach(fn => fn?.())
  }, [])

  // ── Data actions ───────────────────────────────────────────────
  const addSosAlert = useCallback((alert) => {
    const newAlert = { ...alert, id: alert.id || Date.now().toString(), time: alert.time || Date.now(), status: alert.status || 'active' }
    setSosAlerts(prev => {
      if (prev.find(a => a.id === newAlert.id)) return prev
      return [newAlert, ...prev]
    })
    pushNotification({ title: '🆘 SOS Alert', message: `${alert.user || 'User'} sent an emergency alert`, priority: PRIORITY.CRITICAL, duration: 8000 })
    // Write to Firestore when enabled
    if (FIREBASE_ENABLED) {
      import('../services/sosFirestore').then(({ sendSosAlert }) => {
        sendSosAlert(newAlert).catch(e => console.warn('[SAFENET] Firestore SOS write failed:', e.message))
      })
    }
    return newAlert
  }, [])

  const addReport = useCallback((report) => {
    const newReport = { ...report, id: report.id || Date.now().toString(), time: report.time || Date.now(), status: report.status || 'pending' }
    setReports(prev => {
      if (prev.find(r => r.id === newReport.id)) return prev
      return [newReport, ...prev]
    })
    // Write to Firestore when enabled
    if (FIREBASE_ENABLED) {
      import('../services/reportsFirestore').then(({ submitReport }) => {
        submitReport({
          userId:      newReport.userId || 'guest',
          userName:    newReport.user   || 'User',
          type:        newReport.type,
          title:       newReport.title,
          description: newReport.description,
          location:    newReport.location,
        }).catch(e => console.warn('[SAFENET] Firestore report write failed:', e.message))
      })
    }
    return newReport
  }, [])

  const addBroadcast = useCallback((broadcast) => {
    const newBroadcast = { ...broadcast, id: broadcast.id || Date.now().toString(), time: broadcast.time || Date.now() }
    setBroadcasts(prev => {
      if (prev.find(b => b.id === newBroadcast.id)) return prev
      return [newBroadcast, ...prev]
    })
    pushNotification({
      title:    broadcast.title,
      message:  broadcast.message,
      priority: broadcast.type === 'evacuation' ? PRIORITY.CRITICAL : PRIORITY.WARNING,
      duration: 6000,
    })
    // Write to Firestore when enabled
    if (FIREBASE_ENABLED) {
      import('../services/broadcastsFirestore').then(({ sendBroadcast }) => {
        sendBroadcast({ ...newBroadcast, adminId: 'admin' }).catch(e => console.warn('[SAFENET] Firestore broadcast write failed:', e.message))
      })
    }
    return newBroadcast
  }, [])

  const changeLang = useCallback((code) => {
    setLang(code)
    setLangState(code)
  }, [])

  const updateSosStatus = useCallback(async (id, status) => {
    if (FIREBASE_ENABLED) {
      const { updateSosStatus: fbUpdate } = await import('../services/sosFirestore')
      await fbUpdate(id, status)
    }
    setSosAlerts(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }, [])

  return (
    <AppContext.Provider value={{
      user, login, register, logout,
      darkMode, setDarkMode,
      sosStage, setSosStage,
      location, setLocation,
      broadcasts, addBroadcast,
      reports, addReport,
      sosAlerts, addSosAlert, updateSosStatus,
      pendingSync,
      lang, changeLang,
      firebaseEnabled: FIREBASE_ENABLED,
      showTour, setShowTour,
    }}>
      {children}
    </AppContext.Provider>
  )
}
