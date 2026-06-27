# RESQNET – Firebase Setup Guide

## Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add project" → name it `resqnet`
3. Disable Google Analytics (optional)

## Step 2: Enable Services

In Firebase Console, enable:
- **Authentication** → Sign-in method → Email/Password → Enable
- **Firestore Database** → Create database → Start in test mode
- **Storage** → Get started → Start in test mode
- **Cloud Messaging** → Already enabled by default

## Step 3: Get Config

1. Project Settings → Your Apps → Add Web App → name it `resqnet-web`
2. Copy the `firebaseConfig` object
3. Paste it into `src/services/firebase.js` (replace the placeholder values)

## Step 4: Enable Firebase in App

In `src/context/AppContext.jsx`, change:
```js
const FIREBASE_ENABLED = false
```
to:
```js
const FIREBASE_ENABLED = true
```

## Step 5: FCM Push Notifications

1. Project Settings → Cloud Messaging → Web Push Certificates
2. Generate key pair → copy the public key
3. Paste into `src/services/fcmService.js` → `VAPID_KEY`
4. Also update `public/firebase-messaging-sw.js` with your config

## Step 6: Firestore Security Rules

In Firebase Console → Firestore → Rules, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    // Authenticated users can create SOS alerts
    match /sos_alerts/{id} {
      allow create: if request.auth != null;
      allow read, update: if request.auth != null;
    }
    // Authenticated users can create reports
    match /incident_reports/{id} {
      allow create: if request.auth != null;
      allow read: if request.auth != null;
      allow update: if request.auth != null;
    }
    // Anyone authenticated can read broadcasts
    match /broadcasts/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role == 'admin';
    }
    // Anyone can read shelters
    match /shelters/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role == 'admin';
    }
  }
}
```

## Step 7: Set Admin Role

After first admin login, go to Firebase Console → Firestore → users collection
→ find admin user document → add field: `role: "admin"`

Or use Firebase Admin SDK in a Cloud Function to set custom claims.

---

# RESQNET – Play Store APK/AAB Build Guide

## Prerequisites
- Android Studio (latest)
- JDK 17+
- Node.js 18+

## Build Steps

```bash
# 1. Build the web app
cd resqnet
npm run build

# 2. Sync to Android
npx cap sync android

# 3. Open in Android Studio
npx cap open android
```

## In Android Studio

### Debug APK (for testing)
Build → Build Bundle(s) / APK(s) → Build APK(s)
Output: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release AAB (for Play Store)
1. Build → Generate Signed Bundle / APK
2. Choose "Android App Bundle"
3. Create a new keystore (save it securely!)
4. Fill in key details → Next → Release → Finish
5. Output: `android/app/build/outputs/bundle/release/app-release.aab`

## App Icon Setup

Replace these files with your RESQNET icon:
- `android/app/src/main/res/mipmap-hdpi/ic_launcher.png`    (72×72)
- `android/app/src/main/res/mipmap-mdpi/ic_launcher.png`    (48×48)
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png`   (96×96)
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png`  (144×144)
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` (192×192)

Or use Android Studio → right-click `res` → New → Image Asset

## Splash Screen

In `capacitor.config.json`, the splash screen is already configured.
Install the plugin for a proper native splash:
```bash
npm install @capacitor/splash-screen
npx cap sync android
```

## Play Store Checklist

- [ ] App icon (512×512 PNG, no alpha)
- [ ] Feature graphic (1024×500 PNG)
- [ ] Screenshots (min 2, phone)
- [ ] Short description (80 chars)
- [ ] Full description
- [ ] Privacy Policy URL (required — host a simple page)
- [ ] Content rating questionnaire
- [ ] Target API level 34+ (Android 14)
- [ ] Signed AAB with release keystore
