import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserIcon, MailIcon, GoogleIcon } from '../../components/icons'
import AuthLayout from '../../components/auth/AuthLayout'
import PasswordField from '../../components/auth/PasswordField'
import { useAuth } from '../../context/AuthContext'
import { ROUTES } from '../../config'

const Register = () => {
  const navigate = useNavigate()
  const { register, loginWithGoogle, setError } = useAuth()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    terms: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    if (!form.terms) {
      setMessage('Please accept the Terms & Conditions')
      return
    }

    if (form.password.length < 6) {
      setMessage('Password must be at least 6 characters')
      return
    }

    const email = form.email.trim().toLowerCase()
    const username =
      email.split('@')[0].replace(/[^a-z0-9._-]/gi, '').slice(0, 24) || 'user'

    setSubmitting(true)
    try {
      await register({
        name: form.name.trim(),
        email,
        username,
        password: form.password,
      })
      navigate(ROUTES.HOME, { replace: true })
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
    <AuthLayout
      title="Create your account"
      subtitle="Join PahadLink for authentic Himalayan goods"
    >
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        {message && <p className="auth-alert auth-alert--error">{message}</p>}

        <div className="form-field">
          <div className="input-wrapper">
            <UserIcon className="input-icon" size={18} />
            <input
              type="text"
              placeholder="Your full name"
              id="fullname"
              name="name"
              autoComplete="name"
              value={form.name}
              onChange={onChange}
              required
            />
            <label htmlFor="fullname">Full name</label>
          </div>
        </div>

        <div className="form-field">
          <div className="input-wrapper">
            <MailIcon className="input-icon" size={18} />
            <input
              type="email"
              placeholder="you@example.com"
              id="email"
              name="email"
              autoComplete="email"
              value={form.email}
              onChange={onChange}
              required
            />
            <label htmlFor="email">Email</label>
          </div>
        </div>

        <PasswordField
          id="reg-password"
          name="password"
          label="Password"
          placeholder="Min. 6 characters"
          autoComplete="new-password"
          value={form.password}
          onChange={onChange}
          minLength={6}
        />

        <label className="remember-me terms-check">
          <input
            type="checkbox"
            name="terms"
            checked={form.terms}
            onChange={onChange}
            required
          />
          <span>
            I agree to the <a href="#">Terms &amp; Conditions</a>
          </span>
        </label>

        <button className="btn-submit" type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create account'}
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
          Sign up with Google
        </button>

        <p className="auth-switch">
          Already have an account? <Link to={ROUTES.LOGIN}>Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  )
}

export default Register
