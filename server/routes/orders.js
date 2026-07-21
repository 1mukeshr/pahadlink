import { Router } from 'express'
import mongoose from 'mongoose'
import Order, {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  STATUS_TRANSITIONS,
  STATUS_TIMELINE_NOTES,
  buildOrderNumber,
  canTransition,
} from '../models/Order.js'
import { protect, authorize } from '../middleware/auth.js'
import {
  notifyOrderConfirmed,
  notifyPaymentCompleted,
} from '../services/notifyOrder.js'
import {
  applyCoupon,
  buildOrderTotals,
  normalizeCouponCode,
} from '../services/coupons.js'
import {
  decrementStock,
  restoreStock,
  getInventorySnapshot,
  getStock,
} from '../services/inventory.js'
import { priceOrderItems } from '../services/catalog.js'
import { MAX_QTY_PER_ITEM_PER_CUSTOMER } from '../config/constants.js'

const router = Router()

const PAYMENT_METHODS = ['cod', 'upi', 'card']

/** Seller can see pending COD and move them into fulfilment */
const SELLER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
  'return_requested',
]

function requireMongo(_req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'Orders unavailable — database disconnected. Start MongoDB or set MONGODB_URI.',
    })
  }
  return next()
}

function fireAndForget(promise) {
  Promise.resolve(promise).catch((err) => {
    console.error('[orders] notification error:', err.message)
  })
}

function pushTimeline(order, status, note, by) {
  if (!Array.isArray(order.timeline)) order.timeline = []
  order.timeline.push({
    status,
    note: note || '',
    by: by || 'system',
    at: new Date(),
  })
}

async function isFirstOrderEmail(email) {
  const clean = String(email || '').trim().toLowerCase()
  if (!clean) return true
  const prior = await Order.countDocuments({ customerEmail: clean })
  return prior === 0
}

function ensureStockForConfirm(order) {
  if (order.stockDeducted) return { ok: true }
  const result = decrementStock(order.items)
  if (!result.ok) return result
  order.stockDeducted = true
  return { ok: true }
}

/** day | week | month | year → { from, to } inclusive calendar range */
function periodDateRange(period = 'week') {
  const now = new Date()
  const to = new Date(now)
  to.setHours(23, 59, 59, 999)

  const from = new Date(now)
  from.setHours(0, 0, 0, 0)

  const key = String(period || 'week').toLowerCase()
  if (key === 'day') {
    // today only
  } else if (key === 'month') {
    from.setDate(1)
  } else if (key === 'year') {
    from.setMonth(0, 1)
  } else {
    // week — last 7 calendar days including today
    from.setDate(from.getDate() - 6)
  }

  return { from, to, period: ['day', 'week', 'month', 'year'].includes(key) ? key : 'week' }
}

function applyCreatedAtRange(filter, period) {
  if (!period) return filter
  const { from, to } = periodDateRange(period)
  filter.createdAt = { $gte: from, $lte: to }
  return filter
}

/** Customer: my orders */
router.get('/mine', requireMongo, protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id
    const email = String(req.user.email || '').trim().toLowerCase()
    const filter = {
      $or: [{ user: userId }, ...(email ? [{ customerEmail: email }] : [])],
    }
    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(100)
    res.json({ orders: orders.map((o) => o.toSafeJSON()) })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load orders' })
  }
})

/** Admin + Seller: list orders */
router.get('/', requireMongo, protect, authorize('admin', 'seller'), async (req, res) => {
  try {
    const { status, q, period } = req.query
    const filter = {}

    if (req.user.role === 'seller') {
      filter.status = { $in: SELLER_STATUSES }
      if (status && SELLER_STATUSES.includes(status)) {
        filter.status = status
      }
    } else if (status && ORDER_STATUSES.includes(status)) {
      filter.status = status
    }

    applyCreatedAtRange(filter, period)

    if (q) {
      const text = String(q).trim()
      filter.$or = [
        { orderNumber: new RegExp(text, 'i') },
        { customerName: new RegExp(text, 'i') },
        { customerEmail: new RegExp(text, 'i') },
        { customerPhone: new RegExp(text, 'i') },
        { trackingNumber: new RegExp(text, 'i') },
      ]
    }

    const limit = period === 'year' ? 1000 : period === 'month' ? 500 : 200
    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(limit)
    res.json({ orders: orders.map((o) => o.toSafeJSON()) })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load orders' })
  }
})

