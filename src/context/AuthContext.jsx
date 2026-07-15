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

const AuthContext = createContext(null)

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE.USER)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser())
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE.TOKEN))
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(STORAGE.TOKEN)))
  const [error, setError] = useState(null)

  const persistSession = useCallback((nextToken, nextUser) => {
    localStorage.setItem(STORAGE.TOKEN, nextToken)
    localStorage.setItem(STORAGE.USER, JSON.stringify(nextUser))
    setToken(nextToken)
    setUser(nextUser)
  }, [])

  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE.TOKEN)
    localStorage.removeItem(STORAGE.USER)
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
          localStorage.setItem(STORAGE.USER, JSON.stringify(me))
        }
      } catch {
        if (!cancelled) clearSession()
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, clearSession])

  const login = useCallback(
    async (credentials) => {
      setError(null)
      const data = await loginUser({
        username: credentials.username?.trim(),
        password: credentials.password,
      })
      persistSession(data.token, data.user)
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
        username: payload.username?.trim().toLowerCase(),
        password: payload.password,
      })
      persistSession(data.token, data.user)
      return data.user
    },
    [persistSession]
  )

  const loginWithGoogle = useCallback(
    async (credential) => {
      setError(null)
      const data = await googleLoginApi(credential)
      if (data.token && data.user) {
        persistSession(data.token, data.user)
      }
      return data
    },
    [persistSession]
  )

  const logout = useCallback(() => {
    clearSession()
    setError(null)
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
