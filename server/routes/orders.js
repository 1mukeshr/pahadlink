import { Router } from 'express'
import Order, {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  STATUS_TRANSITIONS,
  buildOrderNumber,
  canTransition,
} from '../models/Order.js'
import { protect, authorize, optionalProtect } from '../middleware/auth.js'
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
} from '../services/inventory.js'

const router = Router()

const PAYMENT_METHODS = ['cod', 'upi', 'card']

const SELLER_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered', 'return_requested']

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

/** Customer: my orders */
router.get('/mine', protect, async (req, res) => {
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
router.get('/', protect, authorize('admin', 'seller'), async (req, res) => {
  try {
    const { status, q } = req.query
    const filter = {}

    if (req.user.role === 'seller') {
      filter.status = { $in: SELLER_STATUSES }
      if (status && SELLER_STATUSES.includes(status)) {
        filter.status = status
      }
    } else if (status && ORDER_STATUSES.includes(status)) {
      filter.status = status
    }

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

    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(200)
    res.json({ orders: orders.map((o) => o.toSafeJSON()) })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load orders' })
  }
})

/** Admin: order stats */
router.get('/stats', protect, authorize('admin', 'seller'), async (req, res) => {
  try {
    const base =
      req.user.role === 'seller' ? { status: { $in: SELLER_STATUSES } } : {}

    const [total, pending, confirmed, processing, shipped, delivered, cancelled, returns, revenue] =
      await Promise.all([
        Order.countDocuments(base),
        Order.countDocuments({ ...base, status: 'pending' }),
        Order.countDocuments({ ...base, status: 'confirmed' }),
        Order.countDocuments({ ...base, status: 'processing' }),
        Order.countDocuments({ ...base, status: 'shipped' }),
        Order.countDocuments({ ...base, status: 'delivered' }),
        Order.countDocuments({ ...base, status: 'cancelled' }),
        Order.countDocuments({
          ...base,
          status: { $in: ['return_requested', 'returned'] },
        }),
        Order.aggregate([
          { $match: { paymentStatus: 'paid', ...(req.user.role === 'seller' ? base : {}) } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]),
      ])

    res.json({
      total,
      pending,
      confirmed,
      processing,
      shipped,
      delivered,
      cancelled,
      returns,
      revenue: revenue[0]?.total || 0,
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load stats' })
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
 * Create order (guest or logged-in).
 */
router.post('/', optionalProtect, async (req, res) => {
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

    const cleanItems = items.map((item) => ({
      productId: String(item.productId || item.id || '').trim(),
      name: String(item.name || '').trim(),
      size: String(item.size || item.unitSize || '').trim(),
      quantity: Number(item.quantity ?? item.qty) || 1,
      price: Number(item.price) || 0,
    }))

    if (cleanItems.some((i) => !i.name || i.price < 0 || i.quantity < 1)) {
      return res.status(400).json({ message: 'Invalid order items' })
    }

    const itemsTotal = cleanItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )

    const email = String(customerEmail).trim().toLowerCase()
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
    const method = PAYMENT_METHODS.includes(paymentMethod) ? paymentMethod : 'cod'
    const onlinePaid = method === 'upi' || method === 'card'

    let nextPaymentStatus = 'pending'
    let nextStatus = 'pending'

    if (isAdmin && PAYMENT_STATUSES.includes(paymentStatus)) {
      nextPaymentStatus = paymentStatus
    } else if (onlinePaid) {
      nextPaymentStatus = 'paid'
    }

    if (isAdmin && ORDER_STATUSES.includes(status)) {
      nextStatus = status
    } else if (onlinePaid) {
      nextStatus = 'confirmed'
    }

    let stockDeducted = false
    if (nextStatus === 'confirmed' || nextStatus === 'processing') {
      const stock = decrementStock(cleanItems)
      if (!stock.ok) {
        return res.status(409).json({
          message: stock.message || 'Insufficient stock',
          shortages: stock.shortages,
        })
      }
      stockDeducted = true
    }

    const order = await Order.create({
      orderNumber: buildOrderNumber(),
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
      shippingAddress: shippingAddress || {},
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
router.post('/:id/return', protect, async (req, res) => {
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
router.post('/:id/review', protect, async (req, res) => {
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

    order.review = {
      rating,
      comment: String(req.body.comment || '').trim().slice(0, 500),
      createdAt: new Date(),
    }
    await order.save()

    res.json({ message: 'Review saved', order: order.toSafeJSON() })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to save review' })
  }
})

/** Admin + Seller: update order status / payment / shipping */
router.patch('/:id', protect, authorize('admin', 'seller'), async (req, res) => {
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
        const sellerAllowed = ['processing', 'shipped', 'delivered', 'returned']
        if (!sellerAllowed.includes(status)) {
          return res.status(403).json({
            message: 'Sellers can set processing, shipped, delivered, or returned',
          })
        }
        if (!canTransition(order.status, status) && order.status !== status) {
          // Allow seller jump confirmed → processing/shipped
          const sellerJump =
            (order.status === 'confirmed' && ['processing', 'shipped'].includes(status)) ||
            (order.status === 'processing' && status === 'shipped') ||
            (order.status === 'shipped' && status === 'delivered') ||
            (order.status === 'return_requested' && status === 'returned')
          if (!sellerJump) {
            return res.status(400).json({
              message: `Cannot move from ${order.status} to ${status}`,
              allowed: STATUS_TRANSITIONS[order.status] || [],
            })
          }
        }
      } else if (status !== order.status && !canTransition(order.status, status)) {
        // Admin can force any status, but warn via allowed list for invalid jumps
        // Still allow admin override for ops flexibility
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
        pushTimeline(order, status, `Status → ${status}`, actor)
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
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
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
