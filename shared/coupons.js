/**
 * Coupon + shipping rules — shared by checkout UX and order API.
 * Server always re-validates on order create.
 */

/** Free delivery threshold for repeat orders */
export const FREE_SHIP_AT = 499

/** Delivery fee on repeat orders (not first order) */
export const SHIPPING_FEE = 39

/** Automatic flat discount on first order (₹50–75 range) */
export const FIRST_ORDER_DISCOUNT = 75

export const COUPONS = {
  PAHAD15: {
    code: 'PAHAD15',
    type: 'flat',
    value: FIRST_ORDER_DISCOUNT,
    minSubtotal: 0,
    firstOrderOnly: true,
    label: `₹${FIRST_ORDER_DISCOUNT} off`,
  },
  HILL50: {
    code: 'HILL50',
    type: 'flat',
    value: 50,
    minSubtotal: 499,
    firstOrderOnly: false,
    label: '₹50 off',
  },
}

export function normalizeCouponCode(raw = '') {
  return String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

/**
 * @param {number} subtotal
 * @param {{ isFirstOrder?: boolean }} [opts]
 */
export function calcShipping(subtotal, opts = {}) {
  if (opts.isFirstOrder) return 0
  const amount = Math.max(0, Number(subtotal) || 0)
  return amount >= FREE_SHIP_AT ? 0 : SHIPPING_FEE
}

/**
 * @returns {{
 *   ok: boolean,
 *   code?: string,
 *   label?: string,
 *   discount: number,
 *   message: string,
 * }}
 */
export function applyCoupon(subtotal, rawCode, { isFirstOrder = true } = {}) {
  const code = normalizeCouponCode(rawCode)
  const amount = Math.max(0, Number(subtotal) || 0)

  if (!code) {
    return { ok: false, discount: 0, message: 'Enter a coupon code' }
  }

  const coupon = COUPONS[code]
  if (!coupon) {
    return { ok: false, discount: 0, message: 'Invalid coupon code' }
  }

  if (amount < (coupon.minSubtotal || 0)) {
    return {
      ok: false,
      discount: 0,
      message: `Add items worth ₹${coupon.minSubtotal} to use ${coupon.code}`,
    }
  }

  if (coupon.firstOrderOnly && !isFirstOrder) {
    return {
      ok: false,
      discount: 0,
      message: `${coupon.code} is only for first orders`,
    }
  }

  let discount = 0
  if (coupon.type === 'percent') {
    discount = Math.round((amount * coupon.value) / 100)
  } else if (coupon.type === 'flat') {
    discount = coupon.value
  }

  discount = Math.min(discount, amount)
  if (discount <= 0) {
    return { ok: false, discount: 0, message: 'Coupon does not apply' }
  }

  return {
    ok: true,
    code: coupon.code,
    label: coupon.label,
    discount,
    message: `${coupon.label} applied`,
  }
}

/**
 * First-order welcome flat when no better coupon is applied.
 */
export function welcomeDiscount(subtotal, { isFirstOrder = false } = {}) {
  if (!isFirstOrder) return 0
  const amount = Math.max(0, Number(subtotal) || 0)
  return Math.min(FIRST_ORDER_DISCOUNT, amount)
}
