import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import { connectDB } from './config/db.js'
import { fileUserStore } from './store/fileUserStore.js'
import authRoutes from './routes/auth.js'
import orderRoutes from './routes/orders.js'
import crmRoutes from './routes/crm.js'
import contactRoutes from './routes/contact.js'

const app = express()
const PORT = process.env.PORT || 5000

app.set('trust proxy', 1)

const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

function isAllowedOrigin(origin) {
  if (!origin) return true
  if (allowedOrigins.length === 0) return true
  if (allowedOrigins.includes(origin)) return true
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return true
  // GitHub Pages project + user sites
  if (/^https:\/\/[\w-]+\.github\.io$/i.test(origin)) return true
  return false
}

app.use(
  cors({
    origin: (origin, cb) => {
      if (isAllowedOrigin(origin)) return cb(null, true)
      return cb(new Error(`CORS blocked for origin: ${origin}`))
    },
    credentials: true,
  })
)
app.use(express.json({ limit: '1mb' }))

function healthPayload() {
  const dbState = mongoose.connection.readyState
  const usingFile = fileUserStore.enabled
  return {
    ok: dbState === 1 || usingFile,
    service: 'pahadlink-api',
    database: usingFile ? 'file-store' : 'Pahadi_link',
    mongo: dbState === 1 ? 'connected' : usingFile ? 'file-fallback' : 'disconnected',
    time: new Date().toISOString(),
  }
}

app.get('/', (_req, res) => {
  res.json(healthPayload())
})

app.get('/api/health', (_req, res) => {
  const payload = healthPayload()
  res.status(payload.ok ? 200 : 503).json(payload)
})

app.use('/api/auth', authRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/crm', crmRoutes)
app.use('/api/contact', contactRoutes)

app.use((err, _req, res, _next) => {
  console.error(err)
  const isCors = String(err.message || '').startsWith('CORS blocked')
  res.status(isCors ? 403 : err.status || 500).json({
    message: err.message || 'Internal server error',
  })
})

async function start() {
  try {
    await connectDB()
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`API running on port ${PORT}`)
      console.log('Database: Pahadi_link (users, orders, crmleads)')
    })
  } catch (error) {
    console.error('Failed to start server:', error.message)
    console.error(
      'Tip: Local → start MongoDB. Production → set MONGODB_URI (Atlas) on the host.'
    )
    process.exit(1)
  }
}

start()
