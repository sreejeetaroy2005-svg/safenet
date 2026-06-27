# RESQNET — Project Report
## Disaster Response & Emergency Network

---

## 1. Objective

The primary objective of RESQNET is to build a full-scale, production-ready mobile-first disaster management application that bridges the critical gap between people in distress and emergency responders during natural and man-made disasters.

### Specific Objectives

- **Instant Emergency Communication** — Provide a one-tap SOS system that captures live GPS coordinates and notifies emergency responders and administrators in real time, with support for 8 emergency category types (Medical, Flood, Fire, Earthquake, Trapped, Missing, Supplies, Other).

- **Real-Time Situational Awareness** — Display a live disaster map showing active SOS alerts, nearby shelters, crowdsourced hazard markers, and incident reports to both users and administrators.

- **Rescue Coordination** — Enable field rescue teams and volunteers to view, accept, and complete emergency missions with priority-based sorting and GPS navigation to victims.

- **AI-Powered Assistance** — Integrate an AI chatbot (Google Gemini / OpenRouter) to provide instant first-aid guidance, evacuation instructions, and disaster safety information in multiple languages.

- **AI Damage Assessment** — Allow users to upload photos of damaged areas for automated severity classification using vision AI models, reducing assessment time during mass casualty events.

- **Offline Resilience** — Ensure the application remains functional during connectivity loss by queuing SOS alerts and reports locally, auto-syncing to the backend when the connection is restored.

- **Multilingual Accessibility** — Support English, Hindi, and Tamil to make the application accessible across diverse user populations in India.

- **Government-Grade Admin Control** — Provide administrators with a real-time control center to monitor SOS feeds, manage incident reports, send emergency broadcasts, and track field operations.

- **Android APK Deployment** — Package the application as a native Android APK using Capacitor for distribution via the Google Play Store or direct installation.

---

## 2. ER Diagram (Entity-Relationship)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        RESQNET DATABASE SCHEMA                       │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────────────┐
│    USERS     │         │     SOS_ALERTS        │
├──────────────┤         ├──────────────────────┤
│ uid (PK)     │1      N │ id (PK)              │
│ name         ├─────────┤ userId (FK → users)  │
│ email        │         │ userName             │
│ role         │         │ emergencyType        │
│ fcmToken     │         │ priority             │
│ createdAt    │         │ location {lat, lng}  │
│ lastSeen     │         │ accuracy             │
└──────────────┘         │ status               │
                         │ message              │
                         │ audioUrl             │
                         │ timestamp            │
                         │ updatedAt            │
                         └──────────────────────┘

┌──────────────────────────┐     ┌──────────────────────┐
│   INCIDENT_REPORTS       │     │     BROADCASTS        │
├──────────────────────────┤     ├──────────────────────┤
│ id (PK)                  │     │ id (PK)              │
│ userId (FK → users)      │     │ title                │
│ userName                 │     │ message              │
│ type                     │     │ type                 │
│   (flood/fire/earthquake │     │   (warning/          │
│    accident/other)       │     │    evacuation/info)  │
│ title                    │     │ adminId (FK → users) │
│ description              │     │ timestamp            │
│ location {lat, lng}      │     └──────────────────────┘
│ photoUrl                 │
│ audioUrl                 │     ┌──────────────────────┐
│ status                   │     │     SHELTERS          │
│ timestamp                │     ├──────────────────────┤
└──────────────────────────┘     │ id (PK)              │
                                 │ name                 │
                                 │ type                 │
┌──────────────────────────┐     │ location {lat, lng}  │
│     HAZARDS (local)      │     │ capacity             │
├──────────────────────────┤     │ occupied             │
│ id                       │     │ available (bool)     │
│ type                     │     │ address              │
│ location {lat, lng}      │     │ contact              │
│ description              │     └──────────────────────┘
│ reportedBy               │
│ votes                    │
│ createdAt                │
│ expiresAt (TTL 6h)       │
└──────────────────────────┘

