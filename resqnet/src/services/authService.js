/**
 * authService.js
 * Firebase Authentication — email/password + role management via Firestore.
 * Roles are stored in /users/{uid} document.
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

/** Register a new user and create their Firestore profile */
export async function registerUser({ name, email, password }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(cred.user, { displayName: name })

  // Create user document in Firestore
  await setDoc(doc(db, 'users', cred.user.uid), {
    uid:       cred.user.uid,
    name,
    email,
    role:      'user',
    createdAt: serverTimestamp(),
    lastSeen:  serverTimestamp(),
  })

  return { uid: cred.user.uid, name, email, role: 'user' }
}

/** Sign in and fetch role from Firestore */
export async function loginUser(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  const snap = await getDoc(doc(db, 'users', cred.user.uid))
  const data = snap.exists() ? snap.data() : {}
  return {
    uid:   cred.user.uid,
    name:  cred.user.displayName || data.name || 'User',
    email: cred.user.email,
    role:  data.role || 'user',
  }
}

/** Sign out */
export async function logoutUser() {
  await signOut(auth)
}

/**
 * Subscribe to auth state changes.
 * Resolves user profile from Firestore on each auth change.
 * @param {function} callback - called with user object or null
 */
export function subscribeAuth(callback) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) { callback(null); return }
    try {
      const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
      const data = snap.exists() ? snap.data() : {}
      callback({
        uid:   firebaseUser.uid,
        name:  firebaseUser.displayName || data.name || 'User',
        email: firebaseUser.email,
        role:  data.role || 'user',
      })
    } catch {
      callback({ uid: firebaseUser.uid, name: firebaseUser.displayName, email: firebaseUser.email, role: 'user' })
    }
  })
}
