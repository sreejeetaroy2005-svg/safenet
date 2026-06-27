/**
 * simulationService.js
 * Simulates real-time incoming SOS alerts and incident reports
 * using interval-based updates (WebSocket mock).
 */

const MOCK_USERS = ['Priya Sharma', 'Rahul Verma', 'Anita Nair', 'Suresh Kumar', 'Deepa Menon']
const MOCK_LOCATIONS = [
  { lat: 20.5937, lng: 78.9629 },
  { lat: 19.0760, lng: 72.8777 },
  { lat: 13.0827, lng: 80.2707 },
  { lat: 22.5726, lng: 88.3639 },
  { lat: 17.3850, lng: 78.4867 },
]
const MOCK_REPORT_TYPES = ['flood', 'fire', 'earthquake', 'accident']
const MOCK_REPORT_TITLES = [
  'Water logging on main road',
  'Building fire reported',
  'Ground shaking felt',
  'Road accident near bridge',
  'Flash flood in low-lying area',
]

let sosInterval = null
let reportInterval = null

/**
 * Start simulating incoming SOS alerts.
 * @param {function} onAlert - called with new alert object
 * @param {number} intervalMs - how often to fire (default 45s)
 */
export function startSosSimulation(onAlert, intervalMs = 45000) {
  stopSosSimulation()
  sosInterval = setInterval(() => {
    const loc = MOCK_LOCATIONS[Math.floor(Math.random() * MOCK_LOCATIONS.length)]
    onAlert({
      user: MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)],
      userId: `sim_${Date.now()}`,
      location: { ...loc, accuracy: Math.random() * 50 + 5 },
      message: 'Emergency SOS activated',
      audioBlob: null,
      simulated: true,
    })
  }, intervalMs)
}

export function stopSosSimulation() {
  if (sosInterval) { clearInterval(sosInterval); sosInterval = null }
}

/**
 * Start simulating incoming incident reports.
 * @param {function} onReport - called with new report object
 * @param {number} intervalMs
 */
export function startReportSimulation(onReport, intervalMs = 60000) {
  stopReportSimulation()
  reportInterval = setInterval(() => {
    const type = MOCK_REPORT_TYPES[Math.floor(Math.random() * MOCK_REPORT_TYPES.length)]
    const loc = MOCK_LOCATIONS[Math.floor(Math.random() * MOCK_LOCATIONS.length)]
    onReport({
      type,
      title: MOCK_REPORT_TITLES[Math.floor(Math.random() * MOCK_REPORT_TITLES.length)],
      description: 'Auto-reported via field sensor network.',
      location: loc,
      simulated: true,
    })
  }, intervalMs)
}

export function stopReportSimulation() {
  if (reportInterval) { clearInterval(reportInterval); reportInterval = null }
}
