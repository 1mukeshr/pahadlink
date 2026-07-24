import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { UserIcon, LockIcon, EyeIcon, EyeOffIcon } from '../components/icons'
import { useAuth } from '../context/AuthContext'
import { ROUTES, ROLES, resolvePostAuthPath } from '../config'
import logo from '../assets/images/logo.png'
import './admin.css'

function resolveReturnPath(from) {
  if (!from) return ''
  if (typeof from === 'string') return from
  if (typeof from === 'object' && from.pathname) {
    return `${from.pathname}${from.search || ''}${from.hash || ''}`
  }
  return ''
}

/**
 * Separate admin desk login — no register option.
 */
export default function AdminLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, logout, isAuthenticated, user, loading } = useAuth()
  const [form, setForm] = useState({
    username: '',
    password: '',
    remember: true,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const from = resolveReturnPath(location.state?.from)

  if (!loading && isAuthenticated && user?.role === ROLES.ADMIN) {
    const dest =
      from.startsWith(ROUTES.ADMIN) && from !== ROUTES.ADMIN_LOGIN
        ? from
        : ROUTES.ADMIN
    return <Navigate to={dest} replace />
  }

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setSubmitting(true)
    try {
      const nextUser = await login({
        username: form.username,
        password: form.password,
        remember: form.remember,
      })
      if (nextUser?.role !== ROLES.ADMIN) {
        logout()
        setMessage(
          'Admin access only. Use the storefront login for customer accounts.'
        )
        return
      }
      const path = resolvePostAuthPath(nextUser, from || ROUTES.ADMIN)
      navigate(path.startsWith(ROUTES.ADMIN) ? path : ROUTES.ADMIN, {
        replace: true,
      })
    } catch (err) {
      setMessage(err.message || 'Could not sign in')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-app admin-login">
      <div className="admin-login__shell">
        <div className="admin-login__card">
          <header className="admin-login__head">
            <img src={logo} alt="" className="admin-login__logo" />
            <p className="admin-login__eyebrow">Admin portal</p>
            <h1>Sign in</h1>
            <p className="admin-login__lead">
              Staff access only. There is no registration for this desk.
            </p>
          </header>

          <form className="admin-login__form" onSubmit={onSubmit} noValidate>
            {message ? (
              <p className="admin-login__alert" role="alert">
                {message}
              </p>
            ) : null}

            <div className="admin-login__field">
              <label htmlFor="admin-username">Username or email</label>
              <div className="admin-login__input">
                <UserIcon size={16} aria-hidden="true" />
                <input
                  id="admin-username"
                  type="text"
                  name="username"
                  autoComplete="username"
                  value={form.username}
                  onChange={onChange}
                  required
                  placeholder="admin"
                />
              </div>
            </div>

            <div className="admin-login__field">
              <label htmlFor="admin-password">Password</label>
              <div className="admin-login__input">
                <LockIcon size={16} aria-hidden="true" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={onChange}
                  required
                  placeholder="Password"
                />
                <button
                  type="button"
                  className="admin-login__eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOffIcon size={16} />
                  ) : (
                    <EyeIcon size={16} />
                  )}
                </button>
              </div>
            </div>

            <label className="admin-login__remember">
              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={onChange}
              />
              <span>Keep me signed in</span>
            </label>

            <button
              type="submit"
              className="admin-login__submit"
              disabled={submitting}
            >
              {submitting ? 'Signing in…' : 'Sign in to admin'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
