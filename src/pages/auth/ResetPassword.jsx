import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { LockIcon } from '../../components/icons'
import AuthLayout from '../../components/auth/AuthLayout'
import { resetPassword } from '../../services/authService'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [token, setToken] = useState(searchParams.get('token') || '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      const data = await resetPassword(token, password)
      setSuccess(data.message)
      setTimeout(() => navigate('/login', { replace: true }), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Choose a new password for your account"
    >
      <form className="auth-form" onSubmit={onSubmit}>
        {error && <p className="auth-alert auth-alert--error">{error}</p>}
        {success && <p className="auth-alert auth-alert--success">{success}</p>}

        {!searchParams.get('token') && (
          <div className="form-field">
            <div className="input-wrapper">
              <LockIcon className="input-icon" size={18} />
              <input
                type="text"
                placeholder="Paste reset token"
                id="reset-token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
              <label htmlFor="reset-token">Reset token</label>
            </div>
          </div>
        )}

        <div className="form-field">
          <div className="input-wrapper">
            <LockIcon className="input-icon" size={18} />
            <input
              type="password"
              placeholder="Min. 6 characters"
              id="new-password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
            <label htmlFor="new-password">New password</label>
          </div>
        </div>

        <div className="form-field">
          <div className="input-wrapper">
            <LockIcon className="input-icon" size={18} />
            <input
              type="password"
              placeholder="Confirm new password"
              id="confirm-password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={6}
              required
            />
            <label htmlFor="confirm-password">Confirm password</label>
          </div>
        </div>

        <button className="btn-submit" type="submit" disabled={submitting}>
          {submitting ? 'Updating…' : 'Update password'}
        </button>

        <p className="auth-switch">
          <Link to="/login">Back to sign in</Link>
        </p>
      </form>
    </AuthLayout>
  )
}

export default ResetPassword
