# RESQNET – Setup & APK Build Guide

## Prerequisites
- Node.js 18+
- Android Studio (latest)
- Java JDK 17+

---

## 1. Install & Run Locally

```bash
cd resqnet
npm install
npm run dev
```
Open http://localhost:5173 in your browser.

**Test credentials:**
- Admin: `admin@resqnet.com` / `admin123`
- Or register a new account / use Guest

---

## 2. Build for Production

```bash
npm run build
```
Output goes to `dist/`.

---

## 3. Convert to Android APK

### Step 1 – Sync web assets to Android
```bash
npx cap sync android
```

### Step 2 – Open in Android Studio
```bash
npx cap open android
```

### Step 3 – Build APK in Android Studio
1. Wait for Gradle sync to finish
2. Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. APK will be at:
   `android/app/build/outputs/apk/debug/app-debug.apk`

### Step 4 – Install on device
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```
Or transfer the APK file to your phone and install directly.

---

## 4. Workflow for Updates

Whenever you change the React code:
```bash
npm run build
npx cap sync android
# Then rebuild APK in Android Studio
```

---

## App Features
| Feature | Status |
|---|---|
| SOS Emergency Button | ✅ |
| Live GPS Location | ✅ |
| Nearby Shelters Map | ✅ |
| Incident Reporting | ✅ |
| Voice Recording | ✅ |
| Auth (User + Admin) | ✅ |
| Admin Dashboard | ✅ |
| Emergency Broadcast | ✅ |
| Government Helplines | ✅ |
| AI Chatbot | ✅ |
| Dark Mode | ✅ |
| Capacitor APK Ready | ✅ |
