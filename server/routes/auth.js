import { Router } from 'express'
import crypto from 'crypto'
import User, { ROLES } from '../models/User.js'
import { protect, authorize, signToken } from '../middleware/auth.js'

const router = Router()

function authResponse(user) {
  return {
    token: signToken(user),
    user: user.toSafeJSON(),
  }
}

/** POST /api/auth/register */
router.post('/register', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim()
    const email = String(req.body.email || '').trim().toLowerCase()
    const username = String(req.body.username || '').trim().toLowerCase()
    const password = String(req.body.password || '')

    if (!name || !email || !username || !password) {
      return res.status(400).json({ message: 'Name, email, username and password are required' })
    }

    if (username.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' })
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    const exists = await User.findOne({
      $or: [{ email }, { username }],
    })

    if (exists) {
      return res.status(409).json({ message: 'Email or username already registered' })
    }

    const user = await User.create({
      name,
      email,
      username,
      password,
      role: 'customer',
    })

    return res.status(201).json(authResponse(user))
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email or username already registered' })
    }
    return res.status(500).json({ message: error.message || 'Registration failed' })
  }
})

/** POST /api/auth/login */
router.post('/login', async (req, res) => {
  try {
    const username = String(req.body.username || '').trim().toLowerCase()
    const password = String(req.body.password || '')

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' })
    }

    const user = await User.findOne({
      $or: [{ username }, { email: username }],
    }).select('+password')

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid username or password' })
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' })
    }

    return res.json(authResponse(user))
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Login failed' })
  }
})

/** POST /api/auth/forgot-password */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })

    // Always same message (don't leak whether email exists)
    const okMessage = {
      message: 'If an account exists with that email, reset instructions have been sent.',
    }

    if (!user) {
      return res.json(okMessage)
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000)
    await user.save({ validateBeforeSave: false })

    // Email service not configured yet — return token in dev for testing
    const payload = { ...okMessage }
    if (process.env.NODE_ENV !== 'production') {
      payload.devResetToken = resetToken
      payload.devHint = 'Use POST /api/auth/reset-password with this token (dev only)'
    }

    return res.json(payload)
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Request failed' })
  }
})

/** POST /api/auth/reset-password */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' })
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    const hashed = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires')

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' })
    }

    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    return res.json({ message: 'Password updated successfully. You can sign in now.' })
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Reset failed' })
  }
})

/** POST /api/auth/google — stub until Google OAuth credentials are set */
router.post('/google', async (req, res) => {
  const { credential, idToken } = req.body
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(501).json({
      message: 'Google Login is not configured yet. Set GOOGLE_CLIENT_ID in .env',
      status: 'coming_soon',
    })
  }

  // Placeholder for Google token verification
  return res.status(501).json({
    message: 'Google token verification pending. Credential received.',
    status: 'coming_soon',
    received: Boolean(credential || idToken),
  })
})

/** POST /api/auth/otp/send — Future OTP Login */
router.post('/otp/send', (_req, res) => {
  return res.status(501).json({
    message: 'OTP Login is planned for a future release',
    status: 'coming_soon',
  })
})

/** POST /api/auth/otp/verify — Future OTP Login */
router.post('/otp/verify', (_req, res) => {
  return res.status(501).json({
    message: 'OTP Login is planned for a future release',
    status: 'coming_soon',
  })
})

/** GET /api/auth/me */
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user.toSafeJSON() })
})

/** PATCH /api/auth/users/:id/role — Admin role management */
router.patch('/users/:id/role', protect, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.body
    if (!ROLES.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Allowed: ${ROLES.join(', ')}`,
      })
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    )

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.json({
      message: `Role updated to ${role}`,
      user: user.toSafeJSON(),
    })
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Role update failed' })
  }
})

/** GET /api/auth/users — Admin: list users */
router.get('/users', protect, authorize('admin'), async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 })
  res.json({ users: users.map((u) => u.toSafeJSON()) })
})

export default router
