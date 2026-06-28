<div align="center">

<br/>

# 🛡️ SafeNet

### Disaster Response & Emergency Network
*When every second counts — SafeNet responds.*

<br/>

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Capacitor](https://img.shields.io/badge/Capacitor-Android-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com)
[![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://render.com)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

<br/>

> **SafeNet** is a full-stack, production-ready disaster management platform —  
> connecting citizens, rescue teams, and command centers in real time.  
> Built mobile-first. Works offline. Deploys anywhere.

<br/>

---

</div>

## 📋 Table of Contents

- [🌟 Features](#-features)
- [🏗️ Architecture](#%EF%B8%8F-architecture)
- [🛠️ Tech Stack](#%EF%B8%8F-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [🌐 Deployment](#-deployment)
- [📁 Project Structure](#-project-structure)
- [🔐 Environment Variables](#-environment-variables)
- [📱 Android Build](#-android-build)

---

## 🌟 Features

### 🆘 One-Tap SOS Emergency
```
Tap → GPS Lock → Alert Sent → Help Notified
         < 3 seconds
```
- **8 emergency categories** — Medical, Flood, Fire, Earthquake, Trapped, Missing, Supplies, Other
- **Live GPS tracking** with accuracy indicator — coordinates sent to admin in real time
- **Voice message** recording attached to every SOS
- **Offline queue** — SOS saved locally, auto-synced when connection restores
- **Priority scoring** — admins see alerts ranked by severity

---

### 🗺️ Live Disaster Map
- Real-time SOS alert pins with status colours
- **Nearby shelters** with capacity and availability
- **Crowdsourced hazard markers** — flooded roads, fire zones, fallen trees, downed power lines
- Risk zone overlays — flood, cyclone, earthquake, AQI
- One-tap **Google Maps navigation** to any shelter or victim

---

### ⚠️ Early Warning Dashboard
| Source | Data |
|--------|------|
| USGS Feed | Live global earthquakes (M2.5+) |
| OpenWeatherMap | Wind, rainfall, heat, cold wave alerts |
| IMD Mock | Cyclone advisories (Bay of Bengal, Arabian Sea) |
| CWC Mock | River flood alerts (Godavari, Brahmaputra, Yamuna) |
| CPCB Mock | AQI warnings (Delhi, Mumbai) |

- **Geofence filtering** — only shows alerts within your location radius
- Cyclone zones auto-appear only near coastal regions
- Risk severity: `CRITICAL` → `HIGH` → `MEDIUM` → `LOW`

---

### 🤖 AI Assistant (Gemini + OpenRouter)
- Powered by **Google Gemini 2.0 Flash** with **OpenRouter** as fallback
- **9 free LLM models** tried in sequence — virtually never goes offline
- Responds in **English, Hindi, Tamil**
- Covers: first aid, CPR, evacuation, flood/fire/earthquake safety, emergency kits, risk zones
- Built-in **rule-based offline fallback** — works with zero API keys

---

### 📸 AI Damage Assessment
- Upload any photo of a damaged structure
- Vision AI classifies: **Minor → Moderate → Severe → Critical**
- Returns: confidence score, rescue priority, risk factors list
- **4 fallback JSON parsers** — robust against malformed model responses
- Submit directly as an incident report with one tap

---

### 📋 Emergency Plan Builder
- Guided household disaster plan — family contacts, meeting point, evacuation routes
- **Auto-fills GPS coordinates** for meeting point
- **Suggests nearest shelter** based on live location
- Medical profiles, pet records, utility shutoff checklist
- **Export as `.txt`** for offline reference
- Completion score tracks how prepared your household is

---

### 📦 Smart Resource Inventory
- Track water, food, medical, tools, documents with quantities and expiry dates
- **Location-aware targets** — detects active flood/cyclone/AQI zones and automatically increases recommended stock
- Expiry alerts — red for expired, orange for < 30 days
- Overall supply readiness percentage

---

### 📡 Rescue Team Dashboard
- Field volunteers see active SOS alerts filtered to their **customisable response radius** (5km – 200km)
- Sorted by **proximity** — closest victims first
- Accept, respond, resolve workflow
- One-tap GPS navigation to victim location

---

### 🛡️ Admin Control Center
- Real-time SOS feed with live status updates
- Incident report management with type filters
- **Emergency broadcast** system — warning / evacuation / info types
- Registered user registry
- All data synced via **Firestore real-time listeners**

---

### ⚡ More
| Feature | Detail |
|---------|--------|
| 🌙 Dark / Light Mode | System-aware, persisted |
| 🌐 Multilingual | English · हिंदी · தமிழ் |
| 🔋 Low Power Mode | Disables all animations, reduces GPS polling |
| 📴 Offline Mode | Full offline queue with auto-sync banner |
| 🔔 Push Notifications | Firebase Cloud Messaging (FCM) |
| 🎙️ Voice Commands | SOS voice activation |
| 🎯 Feature Tour | 10-step onboarding for new users |
| 📲 Android APK | Capacitor native build |
| 🔐 Secure Backend | API keys proxied via Render — never exposed in browser |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     BROWSER / APK                        │
│                                                          │
│   React 19 + Vite  ──►  Firebase SDK (Auth/Firestore)   │
│        │                     │                          │
│        │                 Firestore DB                   │
│        │                 (real-time)                    │
│        │                                                │
│        ▼                                                │
│   VITE_API_URL  ──────────────────────────────────────► │
│                        │                                │
└────────────────────────┼────────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │   RENDER BACKEND     │
              │   (Express server)   │
              │                      │
              │  POST /api/chat   ──►  OpenRouter AI
              │  POST /api/damage ──►  OpenRouter Vision
              │  GET  /api/weather ─►  OpenWeatherMap
              │                      │
              │  Keys: server-side   │
              │        only ✓        │
              └──────────────────────┘
```

**Key design decisions:**
- Firebase replaces a traditional backend for auth, database, and push notifications
- A thin Express proxy on Render keeps third-party API keys out of the browser bundle
- Firestore security rules enforce data access control
- All state persists to localStorage for offline resilience

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 8, Tailwind CSS 3 |
| **Routing** | React Router v7 |
| **Maps** | Leaflet + React-Leaflet |
| **Icons** | Lucide React |
| **Database** | Firebase Firestore |
| **Auth** | Firebase Authentication |
| **Push Notifications** | Firebase Cloud Messaging |
| **AI Chat** | Google Gemini 2.0 Flash + OpenRouter |
| **AI Vision** | OpenRouter multimodal (Llama 3.2 Vision) |
| **Weather** | OpenWeatherMap API |
| **Earthquake** | USGS GeoJSON Feed (public) |
| **Backend Proxy** | Express.js on Render |
| **Mobile** | Capacitor (Android) |
| **Frontend Deploy** | Vercel |
| **Backend Deploy** | Render |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A Firebase project ([create one](https://console.firebase.google.com))

### 1. Clone
```bash
git clone https://github.com/sreejeetaroy2005-svg/safenet.git
cd safenet
```

### 2. Frontend setup
```bash
cd resqnet
npm install
cp .env.example .env.local
# Fill in .env.local with your Firebase keys and set:
# VITE_API_URL=http://localhost:3001
npm run dev
```

### 3. Backend setup (separate terminal)
```bash
cd server
npm install
cp .env.example .env
# Fill in .env with your OpenRouter and Weather API keys
npm run dev
```

App runs at **http://localhost:5173**  
Backend runs at **http://localhost:3001**

### Default admin login
```
Email:    admin@safenet.com
Password: admin123
```

---

## 🌐 Deployment

### Backend → Render

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect your repo, set **Root Directory** to `server`
3. Build: `npm install` · Start: `npm start`
4. Add environment variables:
```
OPENROUTER_API_KEY = sk-or-v1-...
WEATHER_API_KEY    = your-owm-key
FRONTEND_URL       = https://your-app.vercel.app
```
5. Copy your Render URL e.g. `https://safenet-backend.onrender.com`

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → import repo
2. Set **Root Directory** to `resqnet`
3. Add environment variables:
```
VITE_FIREBASE_API_KEY             = ...
VITE_FIREBASE_AUTH_DOMAIN         = ...
VITE_FIREBASE_PROJECT_ID          = ...
VITE_FIREBASE_STORAGE_BUCKET      = ...
VITE_FIREBASE_MESSAGING_SENDER_ID = ...
VITE_FIREBASE_APP_ID              = ...
VITE_API_URL                      = https://safenet-backend.onrender.com
```
4. Deploy → go back to Render and update `FRONTEND_URL` → redeploy

---

## 📁 Project Structure

```
safenet/
│
├── resqnet/                  # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/            # Route-level components
│   │   │   ├── Home.jsx
│   │   │   ├── SOS.jsx
│   │   │   ├── MapView.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── AIDamageAssessment.jsx
│   │   │   ├── EarlyWarning.jsx
│   │   │   ├── EmergencyPlan.jsx
│   │   │   ├── ResourceInventory.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── ...
│   │   ├── components/       # Shared UI components
│   │   ├── services/         # API + Firebase layer
│   │   ├── context/          # Global app state (AppContext)
│   │   └── hooks/            # useGeofence, etc.
│   ├── public/
│   │   └── firebase-messaging-sw.js   # FCM service worker
│   ├── android/              # Capacitor Android project
│   ├── vercel.json           # SPA routing config
│   └── vite.config.js        # Build + env injection
│
├── server/                   # Backend (Express on Render)
│   ├── index.js              # Proxy routes
│   ├── package.json
│   └── .env.example          # Required env vars
│
└── README.md
```

---

## 🔐 Environment Variables

### Frontend (`resqnet/.env.local`)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_FIREBASE_API_KEY` | ✅ | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | Firestore project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | ✅ | Firebase app ID |
| `VITE_API_URL` | ✅ | Render backend URL |
| `VITE_GEMINI_API_KEY` | ⬜ | Optional — Gemini direct access |

### Backend (`server/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | ✅ | OpenRouter API key |
| `WEATHER_API_KEY` | ✅ | OpenWeatherMap API key |
| `FRONTEND_URL` | ✅ | Vercel app URL (for CORS) |
| `PORT` | auto | Set by Render automatically |

---

## 📱 Android Build

```bash
cd resqnet
npm run build
npx cap sync android
npx cap open android
# Build APK from Android Studio: Build → Generate Signed APK
```

**App ID:** `com.safenet.app`

---

<div align="center">

<br/>

**Built with ❤️ for disaster preparedness**

*SafeNet — because help should always be one tap away.*

<br/>

</div>
