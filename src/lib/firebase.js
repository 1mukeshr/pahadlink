import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const RUNTIME_KEY = '__PAHADLINK_FIREBASE__'

function envFirebaseConfig() {
  return {
    apiKey: (import.meta.env.VITE_FIREBASE_API_KEY || '').trim(),
    authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim(),
    projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim(),
    storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '').trim(),
    messagingSenderId: (
      import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || ''
    ).trim(),
    appId: (import.meta.env.VITE_FIREBASE_APP_ID || '').trim(),
    measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '').trim(),
  }
}

function runtimeFirebaseConfig() {
  if (typeof globalThis === 'undefined') return null
  const cfg = globalThis[RUNTIME_KEY]
  if (!cfg || typeof cfg !== 'object') return null
  return cfg
}

export function setRuntimeFirebaseConfig(cfg) {
  if (typeof globalThis === 'undefined') return
  if (cfg?.apiKey && cfg?.appId) {
    globalThis[RUNTIME_KEY] = cfg
  } else {
    globalThis[RUNTIME_KEY] = null
  }
}

export function getFirebaseConfig() {
  const fromRuntime = runtimeFirebaseConfig()
  if (
    fromRuntime?.apiKey &&
    fromRuntime?.appId &&
    fromRuntime?.authDomain &&
    fromRuntime?.projectId
  ) {
    return fromRuntime
  }

  return envFirebaseConfig()
}

export function isFirebaseConfigured() {
  const cfg = getFirebaseConfig()
  return Boolean(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId)
}

let app
let auth

export function getFirebaseApp() {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured. Add firebase config to public/runtime-config.json (or VITE_FIREBASE_* in .env).'
    )
  }
  if (!app) {
    app = getApps().length ? getApps()[0] : initializeApp(getFirebaseConfig())
  }
  return app
}

export function getFirebaseAuth() {
  if (!auth) {
    auth = getAuth(getFirebaseApp())
  }
  return auth
}
