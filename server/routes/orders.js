import { Router } from 'express'
import Order, {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  buildOrderNumber,
} from '../models/Order.js'
import { protect, authorize } from '../middleware/auth.js'

const router = Router()

/** Admin: list all orders */
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, q } = req.query
    const filter = {}

    if (status && ORDER_STATUSES.includes(status)) {
      filter.status = status
    }

    if (q) {
      const text = String(q).trim()
      filter.$or = [
        { orderNumber: new RegExp(text, 'i') },
        { customerName: new RegExp(text, 'i') },
        { customerEmail: new RegExp(text, 'i') },
        { customerPhone: new RegExp(text, 'i') },
      ]
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(200)
    res.json({ orders: orders.map((o) => o.toSafeJSON()) })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load orders' })
  }
})

/** Admin: order stats */
router.get('/stats', protect, authorize('admin'), async (_req, res) => {
  try {
    const [total, pending, confirmed, shipped, delivered, cancelled, revenue] =
      await Promise.all([
        Order.countDocuments(),
        Order.countDocuments({ status: 'pending' }),
        Order.countDocuments({ status: 'confirmed' }),
        Order.countDocuments({ status: 'shipped' }),
        Order.countDocuments({ status: 'delivered' }),
        Order.countDocuments({ status: 'cancelled' }),
        Order.aggregate([
          { $match: { paymentStatus: 'paid' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]),
      ])

    res.json({
      total,
      pending,
      confirmed,
      shipped,
      delivered,
      cancelled,
      revenue: revenue[0]?.total || 0,
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load stats' })
  }
})

/** Create order (admin or logged-in user) */
router.post('/', protect, async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      items,
      shippingAddress,
      notes,
      paymentStatus,
      status,
    } = req.body

    if (!customerName || !customerEmail || !Array.isArray(items) || !items.length) {
      return res.status(400).json({
        message: 'customerName, customerEmail and items are required',
      })
    }

    const cleanItems = items.map((item) => ({
      name: String(item.name || '').trim(),
      quantity: Number(item.quantity) || 1,
      price: Number(item.price) || 0,
    }))

    if (cleanItems.some((i) => !i.name || i.price < 0 || i.quantity < 1)) {
      return res.status(400).json({ message: 'Invalid order items' })
    }

    const totalAmount = cleanItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )

    const isAdmin = req.user.role === 'admin'

    const order = await Order.create({
      orderNumber: buildOrderNumber(),
      user: req.user._id,
      customerName: String(customerName).trim(),
      customerEmail: String(customerEmail).trim().toLowerCase(),
      customerPhone: String(customerPhone || '').trim(),
      items: cleanItems,
      totalAmount,
      shippingAddress: shippingAddress || {},
      notes: String(notes || '').trim(),
      status: isAdmin && ORDER_STATUSES.includes(status) ? status : 'pending',
      paymentStatus:
        isAdmin && PAYMENT_STATUSES.includes(paymentStatus)
          ? paymentStatus
          : 'pending',
    })

    res.status(201).json({ order: order.toSafeJSON() })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create order' })
  }
})

/** Admin: update order status / payment */
router.patch('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    const { status, paymentStatus, notes } = req.body

    if (status && ORDER_STATUSES.includes(status)) {
      order.status = status
    }
    if (paymentStatus && PAYMENT_STATUSES.includes(paymentStatus)) {
      order.paymentStatus = paymentStatus
    }
    if (typeof notes === 'string') {
      order.notes = notes.trim()
    }

    await order.save()
    res.json({ message: 'Order updated', order: order.toSafeJSON() })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update order' })
  }
})

/** Admin: delete order */
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id)
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }
    res.json({ message: 'Order deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete order' })
  }
})

export default router