/** Admin: order stats */
router.get('/stats', requireMongo, protect, authorize('admin', 'seller'), async (req, res) => {
  try {
    const base =
      req.user.role === 'seller' ? { status: { $in: SELLER_STATUSES } } : {}
    applyCreatedAtRange(base, req.query.period)

    const [
      total,
      pending,
      confirmed,
      processing,
      shipped,
      outForDelivery,
      delivered,
      cancelled,
      returns,
      revenue,
    ] = await Promise.all([
      Order.countDocuments(base),
      Order.countDocuments({ ...base, status: 'pending' }),
      Order.countDocuments({ ...base, status: 'confirmed' }),
      Order.countDocuments({ ...base, status: 'processing' }),
      Order.countDocuments({ ...base, status: 'shipped' }),
      Order.countDocuments({ ...base, status: 'out_for_delivery' }),
      Order.countDocuments({ ...base, status: 'delivered' }),
      Order.countDocuments({ ...base, status: 'cancelled' }),
      Order.countDocuments({
        ...base,
        status: { $in: ['return_requested', 'returned'] },
      }),
      Order.aggregate([
        { $match: { paymentStatus: 'paid', ...base } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ])

    const { from, to, period } = periodDateRange(req.query.period || 'week')

    res.json({
      total,
      pending,
      confirmed,
      processing,
      shipped,
      out_for_delivery: outForDelivery,
      delivered,
      cancelled,
      returns,
      revenue: revenue[0]?.total || 0,
      period,
      from: from.toISOString(),
      to: to.toISOString(),
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load stats' })
  }
})

/** Public: stock levels for storefront (read-only) */
router.get('/stock', (_req, res) => {
  try {
    res.json({ items: getInventorySnapshot() })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load stock' })
  }
})

/** Admin: inventory snapshot */
router.get('/inventory', protect, authorize('admin'), (_req, res) => {
  try {
    res.json({ items: getInventorySnapshot() })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load inventory' })
  }
})

/**
 * Create order (logged-in customers).
 */
router.post('/', requireMongo, protect, async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      items,
      shippingAddress,
      notes,
      paymentStatus,
      paymentMethod,
      status,
      couponCode,
    } = req.body

    if (!customerName || !customerEmail || !Array.isArray(items) || !items.length) {
      return res.status(400).json({
        message: 'customerName, customerEmail and items are required',
      })
    }

    const addr = shippingAddress && typeof shippingAddress === 'object'
      ? shippingAddress
      : {}
    const line1 = String(addr.line1 || addr.address || '').trim()
    const city = String(addr.city || '').trim()
    const state = String(addr.state || '').trim()
    const pincode = String(addr.pincode || '').trim()
    const phone = String(customerPhone || '').trim()
    if (!line1 || !city || !state || !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        message: 'Complete shipping address is required (address, city, state, 6-digit pincode)',
      })
    }
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({
        message: 'A valid phone number is required',
      })
    }
    const cleanAddress = { line1, city, state, pincode }

    const priced = priceOrderItems(items)
    if (!priced.ok) {
      return res.status(400).json({ message: priced.message || 'Invalid order items' })
    }
    const cleanItems = priced.items

    // Cap: max 3 of each product per order (unlimited different products)
    const qtyByProduct = new Map()
    for (const line of cleanItems) {
      const id = String(line.productId || '').trim()
      if (!id) continue
      qtyByProduct.set(id, (qtyByProduct.get(id) || 0) + Number(line.quantity || 0))
    }
    for (const [productId, qty] of qtyByProduct) {
      if (qty > MAX_QTY_PER_ITEM_PER_CUSTOMER) {
        return res.status(400).json({
          message: `You can buy at most ${MAX_QTY_PER_ITEM_PER_CUSTOMER} of each product`,
          productId,
          max: MAX_QTY_PER_ITEM_PER_CUSTOMER,
          requested: qty,
        })
      }
    }

    const email = String(customerEmail).trim().toLowerCase()

    // Reject if any line is out of stock
    const shortages = []
    for (const line of cleanItems) {
      const available = getStock(line.productId, line.size)
      if (available < line.quantity) {
        shortages.push({
          productId: line.productId,
          size: line.size || null,
          need: line.quantity,
          available,
        })
      }
    }
    if (shortages.length) {
      return res.status(409).json({
        message: 'Insufficient stock for one or more items',
        shortages,
      })
    }

    const itemsTotal = cleanItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )

    const firstOrder = await isFirstOrderEmail(email)
    const requestedCode = normalizeCouponCode(couponCode)

    if (requestedCode) {
      const check = applyCoupon(itemsTotal, requestedCode, {
        isFirstOrder: firstOrder,
      })
      if (!check.ok) {
        return res.status(400).json({ message: check.message })
      }
    }

    const totals = buildOrderTotals(itemsTotal, requestedCode, {
      isFirstOrder: firstOrder,
    })

    const isAdmin = req.user?.role === 'admin'
    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ message: 'Select a valid payment method' })
    }
    const method = paymentMethod

    let nextPaymentStatus = 'pending'
    let nextStatus = 'pending'

    if (isAdmin && PAYMENT_STATUSES.includes(paymentStatus)) {
      nextPaymentStatus = paymentStatus
    }

    if (isAdmin && ORDER_STATUSES.includes(status)) {
      nextStatus = status
    }

    // Reserve stock at place-order so pending COD cannot oversell
    const stock = decrementStock(cleanItems)
    if (!stock.ok) {
      return res.status(409).json({
        message: stock.message || 'Insufficient stock',
        shortages: stock.shortages,
      })
    }
    const stockDeducted = true

    let order
    try {
      let lastErr
      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          order = await Order.create({
            orderNumber: await buildOrderNumber(),
            user: req.user?._id || req.user?.id || null,
            customerName: String(customerName).trim(),
            customerEmail: email,
            customerPhone: String(customerPhone || '').trim(),
            items: cleanItems,
            itemsTotal: totals.itemsTotal,
            shippingFee: totals.shippingFee,
            discountAmount: totals.discountAmount,
            couponCode: totals.couponCode,
            totalAmount: totals.totalAmount,
            shippingAddress: cleanAddress,
            notes: String(notes || '').trim(),
            paymentMethod: method,
            status: nextStatus,
            paymentStatus: nextPaymentStatus,
            stockDeducted,
            timeline: [
              {
                status: nextStatus,
                note: 'Order placed',
                by: req.user?.email || email,
                at: new Date(),
              },
            ],
          })
          lastErr = null
          break
        } catch (createErr) {
          lastErr = createErr
          // Duplicate order number race — allocate again
          if (createErr?.code === 11000 && /orderNumber/i.test(String(createErr.message))) {
            continue
          }
          throw createErr
        }
      }
      if (!order) throw lastErr || new Error('Failed to allocate order number')
    } catch (createErr) {
      restoreStock(cleanItems)
      throw createErr
    }

    fireAndForget(notifyOrderConfirmed(order))

    if (order.paymentStatus === 'paid') {
      fireAndForget(notifyPaymentCompleted(order))
    }

    res.status(201).json({ order: order.toSafeJSON() })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create order' })
  }
})

