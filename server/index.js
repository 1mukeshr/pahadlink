import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { connectDB } from './config/db.js'
import authRoutes from './routes/auth.js'
import orderRoutes from './routes/orders.js'
import crmRoutes from './routes/crm.js'
import contactRoutes from './routes/contact.js'

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'pahadlink-api',
    database: 'Pahadi_link',
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/crm', crmRoutes)
app.use('/api/contact', contactRoutes)

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  })
})

async function start() {
  try {
    await connectDB()
    app.listen(PORT, () => {
      console.log(`API running on http://localhost:${PORT}`)
      console.log('Database: Pahadi_link (users, orders, crmleads)')
    })
  } catch (error) {
    console.error('Failed to start server:', error.message)
    console.error('Tip: Start MongoDB locally, then run npm run server again.')
    process.exit(1)
  }
}

start()
