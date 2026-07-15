import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { UserIcon, LockIcon, GoogleIcon } from '../../components/icons'
import AuthLayout from '../../components/auth/AuthLayout'
import { useAuth } from '../../context/AuthContext'
import { ROUTES } from '../../config'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loginWithGoogle, setError } = useAuth()
  const [form, setForm] = useState({ username: '', password: '', remember: false })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const from = location.state?.from || ROUTES.HOME

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setSubmitting(true)
    try {
      await login({ username: form.username, password: form.password })
      navigate(from, { replace: true })
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
      await loginWithGoogle('pending-google-credential')
    } catch (err) {
      setMessage(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue shopping">
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        {message && <p className="auth-alert auth-alert--error">{message}</p>}

        <div className="form-field">
          <div className="input-wrapper">
            <UserIcon className="input-icon" size={18} />
            <input
              type="text"
              placeholder="Username or email"
              id="username"
              name="username"
              autoComplete="username"
              value={form.username}
              onChange={onChange}
              required
            />
            <label htmlFor="username">Username</label>
          </div>
        </div>

        <div className="form-field">
          <div className="input-wrapper">
            <LockIcon className="input-icon" size={18} />
            <input
              type="password"
              placeholder="Enter your password"
              id="password"
              name="password"
              autoComplete="current-password"
              value={form.password}
              onChange={onChange}
              required
            />
            <label htmlFor="password">Password</label>
          </div>
        </div>

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

        <p className="auth-otp-hint">
          OTP Login - <em>coming soon</em>
        </p>

        <p className="auth-switch">
          Don&apos;t have an account? <Link to={ROUTES.REGISTER}>Create one</Link>
        </p>
      </form>
    </AuthLayout>
  )
}

export default Login
