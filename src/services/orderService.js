import api from './api'
import { resolveProductImage } from '../data/siteData'

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'return_requested',
  'returned',
]

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded']

export const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  return_requested: 'Return requested',
  returned: 'Returned',
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

export async function fetchOrderStats() {
  const { data } = await api.get('/orders/stats')
  return data
}

export async function fetchInventory() {
  const { data } = await api.get('/orders/inventory')
  return data.items
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
