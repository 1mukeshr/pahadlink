import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { STORAGE, ROLES } from '../config'
import {
  fetchMe,
  loginUser,
  registerUser,
  googleLogin as googleLoginApi,
} from '../services/authService'
import { signInWithGoogleFirebase, signOutFirebase } from '../services/firebaseGoogleAuth'

const AuthContext = createContext(null)

function readStore(preferLocal = true) {
  if (preferLocal) {
    const token = localStorage.getItem(STORAGE.TOKEN)
    if (token) {
      try {
        const raw = localStorage.getItem(STORAGE.USER)
        return { token, user: raw ? JSON.parse(raw) : null, remember: true }
      } catch {
        return { token, user: null, remember: true }
      }
    }
  }
  const token = sessionStorage.getItem(STORAGE.TOKEN)
  if (!token) return { token: null, user: null, remember: true }
  try {
    const raw = sessionStorage.getItem(STORAGE.USER)
    return { token, user: raw ? JSON.parse(raw) : null, remember: false }
  } catch {
    return { token, user: null, remember: false }
  }
}

function writeStore(token, user, remember) {
  const store = remember ? localStorage : sessionStorage
  const other = remember ? sessionStorage : localStorage
  other.removeItem(STORAGE.TOKEN)
  other.removeItem(STORAGE.USER)
  store.setItem(STORAGE.TOKEN, token)
  store.setItem(STORAGE.USER, JSON.stringify(user))
}

function clearStore() {
  localStorage.removeItem(STORAGE.TOKEN)
  localStorage.removeItem(STORAGE.USER)
  sessionStorage.removeItem(STORAGE.TOKEN)
  sessionStorage.removeItem(STORAGE.USER)
}

export function AuthProvider({ children }) {
  const initial = readStore(true)
  const sessionOnly = !initial.token ? readStore(false) : null
  const boot = initial.token ? initial : sessionOnly || initial

  const [user, setUser] = useState(() => boot.user)
  const [token, setToken] = useState(() => boot.token)
  const [rememberMe, setRememberMe] = useState(() => boot.remember !== false)
  const [loading, setLoading] = useState(Boolean(boot.token))
  const [error, setError] = useState(null)

  const persistSession = useCallback((nextToken, nextUser, options = {}) => {
    const remember = options.remember !== false
    writeStore(nextToken, nextUser, remember)
    setRememberMe(remember)
    setToken(nextToken)
    setUser(nextUser)
  }, [])

  const clearSession = useCallback(() => {
    clearStore()
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const me = await fetchMe()
        if (!cancelled) {
          setUser(me)
          writeStore(token, me, rememberMe)
        }
      } catch {
        // Keep the session from login/register if /me briefly fails —
        // wiping it makes email signup look broken.
        if (!cancelled) {
          const hasCachedUser = Boolean(
            localStorage.getItem(STORAGE.USER) ||
              sessionStorage.getItem(STORAGE.USER)
          )
          if (!hasCachedUser) {
            clearStore()
            setToken(null)
            setUser(null)
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, rememberMe])

  const login = useCallback(
    async (credentials) => {
      setError(null)
      const data = await loginUser({
        username: credentials.username?.trim(),
        password: credentials.password,
      })
      persistSession(data.token, data.user, {
        remember: credentials.remember !== false,
      })
      return data.user
    },
    [persistSession]
  )

  const register = useCallback(
    async (payload) => {
      setError(null)
      const data = await registerUser({
        name: payload.name?.trim(),
        email: payload.email?.trim().toLowerCase(),
        username: payload.username?.trim().toLowerCase() || undefined,
        password: payload.password,
      })
      if (!data?.token || !data?.user) {
        throw new Error('Registration failed — no session returned from server')
      }
      persistSession(data.token, data.user, { remember: true })
      return data.user
    },
    [persistSession]
  )

  const loginWithGoogle = useCallback(async () => {
    setError(null)
    const { idToken } = await signInWithGoogleFirebase()
    if (!idToken) {
      throw new Error('Google sign-in did not return a token. Try again.')
    }
    const data = await googleLoginApi(idToken)
    if (!data?.token || !data?.user) {
      throw new Error(
        'Google sign-in failed — account was not saved. Check API/MongoDB and try again.'
      )
    }
    persistSession(data.token, data.user, { remember: true })
    return data.user
  }, [persistSession])

  const logout = useCallback(() => {
    clearSession()
    setError(null)
    void signOutFirebase()
  }, [clearSession])

  const hasRole = useCallback(
    (...roles) => Boolean(user && roles.includes(user.role)),
    [user]
  )

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      error,
      setError,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      loginWithGoogle,
      logout,
      hasRole,
      isAdmin: user?.role === ROLES.ADMIN,
      isSeller: user?.role === ROLES.SELLER,
      isCustomer: user?.role === ROLES.CUSTOMER,
    }),
    [user, token, loading, error, login, register, loginWithGoogle, logout, hasRole]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
