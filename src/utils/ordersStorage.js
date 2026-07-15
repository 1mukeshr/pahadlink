const STORAGE_KEY = 'pahadlink_orders'

export const readOrders = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export const saveOrder = (order) => {
  const list = readOrders()
  const next = [order, ...list.filter((item) => item.id !== order.id)].slice(
    0,
    40
  )
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export const getOrdersForUser = (email) => {
  const list = readOrders()
  if (!email) return list
  const key = email.trim().toLowerCase()
  return list.filter((order) => (order.email || '').toLowerCase() === key)
}
