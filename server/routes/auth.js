import { Router } from 'express'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { ROLES } from '../models/User.js'
import { users } from '../services/users.js'
import { protect, authorize, signToken } from '../middleware/auth.js'
import { isFileDbMode } from '../config/db.js'
import { PASSWORD_MIN_LENGTH } from '../config/constants.js'
import { verifyFirebaseIdToken } from '../services/verifyFirebaseIdToken.js'
import { sendMail } from '../services/mail.js'

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
    let username = String(req.body.username || '').trim().toLowerCase()
    const password = String(req.body.password || '')

    if (!username && email.includes('@')) {
      username = email
        .split('@')[0]
        .replace(/[^a-z0-9._-]/g, '')
        .slice(0, 24)
    }

    if (!name || !email || !username || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' })
    }

    if (username.length < 3) {
      username = `${username}${Math.floor(100 + Math.random() * 900)}`
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({
        message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      })
    }

    const emailTaken = await users.findOne({ email })
    if (emailTaken) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    let uniqueUsername = username.slice(0, 30)
    let attempt = 0
    while (await users.findOne({ username: uniqueUsername })) {
      attempt += 1
      const suffix = String(Math.floor(100 + Math.random() * 900))
      uniqueUsername = `${username.slice(0, 26)}${suffix}`
      if (attempt > 8) {
        return res.status(409).json({ message: 'Could not create a unique username. Try again.' })
      }
    }

    const user = await users.create({
      name,
      email,
      username: uniqueUsername,
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

    const user = await users.findOne(
      { $or: [{ username }, { email: username }] },
      { select: '+password' }
    )

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

    const user = await users.findOne({ email: email.toLowerCase().trim() })
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

    const front =
      (process.env.FRONTEND_URL || '')
        .split(',')
        .map((s) => s.trim())
        .find(Boolean) || 'http://localhost:5173'
    let base = front.replace(/\/$/, '')
    // GitHub Pages project site lives under /pahadlink
    try {
      const u = new URL(base)
      if (
        /\.github\.io$/i.test(u.hostname) &&
        (u.pathname === '/' || u.pathname === '')
      ) {
        base = `${u.origin}/pahadlink`
      }
    } catch {
      // keep base as-is
    }
    const resetUrl = `${base}/#/reset-password?token=${encodeURIComponent(resetToken)}`

    await sendMail({
      to: user.email,
      subject: 'Reset your PahadLink password',
      html: `
        <p>Hi ${user.name || 'there'},</p>
        <p>We received a request to reset your password. Use this link within 1 hour:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
    })

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
    if (password.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({
        message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      })
    }

    const hashed = crypto.createHash('sha256').update(token).digest('hex')
    const user = await users.findOne(
      {
        resetPasswordToken: hashed,
        resetPasswordExpires: { $gt: new Date() },
      },
      { select: '+resetPasswordToken +resetPasswordExpires' }
    )

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' })
    }

    if (isFileDbMode()) {
      user.password = await bcrypt.hash(password, 10)
    } else {
      user.password = password
    }
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    return res.json({ message: 'Password updated successfully. You can sign in now.' })
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Reset failed' })
  }
})

/** POST /api/auth/google — Firebase Google ID token → app JWT session */
router.post('/google', async (req, res) => {
  try {
    const idToken = String(req.body.idToken || req.body.credential || '').trim()
    if (!idToken) {
      return res.status(400).json({ message: 'Google sign-in token is required' })
    }

    const decoded = await verifyFirebaseIdToken(idToken)
    const googleId = String(decoded.sub || '')
    const email = String(decoded.email || '')
      .trim()
      .toLowerCase()
    const name = String(decoded.name || email.split('@')[0] || 'Google user').trim()

    if (!googleId || !email) {
      return res.status(400).json({ message: 'Google account is missing email' })
    }

    let user = await users.findOne({ googleId })
    if (!user) {
      user = await users.findOne({ email })
      if (user) {
        user.googleId = googleId
        if (!user.name && name) user.name = name
        await user.save()
      }
    }

    if (!user) {
      let base =
        email
          .split('@')[0]
          .replace(/[^a-z0-9._-]/g, '')
          .slice(0, 24) || 'user'
      if (base.length < 3) base = `user${base}`

      let uniqueUsername = base.slice(0, 30)
      let attempt = 0
      while (await users.findOne({ username: uniqueUsername })) {
        attempt += 1
        const suffix = String(Math.floor(100 + Math.random() * 900))
        uniqueUsername = `${base.slice(0, 26)}${suffix}`
        if (attempt > 8) {
          return res.status(409).json({ message: 'Could not create account. Try again.' })
        }
      }

      user = await users.create({
        name,
        email,
        username: uniqueUsername,
        googleId,
        role: 'customer',
      })
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' })
    }

    return res.json(authResponse(user))
  } catch (error) {
    const status = error.status || 500
    return res.status(status).json({
      message: error.message || 'Google login failed',
    })
  }
})

router.get('/me', protect, (req, res) => {
  res.json({ user: req.user.toSafeJSON() })
})

router.patch('/users/:id/role', protect, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.body
    if (!ROLES.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Allowed: ${ROLES.join(', ')}`,
      })
    }

    const user = await users.findByIdAndUpdate(req.params.id, { role })
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

router.get('/users', protect, authorize('admin'), async (_req, res) => {
  const list = await users.findAllSorted()
  res.json({ users: list.map((u) => u.toSafeJSON()) })
})

export default router
