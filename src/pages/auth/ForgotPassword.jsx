import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MailIcon } from '../../components/icons'
import AuthLayout from '../../components/auth/AuthLayout'
import { forgotPassword } from '../../services/authService'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [devToken, setDevToken] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setDevToken('')
    setSubmitting(true)
    try {
      const data = await forgotPassword(email)
      setSuccess(data.message)
      if (data.devResetToken) {
        setDevToken(data.devResetToken)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Forgot password">
      <form className="auth-form" onSubmit={onSubmit}>
        {error && <p className="auth-alert auth-alert--error">{error}</p>}
        {success && <p className="auth-alert auth-alert--success">{success}</p>}

        <div className="form-field">
          <div className="input-wrapper">
            <MailIcon className="input-icon" size={18} />
            <input
              type="email"
              placeholder="you@example.com"
              id="forgot-email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label htmlFor="forgot-email">Email</label>
          </div>
        </div>

        <button className="btn-submit" type="submit" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send reset link'}
        </button>

        {devToken && (
          <p className="auth-dev-token">
            Dev reset token:{' '}
            <Link to={`/reset-password?token=${encodeURIComponent(devToken)}`}>
              Reset password now
            </Link>
          </p>
        )}

        <p className="auth-switch">
          Remembered it? <Link to="/login">Back to sign in</Link>
        </p>
      </form>
    </AuthLayout>
  )
}

export default ForgotPassword
