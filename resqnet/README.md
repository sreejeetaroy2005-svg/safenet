# RESQNET — Disaster Response & Emergency Network

A full-scale, AI-powered disaster management application built with React + Tailwind CSS, convertible to an Android APK via Capacitor.

---

## Features

### User
- **SOS Emergency** — one-tap alert with 8 emergency categories (Medical, Flood, Fire, Earthquake, Trapped, Missing, Supplies, Other), live GPS tracking, voice message attachment, offline queue
- **Disaster Map** — real-time layer map showing shelters, active SOS alerts, hazard markers, and incident reports with filter controls
- **Crowdsourced Hazards** — report flooded roads, fire zones, blocked roads, fallen trees, unsafe buildings with community voting
- **Incident Reporting** — submit typed reports with photo, voice note, and auto-detected location
- **AI Damage Assessment** — upload a photo for instant AI-simulated damage severity analysis (Critical / Severe / Moderate / Minor)
- **Rescue Dashboard** — field operations panel for rescue teams showing priority-sorted SOS requests, distance, accept/complete missions
- **AI Chatbot** — rule-based emergency assistant covering first aid, evacuation, flood/fire/earthquake safety, shelter finding
- **Emergency Helplines** — click-to-call directory (Police, Ambulance, Fire, NDMA, Flood Control, etc.)
- **Broadcasts** — real-time emergency alerts from admin shown as in-app banners
- **Voice Commands** — say "Send SOS", "Find shelter", "Call ambulance" using browser Speech API
- **Multilingual** — English, Hindi, Tamil with instant switching
- **Low Power Mode** — disables animations and reduces GPS polling for emergency battery situations
- **Offline Support** — SOS and reports queue locally and auto-sync when reconnected
- **Dark Mode** — full light/dark theme with persistent preference

### Admin
- **Live SOS Feed** — real-time incoming alerts sorted by priority with expandable GPS details
- **SOS Status Tracking** — Pending → Received → Responded → Resolved workflow
- **Incident Reports** — filterable by disaster type with photo/audio indicators
- **Emergency Broadcast** — send Warning / Evacuation / Info alerts to all users instantly
- **User Management** — view all registered users

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| Routing | React Router v6 |
| Map | Leaflet + React-Leaflet (OpenStreetMap) |
| Icons | Lucide React |
| Mobile/APK | Capacitor v7 |
| Backend (optional) | Firebase (Auth, Firestore, Storage, FCM) |
| State | React Context + localStorage |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Install & Run

```bash
cd resqnet
npm install
npm run dev
```

Open **http://localhost:5173**

### Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@resqnet.com` | `admin123` |
| User | Register any account | any password |
| Guest | — | tap "Continue as Guest" |

---

## Project Structure

```
resqnet/
├── public/
│   └── firebase-messaging-sw.js   # FCM service worker (configure before use)
├── src/
│   ├── components/
│   │   ├── BottomNav.jsx           # Floating glass nav bar
│   │   ├── BroadcastBanner.jsx     # Top alert banner
│   │   ├── LowPowerMode.jsx        # Battery optimization toggle
│   │   ├── NotificationToast.jsx   # Priority notification toasts
│   │   ├── OfflineBanner.jsx       # Offline status indicator
│   │   └── VoiceCommandButton.jsx  # Speech recognition mic button
│   ├── context/
│   │   └── AppContext.jsx          # Global state (auth, SOS, lang, dark mode)
│   ├── hooks/
│   │   ├── useLocation.js          # GPS hook with live watch
│   │   ├── useNotifications.js     # Notification queue subscriber
│   │   └── useOnlineStatus.js      # Online/offline detector
│   ├── pages/
│   │   ├── AIDamageAssessment.jsx  # Photo upload + AI analysis
│   │   ├── AdminDashboard.jsx      # Admin control center
│   │   ├── Auth.jsx                # Role picker + login/register
│   │   ├── Broadcasts.jsx          # Emergency broadcast list
│   │   ├── Chat.jsx                # AI emergency chatbot
│   │   ├── Helplines.jsx           # Click-to-call directory
│   │   ├── Home.jsx                # Dashboard with SOS button
│   │   ├── MapView.jsx             # Disaster map with layers
│   │   ├── NewReport.jsx           # Incident report form
│   │   ├── Profile.jsx             # Settings, language, low power
│   │   ├── Reports.jsx             # Report list
│   │   ├── RescueDashboard.jsx     # Field operations panel
│   │   └── SOS.jsx                 # Emergency SOS screen
│   └── services/
│       ├── aiDamageService.js      # Mock AI damage assessment
│       ├── authService.js          # Firebase auth (optional)
│       ├── broadcastsFirestore.js  # Firebase broadcasts (optional)
│       ├── fcmService.js           # Push notifications (optional)
│       ├── firebase.js             # Firebase init (add your config here)
│       ├── hazardService.js        # Crowdsourced hazard markers
│       ├── i18n.js                 # EN/HI/TA translations
│       ├── locationService.js      # GPS with caching + fallback
│       ├── notificationService.js  # In-app notification queue
│       ├── offlineSync.js          # Offline queue + auto-sync
│       ├── reportsFirestore.js     # Firebase reports (optional)
│       ├── simulationService.js    # Real-time data simulation
│       ├── sosCategories.js        # SOS type definitions + priority
│       ├── sosFirestore.js         # Firebase SOS (optional)
│       └── voiceCommandService.js  # Speech recognition commands
├── android/                        # Capacitor Android project
├── capacitor.config.json
├── FIREBASE_SETUP.md               # Firebase + Play Store guide
└── vite.config.js
```

---

## Firebase Integration (Optional)

The app runs fully on localStorage by default. To enable real-time Firebase backend:

1. Create a Firebase project at https://console.firebase.google.com
2. Add your config to `src/services/firebase.js`
3. Set `FIREBASE_ENABLED = true` in `src/context/AppContext.jsx`

See **FIREBASE_SETUP.md** for full instructions including Firestore rules, FCM setup, and Play Store deployment.

---

## Build APK

```bash
# Build web app
npm run build

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**

For Play Store: **Build → Generate Signed Bundle / APK → Android App Bundle**

---

## Offline Support

- SOS alerts and reports are queued in localStorage when offline
- Auto-synced to Firebase (or in-memory) when connectivity is restored
- Last known GPS location is cached for 5 minutes
- A yellow banner indicates offline mode

---

## Voice Commands

Say any of these while the mic is active on the SOS screen:

| Command | Action |
|---|---|
| "Send SOS" / "Emergency" | Navigate to SOS screen |
| "Find shelter" | Open map |
| "Call ambulance" | Dial 108 |
| "Call police" | Dial 100 |
| "Report fire" | Open new report |
| "Open chat" | Open AI assistant |

---

## License

MIT — built for humanitarian use. Free to deploy, modify, and distribute.
