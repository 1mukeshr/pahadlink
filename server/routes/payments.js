import { Router } from 'express'
import mongoose from 'mongoose'
import Order from '../models/Order.js'
import { protect } from '../middleware/auth.js'
import { notifyPaymentCompleted } from '../services/notifyOrder.js'
import { restoreStock } from '../services/inventory.js'
import {
  createRazorpayOrder,
  getRazorpayKeyId,
  isRazorpayConfigured,
  verifyPaymentSignature,
} from '../services/razorpay.js'

const router = Router()

const ONLINE_METHODS = new Set(['upi', 'card', 'netbanking', 'wallet', 'razorpay'])

function requireMongo(_req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'Payments unavailable — database disconnected.',
    })
  }
  return next()
}

function fireAndForget(promise) {
  Promise.resolve(promise).catch((err) => {
    console.error('[payments]', err?.message || err)
  })
}

function ownsOrder(req, order) {
  const uid = String(req.user?._id || req.user?.id || '')
  const oid = String(order.user || '')
  if (uid && oid && uid === oid) return true
  const email = String(req.user?.email || '').trim().toLowerCase()
  return email && email === String(order.customerEmail || '').toLowerCase()
}

/** Public: whether Razorpay is live on this API */
router.get('/status', (_req, res) => {
  res.json({
    razorpay: isRazorpayConfigured(),
    keyId: isRazorpayConfigured() ? getRazorpayKeyId() : '',
  })
})

/**
 * Create a Razorpay order for an existing unpaid PahadLink order.
 * Body: { orderId } — Mongo id or orderNumber
 */
router.post('/razorpay/create', requireMongo, protect, async (req, res) => {
  try {
    if (!isRazorpayConfigured()) {
      return res.status(503).json({
        message:
          'Online payment is not configured yet. Use Cash on Delivery, or add Razorpay keys on the server.',
      })
    }

    const ref = String(req.body?.orderId || req.body?.orderNumber || '').trim()
    if (!ref) {
      return res.status(400).json({ message: 'orderId is required' })
    }

    const order =
      (mongoose.isValidObjectId(ref) && (await Order.findById(ref))) ||
      (await Order.findOne({ orderNumber: ref }))

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }
    if (!ownsOrder(req, order) && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not allowed for this order' })
    }
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Order is already paid' })
    }
    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Cancelled orders cannot be paid' })
    }
    if (order.paymentMethod === 'cod') {
      return res.status(400).json({
        message: 'This order is Cash on Delivery — no online payment needed',
      })
    }
    if (!ONLINE_METHODS.has(order.paymentMethod)) {
      return res.status(400).json({ message: 'Unsupported payment method for Razorpay' })
    }

    const rzpOrder = await createRazorpayOrder({
      amountInr: order.totalAmount,
      receipt: order.orderNumber,
      notes: {
        pahadlinkOrderId: order._id.toString(),
        orderNumber: order.orderNumber,
        paymentMethod: order.paymentMethod,
      },
    })

    order.razorpayOrderId = rzpOrder.id
    if (order.paymentStatus === 'failed') {
      order.paymentStatus = 'pending'
    }
    await order.save()

    res.json({
      keyId: getRazorpayKeyId(),
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency || 'INR',
      order: order.toSafeJSON(),
      preference: order.paymentMethod,
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to start Razorpay payment' })
  }
})

/**
 * Verify Razorpay checkout success and mark order paid.
 * Body: { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
router.post('/razorpay/verify', requireMongo, protect, async (req, res) => {
  try {
    if (!isRazorpayConfigured()) {
      return res.status(503).json({ message: 'Razorpay is not configured' })
    }

    const {
      orderId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    } = req.body || {}

    const ref = String(orderId || '').trim()
    if (!ref || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        message: 'orderId and Razorpay payment fields are required',
      })
    }

    const order =
      (mongoose.isValidObjectId(ref) && (await Order.findById(ref))) ||
      (await Order.findOne({ orderNumber: ref }))

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }
    if (!ownsOrder(req, order) && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not allowed for this order' })
    }

    if (order.razorpayOrderId && order.razorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({ message: 'Razorpay order mismatch' })
    }

    const ok = verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    })
    if (!ok) {
      order.paymentStatus = 'failed'
      order.timeline.push({
        status: order.status,
        note: 'Payment verification failed',
        by: req.user?.email || order.customerEmail,
        at: new Date(),
      })
      await order.save()
      return res.status(400).json({ message: 'Invalid payment signature' })
    }

    const wasPaid = order.paymentStatus === 'paid'
    order.razorpayOrderId = razorpayOrderId
    order.razorpayPaymentId = razorpayPaymentId
    order.paymentStatus = 'paid'
    if (order.status === 'pending') {
      order.status = 'confirmed'
      order.timeline.push({
        status: 'confirmed',
        note: 'Payment received · order confirmed',
        by: req.user?.email || order.customerEmail,
        at: new Date(),
      })
    } else {
      order.timeline.push({
        status: order.status,
        note: `Payment received (${razorpayPaymentId})`,
        by: req.user?.email || order.customerEmail,
        at: new Date(),
      })
    }
    await order.save()

    if (!wasPaid) {
      fireAndForget(notifyPaymentCompleted(order))
    }

    res.json({ order: order.toSafeJSON() })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to verify payment' })
  }
})

/**
 * Mark online payment as failed / abandoned (customer closed Razorpay).
 * Body: { orderId, reason? }
 */
router.post('/razorpay/fail', requireMongo, protect, async (req, res) => {
  try {
    const ref = String(req.body?.orderId || '').trim()
    if (!ref) {
      return res.status(400).json({ message: 'orderId is required' })
    }

    const order =
      (mongoose.isValidObjectId(ref) && (await Order.findById(ref))) ||
      (await Order.findOne({ orderNumber: ref }))

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }
    if (!ownsOrder(req, order) && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not allowed for this order' })
    }
    if (order.paymentStatus === 'paid') {
      return res.json({ order: order.toSafeJSON() })
    }

    const reason = String(
      req.body?.reason || 'Online payment cancelled or failed'
    ).slice(0, 200)

    if (order.stockDeducted && order.status !== 'cancelled') {
      restoreStock(order.items || [])
      order.stockDeducted = false
    }

    order.paymentStatus = 'failed'
    order.status = 'cancelled'
    order.timeline.push({
      status: 'cancelled',
      note: reason,
      by: req.user?.email || order.customerEmail,
      at: new Date(),
    })
    await order.save()

    res.json({ order: order.toSafeJSON() })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update payment status' })
  }
})

export default router
