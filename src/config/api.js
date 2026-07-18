import { setRuntimeFirebaseConfig } from '../lib/firebase'

/**
 * Resolve API base URL + optional Firebase web config for browser calls.
 * Priority:
 * - localhost → /api (Vite proxy); Firebase from VITE_* env
 * - runtime-config.json (GitHub Pages; can update without rebuild)
 * - VITE_* (build-time)
 *
 * Firebase config is stored on globalThis (not a shared module binding) so
 * Vite/Rolldown minification cannot collide the getter with React internals.
 */
let runtimeApiUrl = ''

const isLocalHost = () => {
  if (typeof window === 'undefined') return false
  return /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname)
}

function pickFirebase(data) {
  if (!data || typeof data !== 'object') return null
  const src = data.firebase && typeof data.firebase === 'object' ? data.firebase : data
  const apiKey = String(src.apiKey || src.VITE_FIREBASE_API_KEY || '').trim()
  const appId = String(src.appId || src.VITE_FIREBASE_APP_ID || '').trim()
  const authDomain = String(
    src.authDomain || src.VITE_FIREBASE_AUTH_DOMAIN || '',
  ).trim()
  const projectId = String(
    src.projectId || src.VITE_FIREBASE_PROJECT_ID || '',
  ).trim()
  if (!apiKey || !appId || !authDomain || !projectId) return null
  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket: String(
      src.storageBucket || src.VITE_FIREBASE_STORAGE_BUCKET || '',
    ).trim(),
    messagingSenderId: String(
      src.messagingSenderId || src.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    ).trim(),
    appId,
    measurementId: String(
      src.measurementId || src.VITE_FIREBASE_MEASUREMENT_ID || '',
    ).trim(),
  }
}

export async function loadRuntimeConfig() {
  if (typeof window === 'undefined') return
  // Local Vite always uses the proxy - skip remote runtime URLs
  if (isLocalHost()) {
    runtimeApiUrl = ''
    setRuntimeFirebaseConfig(null)
    return
  }
  try {
    const base = import.meta.env.BASE_URL || '/'
    const url = new URL('runtime-config.json', window.location.origin + base).toString()
    const res = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return
    const data = await res.json()
    if (typeof data?.apiUrl === 'string' && data.apiUrl.trim()) {
      runtimeApiUrl = data.apiUrl.trim().replace(/\/$/, '')
    }
    setRuntimeFirebaseConfig(pickFirebase(data))
  } catch {
    // optional file
  }
}

function detectApiBase() {
  if (isLocalHost()) return '/api'

  // Prefer runtime-config so Pages can switch API hosts without a rebuild
  if (runtimeApiUrl) return runtimeApiUrl

  const fromEnv = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '')
  if (fromEnv) return fromEnv

  if (typeof window !== 'undefined' && /\.github\.io$/i.test(window.location.hostname)) {
    return ''
  }

  return '/api'
}

export const getApiBaseUrl = () => detectApiBase()

export function getRuntimeFirebaseConfig() {
  if (typeof globalThis === 'undefined') return null
  return globalThis.__PAHADLINK_FIREBASE__ || null
}

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || '/api'
).replace(/\/$/, '')
