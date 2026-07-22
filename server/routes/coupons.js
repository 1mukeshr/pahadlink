import { Router } from 'express'
import mongoose from 'mongoose'
import Order from '../models/Order.js'
import { applyCoupon, normalizeCouponCode } from '../services/coupons.js'
import { optionalProtect } from '../middleware/auth.js'

const router = Router()

/** Validate a coupon against cart subtotal */
router.post('/validate', optionalProtect, async (req, res) => {
  try {
    const code = normalizeCouponCode(req.body?.code)
    const subtotal = Math.max(0, Number(req.body?.subtotal) || 0)
    const email = String(req.body?.email || req.user?.email || '')
      .trim()
      .toLowerCase()

    let isFirstOrder = true
    if (email && mongoose.connection.readyState === 1) {
      const prior = await Order.countDocuments({ customerEmail: email })
      isFirstOrder = prior === 0
    }

    const result = applyCoupon(subtotal, code, { isFirstOrder })
    if (!result.ok) {
      return res.status(400).json(result)
    }

    res.json(result)
  } catch (error) {
    res.status(500).json({
      ok: false,
      discount: 0,
      message: error.message || 'Could not validate coupon',
    })
  }
})

export default router
