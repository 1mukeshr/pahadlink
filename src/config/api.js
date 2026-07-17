/**
 * Resolve API base URL for browser calls.
 * Priority:
 * - VITE_API_URL (always wins)
 * - localhost → /api (Vite proxy to npm run server)
 * - runtime-config.json (GitHub Pages / hosted builds)
 * - /api fallback
 */
let runtimeApiUrl = ''

const isLocalHost = () => {
  if (typeof window === 'undefined') return false
  return /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname)
}

export async function loadRuntimeConfig() {
  if (typeof window === 'undefined') return
  // Local Vite always uses the proxy - skip remote runtime URLs
  if (isLocalHost()) {
    runtimeApiUrl = ''
    return
  }
  try {
    const base = import.meta.env.BASE_URL || '/'
    const url = new URL('runtime-config.json', window.location.origin + base).toString()
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return
    const data = await res.json()
    if (data?.apiUrl && typeof data.apiUrl === 'string') {
      runtimeApiUrl = data.apiUrl.replace(/\/$/, '')
    }
  } catch {
    // optional file
  }
}

function detectApiBase() {
  const fromEnv = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
  if (fromEnv) return fromEnv

  if (isLocalHost()) return '/api'

  if (runtimeApiUrl) return runtimeApiUrl

  if (typeof window !== 'undefined' && /\.github\.io$/i.test(window.location.hostname)) {
    // Relative /api on GitHub Pages returns 405 - force a clear failure path
    return ''
  }

  return '/api'
}

export const getApiBaseUrl = () => detectApiBase()

// Kept for existing imports; value is resolved at call-time via getApiBaseUrl in api.js
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || '/api'
).replace(/\/$/, '')
