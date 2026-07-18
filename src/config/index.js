/**
 * App settings - change here once
 */
export const APP_NAME = 'PahadLink'

export {
  API_BASE_URL,
  getApiBaseUrl,
  getRuntimeFirebaseConfig,
  loadRuntimeConfig,
} from './api'

export const STORAGE = {
  TOKEN: 'pahadlink_token',
  USER: 'pahadlink_user',
  CART: 'pahadlink_cart',
  WISHLIST: 'pahadlink_wishlist',
  LOCATION: 'pahadlink_location',
  ADDRESSES: 'pahadlink_addresses',
  THEME: 'pahadlink_theme',
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
  ADMIN: '/admin',
  SELLER: '/seller',
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

/** Hide header category bar on these pages */
export const HIDE_CATEGORY_NAV_PATHS = [
  ROUTES.CHECKOUT,
  ROUTES.WISHLIST,
  ROUTES.ACCOUNT,
  ROUTES.ADMIN,
  ROUTES.SELLER,
  ROUTES.TERMS,
  ROUTES.PRIVACY,
  ROUTES.REFUNDS,
  ROUTES.CONTACT,
]
