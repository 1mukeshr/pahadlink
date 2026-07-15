/**
 * App settings - change here once
 */
export const APP_NAME = 'PahadLink'

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const STORAGE = {
  TOKEN: 'pahadlink_token',
  USER: 'pahadlink_user',
  CART: 'pahadlink_cart',
  WISHLIST: 'pahadlink_wishlist',
  LOCATION: 'pahadlink_location',
  CHECKOUT_ADDRESS: 'pahadlink_checkout_address',
}

export const ROLES = {
  CUSTOMER: 'customer',
  SELLER: 'seller',
  ADMIN: 'admin',
}

export const ROLE_LIST = [ROLES.CUSTOMER, ROLES.SELLER, ROLES.ADMIN]

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  CART: '/bag',
  CHECKOUT: '/checkout',
  SHOP: '/shop',
  CATEGORY: '/category/:id',
  PRODUCT: '/product/:id',
  WISHLIST: '/wishlist',
  ACCOUNT: '/account',
  ORDERS: '/orders',
  CONTACT: '/contact',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  REFUNDS: '/refunds',
}

export const productPath = (id) => `/product/${id}`

export const categoryPath = (id, type) => {
  const base = `/category/${id}`
  if (!type) return base
  return `${base}?type=${encodeURIComponent(type)}`
}

export const AUTH_PATHS = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
]
