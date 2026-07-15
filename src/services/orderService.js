import api from './api'

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
]

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded']

export async function fetchOrders(params = {}) {
  const { data } = await api.get('/orders', { params })
  return data.orders
}

export async function fetchOrderStats() {
  const { data } = await api.get('/orders/stats')
  return data
}

export async function createOrder(payload) {
  const { data } = await api.post('/orders', payload)
  return data.order
}

export async function updateOrder(id, payload) {
  const { data } = await api.patch(`/orders/${id}`, payload)
  return data
}

export async function deleteOrder(id) {
  const { data } = await api.delete(`/orders/${id}`)
  return data
}