/** Customer: request return on delivered order */
router.post('/:id/return', requireMongo, protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Order not found' })

    const userId = String(req.user._id || req.user.id)
    const email = String(req.user.email || '').toLowerCase()
    const owns =
      String(order.user || '') === userId ||
      order.customerEmail === email
    if (!owns && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not your order' })
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Only delivered orders can be returned' })
    }

    const reason = String(req.body.reason || '').trim()
    order.status = 'return_requested'
    order.returnReason = reason
    pushTimeline(order, 'return_requested', reason || 'Return requested', email)
    await order.save()

    res.json({ message: 'Return requested', order: order.toSafeJSON() })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to request return' })
  }
})

/** Customer: leave review on delivered/returned order */
router.post('/:id/review', requireMongo, protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Order not found' })

    const userId = String(req.user._id || req.user.id)
    const email = String(req.user.email || '').toLowerCase()
    const owns =
      String(order.user || '') === userId ||
      order.customerEmail === email
    if (!owns) {
      return res.status(403).json({ message: 'Not your order' })
    }

    if (!['delivered', 'returned'].includes(order.status)) {
      return res.status(400).json({ message: 'Review after delivery only' })
    }

    const rating = Number(req.body.rating)
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be 1–5' })
    }

    const comment = String(req.body.comment || '').trim().slice(0, 500)

    order.review = {
      rating,
      comment,
      createdAt: new Date(),
    }
    await order.save()

    // Also publish product-level ratings (1–5) for each ordered item
    try {
      const { createReviewsFromOrder } = await import('./reviews.js')
      await createReviewsFromOrder(order, { rating, comment })
    } catch (err) {
      console.error('[orders] product review sync:', err.message)
    }

    res.json({ message: 'Review saved', order: order.toSafeJSON() })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to save review' })
  }
})

