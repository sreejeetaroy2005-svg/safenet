import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

/**
 * Vite plugin that rewrites public/firebase-messaging-sw.js at build time,
 * substituting __VITE_FIREBASE_*__ placeholders with real env values.
 * This keeps secrets out of source control while still serving a valid SW.
 */
function injectFirebaseSwEnv(env) {
  return {
    name: 'inject-firebase-sw-env',
    // Runs after the bundle is written to disk
    closeBundle() {
      const swDest = path.resolve(__dirname, 'dist', 'firebase-messaging-sw.js')

      if (!fs.existsSync(swDest)) return

      let content = fs.readFileSync(swDest, 'utf-8')

      const keys = [
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_AUTH_DOMAIN',
        'VITE_FIREBASE_PROJECT_ID',
        'VITE_FIREBASE_STORAGE_BUCKET',
        'VITE_FIREBASE_MESSAGING_SENDER_ID',
        'VITE_FIREBASE_APP_ID',
      ]

      for (const key of keys) {
        const value = env[key] || ''
        content = content.replaceAll(`__${key}__`, value)
      }

      fs.writeFileSync(swDest, content, 'utf-8')
      console.log('[inject-firebase-sw-env] Service worker env values injected.')
    },
  }
}

export default defineConfig(({ mode }) => {
  // Load env file (e.g. .env.local) for the current mode
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), injectFirebaseSwEnv(env)],
    base: '/', // Web deployment
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    },
  }
})
