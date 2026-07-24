import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { UserIcon, GoogleIcon } from '../../components/icons'
import AuthLayout from '../../components/auth/AuthLayout'
import PasswordField from '../../components/auth/PasswordField'
import { useAuth } from '../../context/AuthContext'
import {
  ROUTES,
  postCheckoutLoginState,
  resolvePostAuthPath,
} from '../../config'

function resolveReturnPath(from) {
  if (!from) return ''
  if (typeof from === 'string') return from
  if (typeof from === 'object' && from.pathname) {
    return `${from.pathname}${from.search || ''}${from.hash || ''}`
  }
  return ''
}

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loginWithGoogle, setError } = useAuth()
  const [form, setForm] = useState({ username: '', password: '', remember: false })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const from = resolveReturnPath(location.state?.from)
  const intent = location.state?.intent
  const isCheckoutIntent =
    intent === 'checkout' || from.startsWith(ROUTES.CHECKOUT)

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const goAfterAuth = (user) => {
    const path = resolvePostAuthPath(user, from, intent)
    navigate(path, {
      replace: true,
      state:
        isCheckoutIntent && path === ROUTES.HOME
          ? postCheckoutLoginState()
          : undefined,
    })
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setSubmitting(true)
    try {
      const user = await login({
        username: form.username,
        password: form.password,
        remember: form.remember,
      })
      goAfterAuth(user)
    } catch (err) {
      setMessage(err.message)
      setError?.(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const onGoogle = async () => {
    setMessage('')
    setSubmitting(true)
    try {
      const user = await loginWithGoogle()
      goAfterAuth(user)
    } catch (err) {
      setMessage(err.message || 'Google sign-in failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Welcome back">
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        {message && <p className="auth-alert auth-alert--error">{message}</p>}

        <div className="form-field">
          <div className="input-wrapper">
            <UserIcon className="input-icon" size={18} />
            <input
              type="text"
              placeholder=" "
              id="username"
              name="username"
              autoComplete="username"
              value={form.username}
              onChange={onChange}
              required
            />
            <label htmlFor="username">Email or username</label>
          </div>
        </div>

        <PasswordField
          id="password"
          name="password"
          label="Password"
          placeholder=" "
          autoComplete="current-password"
          value={form.password}
          onChange={onChange}
        />

        <div className="form-footer">
          <label className="remember-me">
            <input
              type="checkbox"
              name="remember"
              checked={form.remember}
              onChange={onChange}
            />
            <span>Remember me</span>
          </label>
          <Link to={ROUTES.FORGOT_PASSWORD} className="forgot-link">
            Forgot password?
          </Link>
        </div>

        <button className="btn-submit" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>

        <div className="divider">
          <span>or continue with</span>
        </div>

        <button
          className="btn-google"
          type="button"
          onClick={onGoogle}
          disabled={submitting}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <p className="auth-switch">
          Don&apos;t have an account?{' '}
          <Link
            to={ROUTES.REGISTER}
            state={{ from, intent: location.state?.intent }}
          >
            Create one
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}

export default Login
