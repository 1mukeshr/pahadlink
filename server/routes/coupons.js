import { Router } from 'express'
import mongoose from 'mongoose'
import Order from '../models/Order.js'
import { applyCoupon, normalizeCouponCode } from '../services/coupons.js'
import { optionalProtect } from '../middleware/auth.js'

const router = Router()

/** Active prior orders only — cancelled does not block first-order free delivery */
async function isFirstOrderForEmail(email) {
  const clean = String(email || '').trim().toLowerCase()
  if (!clean || mongoose.connection.readyState !== 1) return true
  const prior = await Order.countDocuments({
    customerEmail: clean,
    status: { $nin: ['cancelled'] },
  })
  return prior === 0
}

/** Public: every customer gets free delivery on their first order */
router.get('/first-order', optionalProtect, async (req, res) => {
  try {
    const email = String(req.query.email || req.user?.email || '')
      .trim()
      .toLowerCase()
    const isFirstOrder = await isFirstOrderForEmail(email)
    res.json({ isFirstOrder, freeDelivery: isFirstOrder })
  } catch {
    res.json({ isFirstOrder: true, freeDelivery: true })
  }
})

/** Validate a coupon against cart subtotal */
router.post('/validate', optionalProtect, async (req, res) => {
  try {
    const code = normalizeCouponCode(req.body?.code)
    const subtotal = Math.max(0, Number(req.body?.subtotal) || 0)
    const email = String(req.body?.email || req.user?.email || '')
      .trim()
      .toLowerCase()

    const isFirstOrder = await isFirstOrderForEmail(email)
    const result = applyCoupon(subtotal, code, { isFirstOrder })
    if (!result.ok) {
      return res.status(400).json({ ...result, isFirstOrder })
    }

    res.json({ ...result, isFirstOrder })
  } catch (error) {
    res.status(500).json({
      ok: false,
      discount: 0,
      message: error.message || 'Could not validate coupon',
    })
  }
})

export default router
