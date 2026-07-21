import api from './api'
import { resolveProductImage } from '../data/siteData'

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'return_requested',
  'returned',
]

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded']

/** Customer-facing labels — Flipkart-style steps, PahadLink branded */
export const STATUS_LABELS = {
  pending: 'Order Placed',
  confirmed: 'Confirmed',
  processing: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  return_requested: 'Return requested',
  returned: 'Returned',
}

/** Horizontal tracker steps (customer Orders detail) */
export const DELIVERY_FLOW_STEPS = [
  {
    key: 'pending',
    label: 'Placed',
    shortLabel: 'Placed',
    hint: 'PahadLink received your order',
  },
  {
    key: 'confirmed',
    label: 'Confirmed',
    shortLabel: 'Confirmed',
    hint: 'Seller confirmed your order',
  },
  {
    key: 'processing',
    label: 'Packed',
    shortLabel: 'Packed',
    hint: 'Packed and ready to ship',
  },
  {
    key: 'shipped',
    label: 'Shipped',
    shortLabel: 'Shipped',
    hint: 'Package handed to courier',
  },
  {
    key: 'out_for_delivery',
    label: 'Out',
    shortLabel: 'Out',
    hint: 'Courier is on the way to you',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    shortLabel: 'Delivered',
    hint: 'Delivered successfully',
  },
]

export const DELIVERY_FLOW_INDEX = {
  pending: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  out_for_delivery: 4,
  delivered: 5,
  return_requested: 5,
  returned: 5,
  cancelled: -1,
}

export function deliveryHeadline(status) {
  switch (String(status || '').toLowerCase()) {
    case 'pending':
      return 'Order placed with PahadLink'
    case 'confirmed':
      return 'Your order is confirmed'
    case 'processing':
      return 'Your order is packed'
    case 'shipped':
      return 'Your order has been shipped'
    case 'out_for_delivery':
      return 'Out for delivery'
    case 'delivered':
      return 'Delivered'
    case 'cancelled':
      return 'Order cancelled'
    case 'return_requested':
      return 'Return requested'
    case 'returned':
      return 'Return completed'
    default:
      return 'Order update'
  }
}

export function deliveryHint(status) {
  const step = DELIVERY_FLOW_STEPS.find((s) => s.key === status)
  return step?.hint || STATUS_LABELS[status] || ''
}

export const PAYMENT_STATUS_LABELS = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
}

/** Customer-facing payment copy (COD-aware) */
export function paymentStatusLabel(order) {
  const method = String(order?.payment || order?.paymentMethod || '').toLowerCase()
  const pay = String(order?.paymentStatus || 'pending').toLowerCase()
  if (method === 'cod' || method === 'cash on delivery') {
    if (pay === 'paid') return 'Paid · Cash on delivery'
    if (pay === 'refunded') return 'Refunded'
    if (order?.status === 'delivered') return 'Paid · Cash on delivery'
    if (order?.status === 'out_for_delivery' || order?.status === 'shipped') {
      return 'Pay on delivery · Due'
    }
    return 'Pay on delivery'
  }
  return PAYMENT_STATUS_LABELS[pay] || pay
}

/**
 * Build Flipkart-style activity from live timeline + current status.
 * Fills missing steps so progress is never a single static "placed" row.
 */
