import api from './api'
import { getApiBaseUrl, isLocalAppHost } from '../config'

export const ROLES = {
  CUSTOMER: 'customer',
  SELLER: 'seller',
  ADMIN: 'admin',
}

/**
 * Confirm API + auth store (Mongo preferred) are ready before register/login.
 */
export async function ensureAuthApiReady() {
  const base = getApiBaseUrl()
  if (!base) {
    throw new Error(
      'API URL is not configured. Set public/runtime-config.json apiUrl (or VITE_API_URL) and redeploy.'
    )
  }

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 12000)
  try {
    const res = await fetch(`${base}/health?t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      mode: 'cors',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.ok || !data?.authReady) {
      if (isLocalAppHost()) {
        throw new Error(
          'Database is not ready. Keep MongoDB on and run: npm start (or npm run server).'
        )
      }
      throw new Error(
        'PahadLink API / database is offline. Deploy the API and check runtime-config.json apiUrl.'
      )
    }
    return data
  } catch (err) {
    if (err instanceof Error && /Database is not ready|API URL|API \/ database/i.test(err.message)) {
      throw err
    }
    if (isLocalAppHost()) {
      throw new Error(
        'Cannot reach local API. Keep MongoDB on and run: npm start (or npm run server).'
      )
    }
    throw new Error(
      `Cannot reach PahadLink API (${base}). Deploy the API and set public/runtime-config.json apiUrl.`
    )
  } finally {
    window.clearTimeout(timer)
  }
}

export async function registerUser(payload) {
  await ensureAuthApiReady()
  const { data } = await api.post('/auth/register', {
    name: String(payload.name || '').trim(),
    email: String(payload.email || '').trim().toLowerCase(),
    // Backend creates a unique username from email when omitted
    ...(payload.username
      ? { username: String(payload.username).trim().toLowerCase() }
      : {}),
    password: payload.password,
  })
  if (!data?.token || !data?.user) {
    throw new Error('Registration succeeded but no session was returned. Try signing in.')
  }
  return data
}

export async function loginUser(payload) {
  await ensureAuthApiReady()
  const { data } = await api.post('/auth/login', payload)
  if (!data?.token || !data?.user) {
    throw new Error('Login succeeded but no session was returned. Try again.')
  }
  return data
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me')
  return data.user
}

export async function forgotPassword(email) {
  const { data } = await api.post('/auth/forgot-password', { email })
  return data
}

export async function resetPassword(token, password) {
  const { data } = await api.post('/auth/reset-password', { token, password })
  return data
}

export async function googleLogin(idToken) {
  await ensureAuthApiReady()
  const { data } = await api.post('/auth/google', { idToken })
  if (!data?.token || !data?.user) {
    throw new Error(
      'Google sign-in succeeded but no session was returned. Try again.'
    )
  }
  return data
}

export async function listUsers() {
  const { data } = await api.get('/auth/users')
  return data.users
}

export async function updateUserRole(userId, role) {
  const { data } = await api.patch(`/auth/users/${userId}/role`, { role })
  return data
}
