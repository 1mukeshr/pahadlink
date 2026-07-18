import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { getFirebaseAuth, isFirebaseConfigured } from '../lib/firebase'

const provider = new GoogleAuthProvider()
provider.setCustomParameters({ prompt: 'select_account' })

const AUTH_DOMAIN_HELP =
  'Add 1mukeshr.github.io under Firebase Console → Authentication → Settings → Authorized domains, then try again.'

/**
 * Sign in with Google via Firebase Auth and return the Firebase ID token
 * for backend session exchange.
 */
export async function signInWithGoogleFirebase() {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Google login needs Firebase Web config. Add firebase.apiKey and firebase.appId in public/runtime-config.json (or VITE_FIREBASE_* in .env), then redeploy.'
    )
  }

  const auth = getFirebaseAuth()
  try {
    const result = await signInWithPopup(auth, provider)
    const idToken = await result.user.getIdToken()

    return {
      idToken,
      profile: {
        name: result.user.displayName || '',
        email: result.user.email || '',
        photoURL: result.user.photoURL || '',
        uid: result.user.uid,
      },
    }
  } catch (error) {
    const code = error?.code || ''
    const raw = String(error?.message || '')

    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      throw new Error('Google sign-in was cancelled')
    }
    if (code === 'auth/configuration-not-found') {
      throw new Error(
        'Firebase Authentication is not set up. In Firebase Console → Authentication, click Get started, then enable Google sign-in.'
      )
    }
    if (code === 'auth/operation-not-allowed') {
      throw new Error(
        'Google sign-in is disabled. Enable it in Firebase Console → Authentication → Sign-in method → Google.'
      )
    }
    if (
      code === 'auth/unauthorized-domain' ||
      /unauthorized.?domain/i.test(raw) ||
      /domain.*not (authorized|whitelisted)/i.test(raw)
    ) {
      throw new Error(
        `This site is blocked for Google login. ${AUTH_DOMAIN_HELP}`
      )
    }
    // Surface Firebase's own message when it already names the fix
    if (/authorized domains/i.test(raw)) {
      throw new Error(`${raw} ${AUTH_DOMAIN_HELP}`)
    }
    throw new Error(raw || 'Google sign-in failed')
  }
}

export async function signOutFirebase() {
  if (!isFirebaseConfigured()) return
  try {
    await signOut(getFirebaseAuth())
  } catch {
    // ignore
  }
}