/** Admin + Seller: update order status / payment / shipping */
router.patch('/:id', requireMongo, protect, authorize('admin', 'seller'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    const role = req.user.role
    const actor = req.user.email || role
    const body = req.body || {}
    const {
      status,
      paymentStatus,
      notes,
      trackingNumber,
      courier,
    } = body

    const wasPaid = order.paymentStatus === 'paid'
    const prevStatus = order.status

    if (status) {
      if (!ORDER_STATUSES.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' })
      }

      if (role === 'seller') {
        const sellerAllowed = [
          'confirmed',
          'processing',
          'shipped',
          'out_for_delivery',
          'delivered',
          'returned',
        ]
        if (!sellerAllowed.includes(status)) {
          return res.status(403).json({
            message:
              'Sellers can set confirmed, processing, shipped, out for delivery, delivered, or returned',
          })
        }
        if (!canTransition(order.status, status) && order.status !== status) {
          const sellerJump =
            (order.status === 'pending' && status === 'confirmed') ||
            (order.status === 'confirmed' &&
              ['processing', 'shipped'].includes(status)) ||
            (order.status === 'processing' && status === 'shipped') ||
            (order.status === 'shipped' &&
              ['out_for_delivery', 'delivered'].includes(status)) ||
            (order.status === 'out_for_delivery' && status === 'delivered') ||
            (order.status === 'return_requested' && status === 'returned')
          if (!sellerJump) {
            return res.status(400).json({
              message: `Cannot move from ${order.status} to ${status}`,
              allowed: STATUS_TRANSITIONS[order.status] || [],
            })
          }
        }
      } else if (status !== order.status && !canTransition(order.status, status)) {
        // Admin can force any status for ops flexibility
      }

      if (status === 'confirmed' || status === 'processing') {
        const stock = ensureStockForConfirm(order)
        if (!stock.ok) {
          return res.status(409).json({
            message: stock.message || 'Insufficient stock',
            shortages: stock.shortages,
          })
        }
      }

      if (status === 'cancelled' && order.stockDeducted && prevStatus !== 'cancelled') {
        restoreStock(order.items)
        order.stockDeducted = false
      }

      if (status === 'returned' && order.stockDeducted) {
        restoreStock(order.items)
        order.stockDeducted = false
        if (order.paymentStatus === 'paid') {
          order.paymentStatus = 'refunded'
        }
      }

      order.status = status
      if (status !== prevStatus) {
        pushTimeline(
          order,
          status,
          STATUS_TIMELINE_NOTES[status] || `Status → ${status}`,
          actor
        )
      }

      // COD: payment completes when the order is delivered
      if (
        status === 'delivered' &&
        order.paymentMethod === 'cod' &&
        order.paymentStatus !== 'paid' &&
        order.paymentStatus !== 'refunded'
      ) {
        order.paymentStatus = 'paid'
        pushTimeline(order, status, 'Cash collected on delivery', actor)
      }

      if (role === 'seller' && !order.assignedSeller) {
        order.assignedSeller = req.user._id || req.user.id
      }
    }

    if (paymentStatus) {
      if (role !== 'admin') {
        return res.status(403).json({ message: 'Only admin can update payment' })
      }
      if (!PAYMENT_STATUSES.includes(paymentStatus)) {
        return res.status(400).json({ message: 'Invalid payment status' })
      }
      order.paymentStatus = paymentStatus
      if (!wasPaid && paymentStatus === 'paid') {
        pushTimeline(order, order.status, 'Payment marked paid', actor)
      }
    }

    if (typeof trackingNumber === 'string') {
      order.trackingNumber = trackingNumber.trim()
    }
    if (typeof courier === 'string') {
      order.courier = courier.trim()
    }
    if (typeof notes === 'string' && role === 'admin') {
      order.notes = notes.trim()
    }

    await order.save()

    if (!wasPaid && order.paymentStatus === 'paid') {
      fireAndForget(notifyPaymentCompleted(order))
    }

    res.json({ message: 'Order updated', order: order.toSafeJSON() })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update order' })
  }
})

/** Admin: delete order */
router.delete('/:id', requireMongo, protect, authorize('admin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }
    if (order.stockDeducted) {
      restoreStock(order.items)
    }
    await order.deleteOne()
    res.json({ message: 'Order deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete order' })
  }
})

export default router