export function buildDeliveryActivity(order) {
  if (!order) return []
  const status = String(order.status || 'pending').toLowerCase()
  if (status === 'cancelled') {
    const events = Array.isArray(order.timeline) ? order.timeline : []
    const cancel = events.find((e) => e.status === 'cancelled')
    return [
      {
        status: 'cancelled',
        note: cancel?.note || 'Order cancelled',
        at: cancel?.at || order.updatedAt || order.createdAt,
      },
    ]
  }

  const apiEvents = (Array.isArray(order.timeline) ? order.timeline : [])
    .filter((e) => e && e.status)
    .slice()
    .sort((a, b) => new Date(a.at || 0) - new Date(b.at || 0))

  const byStatus = new Map()
  for (const ev of apiEvents) {
    byStatus.set(String(ev.status).toLowerCase(), ev)
  }

  const currentIdx = DELIVERY_FLOW_INDEX[status]
  if (currentIdx == null || currentIdx < 0) {
    return apiEvents.map((ev) => ({
      status: ev.status,
      note: ev.note || STATUS_LABELS[ev.status] || deliveryHeadline(ev.status),
      at: ev.at,
    }))
  }

  const built = []
  for (let i = 0; i <= currentIdx; i += 1) {
    const step = DELIVERY_FLOW_STEPS[i]
    const hit = byStatus.get(step.key)
    const isCurrent = i === currentIdx
    // Prefer real timeline timestamps; avoid inventing same createdAt for every step
    let at = hit?.at || null
    if (!at && i === 0) at = order.createdAt || null
    if (!at && isCurrent) at = order.updatedAt || order.createdAt || null
    built.push({
      status: step.key,
      note: hit?.note || step.hint || STATUS_LABELS[step.key],
      at,
      isCurrent,
    })
  }

  // Append return events after delivery if present
  for (const key of ['return_requested', 'returned']) {
    const hit = byStatus.get(key)
    if (hit) {
      built.push({
        status: key,
        note: hit.note || STATUS_LABELS[key],
        at: hit.at,
      })
    }
  }

  return built
}

/** Normalize API order into the shape used by customer Orders UI */
export function mapApiOrderToUi(order) {
  if (!order) return null
  const addr = order.shippingAddress || {}
  return {
    id: order.orderNumber || order.id,
    apiId: order.id,
    payment: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    total: order.totalAmount,
    shipping: order.shippingFee,
    discount: order.discountAmount,
    couponCode: order.couponCode || '',
    itemCount: (order.items || []).reduce((s, i) => s + (i.quantity || 1), 0),
    items: (order.items || []).map((item) => {
      const productId = item.productId || ''
      const mapped = {
        id: productId || item.name,
        productId,
        name: item.name,
        qty: item.quantity || 1,
        price: item.price,
        size: item.size,
      }
      mapped.image = resolveProductImage(mapped)
      return mapped
    }),
    email: order.customerEmail,
    userEmail: order.customerEmail,
    userId: order.user,
    name: order.customerName,
    phone: order.customerPhone,
    city: addr.city,
    state: addr.state,
    pincode: addr.pincode,
    address: addr.line1,
    notes: order.notes,
    trackingNumber: order.trackingNumber,
    courier: order.courier,
    status: order.status,
    statusLabel: STATUS_LABELS[order.status] || order.status,
    review: order.review,
    returnReason: order.returnReason,
    timeline: order.timeline || [],
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}

export async function fetchMyOrders() {
  const { data } = await api.get('/orders/mine')
  return (data.orders || []).map(mapApiOrderToUi)
}

export async function fetchOrders(params = {}) {
  const { data } = await api.get('/orders', { params })
  return data.orders
}

export async function fetchOrderStats(params = {}) {
  const { data } = await api.get('/orders/stats', { params })
  return data
}

export async function fetchInventory() {
  const { data } = await api.get('/orders/inventory')
  return data.items
}

/** Public storefront stock levels */
export async function fetchStockLevels() {
  const { data } = await api.get('/orders/stock')
  return data.items || []
}

export async function createOrder(payload) {
  const { data } = await api.post('/orders', payload)
  return data.order
}

export async function validateCoupon({ code, subtotal, email }) {
  const { data } = await api.post('/coupons/validate', {
    code,
    subtotal,
    email,
  })
  return data
}

export async function updateOrder(id, payload) {
  const { data } = await api.patch(`/orders/${id}`, payload)
  return data
}

export async function requestReturn(id, reason) {
  const { data } = await api.post(`/orders/${id}/return`, { reason })
  return data
}

export async function submitReview(id, { rating, comment }) {
  const { data } = await api.post(`/orders/${id}/review`, { rating, comment })
  return data
}

export async function deleteOrder(id) {
  const { data } = await api.delete(`/orders/${id}`)
  return data
}