RELATIONSHIPS:
  User     ──< SOS_ALERTS          (one user sends many SOS alerts)
  User     ──< INCIDENT_REPORTS    (one user submits many reports)
  User(Admin) ──< BROADCASTS       (admin sends many broadcasts)
  SOS_ALERTS >── LOCATION          (each alert has one GPS location)
  INCIDENT_REPORTS >── LOCATION    (each report has one GPS location)
  SHELTERS >── LOCATION            (each shelter has one GPS location)
```

**SOS Alert Status Flow:**
```
pending ──→ received ──→ responded ──→ resolved
```

**Emergency Type Priority:**
```
Priority 1 (Critical): medical, fire, trapped
Priority 2 (High):     flood, earthquake, missing
Priority 3 (Normal):   supplies, other
```

---

## 3. Software Requirements

### Frontend
| Software | Version | Purpose |
|---|---|---|
| React | 18.x | UI framework |
| Vite | 8.x | Build tool and dev server |
| Tailwind CSS | 3.x | Utility-first styling |
| React Router | 6.x | Client-side routing |
| Leaflet + React-Leaflet | 1.9.x | Interactive maps (OpenStreetMap) |
| Lucide React | Latest | Icon system |
| @google/generative-ai | Latest | Gemini AI SDK |

### Backend / Services
| Software | Version | Purpose |
|---|---|---|
| Firebase Authentication | 10.x | User auth with email/password |
| Firebase Firestore | 10.x | Real-time NoSQL database |
| Firebase Storage | 10.x | Photo and audio file storage |
| Firebase Cloud Messaging | 10.x | Push notifications |
| OpenRouter API | REST | AI chatbot fallback (free tier) |

### Mobile Packaging
| Software | Version | Purpose |
|---|---|---|
| Capacitor | 7.x | Web-to-Android bridge |
| @capacitor/android | 7.x | Android platform plugin |
| Android Studio | Latest | APK build and signing |
| JDK | 17+ | Java build requirement |

### Development Tools
| Software | Purpose |
|---|---|
| Node.js 18+ | JavaScript runtime |
| npm 9+ | Package manager |
| Git | Version control |
| VS Code / Kiro | Code editor |

---

## 4. Hardware Requirements

### Minimum Device Requirements (Android APK)
| Component | Minimum | Recommended |
|---|---|---|
| Android Version | Android 8.0 (API 26) | Android 12+ (API 31+) |
| RAM | 2 GB | 4 GB+ |
| Storage | 100 MB free | 500 MB free |
| Processor | Quad-core 1.4 GHz | Octa-core 2.0 GHz+ |
| GPS | Required | High-accuracy GPS |
| Microphone | Required (SOS voice) | Noise-cancelling |
| Camera | Required (damage AI) | 12 MP+ rear camera |
| Internet | 2G minimum | 4G/WiFi recommended |
| Battery | 2000 mAh | 3000 mAh+ |

### Development Machine Requirements
| Component | Minimum |
|---|---|
| OS | Windows 10 / macOS 11 / Ubuntu 20.04 |
| RAM | 8 GB |
| Storage | 10 GB free (Android Studio + SDK) |
| CPU | Intel Core i5 / AMD Ryzen 5 |
| Internet | Required for Firebase + AI APIs |

### Server / Cloud Requirements
| Service | Tier | Capacity |
|---|---|---|
| Firebase Firestore | Free (Spark) | 1 GB storage, 50K reads/day |
| Firebase Authentication | Free | 10K users/month |
| Firebase Storage | Free | 5 GB storage |
| Firebase Hosting (optional) | Free | 10 GB/month bandwidth |
| OpenRouter API | Free | ~200 requests/day |

---

## 5. Conclusion

RESQNET successfully demonstrates the feasibility of a comprehensive, AI-powered disaster management system built entirely on modern web technologies and deployed as a native Android application. The project achieves all stated objectives:

The **SOS system** provides a robust, multi-layered emergency alert mechanism with GPS tracking, voice recording, offline queuing, and voice-triggered activation — ensuring victims can call for help even in the most adverse conditions. The categorized SOS types (Medical, Flood, Fire, Earthquake, Trapped, Missing, Supplies) enable responders to prioritize and allocate resources efficiently.

The **real-time Firebase backend** ensures that SOS alerts, incident reports, and admin broadcasts are synchronized instantly across all connected devices, providing administrators with a live operational picture. The Firestore database schema is designed for scalability, supporting thousands of concurrent alerts.

The **AI features** — chatbot powered by Gemini/OpenRouter and image-based damage assessment — represent a significant advancement over traditional disaster apps, providing intelligent, context-aware guidance to users who may not know the correct steps to take during a crisis.

The **offline-first architecture** with automatic sync ensures the application remains functional even in disaster scenarios where connectivity is intermittent or absent, a critical requirement for real-world emergency systems.

The **multilingual support** (English, Hindi, Tamil) and **low power mode** demonstrate attention to the real-world constraints of disaster scenarios in India, where users may have older devices, limited battery, and language barriers.

Overall, RESQNET proves that a government-grade emergency response system can be built and deployed using open-source tools and free-tier cloud services, making it accessible for NGOs, local governments, and disaster relief organizations with limited budgets.

---

## 6. Future Scope

### Short-Term Enhancements (3–6 months)

- **Real-time SOS tracking map in Admin** — Show live-moving GPS pins for all active SOS users on the admin map, updating every 5 seconds via WebSocket or Firestore real-time listeners.

- **Push notifications on mobile** — Complete Firebase Cloud Messaging integration for background alerts when admin broadcasts a new emergency or an SOS is acknowledged.

- **Photo evidence in SOS alerts** — Allow users to attach a photo directly to their SOS alert (not just reports), giving responders visual context of the emergency scene.

- **Emergency contact integration** — Allow users to add personal emergency contacts (family, friends) who receive an SMS/WhatsApp message when SOS is activated.

- **Voice-to-text incident reporting** — Use the Web Speech API to allow users to dictate incident reports hands-free during emergencies.

### Medium-Term Enhancements (6–12 months)

- **Satellite imagery integration** — Overlay NASA/ISRO satellite data for flood extent mapping and fire perimeter tracking on the disaster map.

- **Predictive risk zones** — Use historical disaster data and weather APIs to display color-coded risk zones on the map before a disaster strikes.

- **NGO and government portal** — Build a separate web dashboard for NGOs, NDRF, and state disaster management authorities to coordinate response operations.

- **Inter-agency communication** — Add a secure group messaging channel for rescue teams, NGOs, and government officials to coordinate in real time.

- **Drone integration** — Allow admin to dispatch drone survey requests and view aerial footage within the admin dashboard.

- **Aadhaar-based authentication** — Integrate with India Stack for verified identity during disaster registration and relief distribution.

### Long-Term Vision (1–3 years)

- **Predictive AI** — Train a custom ML model on historical disaster patterns to predict which areas are likely to be affected before a disaster and pre-position rescue resources.

- **Wearable device support** — Integrate with Android Wear / smartwatches to trigger SOS via wrist gesture or heart rate anomaly detection.

- **Blockchain-based relief tracking** — Use a public blockchain to transparently track relief fund distribution and supply chain logistics during large-scale disasters.

- **AR navigation** — Use augmented reality overlays on the phone camera to show directional arrows to the nearest shelter in real-time.

- **National integration** — API integration with NDMA (National Disaster Management Authority), IMD (Indian Meteorological Department), and state emergency operation centers for official alert propagation.

- **Federated deployment** — Allow state governments to deploy their own isolated RESQNET instances that sync to a national coordination layer.

---

## Tech Stack Summary

```
┌─────────────────────────────────────────────┐
│                  RESQNET v3.0                │
├─────────────────┬───────────────────────────┤
│  Frontend       │  React 18 + Vite           │
│  Styling        │  Tailwind CSS              │
│  Maps           │  Leaflet (OpenStreetMap)   │
│  AI Chatbot     │  Gemini + OpenRouter       │
│  AI Vision      │  OpenRouter Vision Models  │
│  Auth           │  Firebase Authentication   │
│  Database       │  Firebase Firestore        │
│  Storage        │  Firebase Storage          │
│  Push Notif.    │  Firebase Cloud Messaging  │
│  Mobile         │  Capacitor + Android       │
│  State          │  React Context + localStorage │
└─────────────────┴───────────────────────────┘
```

---

*RESQNET v3.0 — Built for humanitarian use. Open source under MIT License.*
