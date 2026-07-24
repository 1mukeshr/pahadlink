/**
 * Server coupon helpers — domain rules from shared; order totals stay here.
 */
export {
  FREE_SHIP_AT,
  SHIPPING_FEE,
  FIRST_ORDER_DISCOUNT,
  COUPONS,
  normalizeCouponCode,
  calcShipping,
  applyCoupon,
  welcomeDiscount,
} from '../../shared/coupons.js'

export {
  GST_RATE,
  GST_RATE_PERCENT,
  GST_BUSINESS_STATE,
  splitInclusiveGst,
  allocateGst,
  buildGstBreakdown,
} from '../../shared/gst.js'

import {
  applyCoupon,
  calcShipping,
  welcomeDiscount,
} from '../../shared/coupons.js'
import { buildGstBreakdown } from '../../shared/gst.js'

export function buildOrderTotals(subtotal, rawCode, opts = {}) {
  const itemsTotal = Math.max(0, Number(subtotal) || 0)
  const isFirstOrder = Boolean(opts.isFirstOrder)
  const coupon = applyCoupon(itemsTotal, rawCode, { isFirstOrder })
  const autoWelcome = welcomeDiscount(itemsTotal, { isFirstOrder })

  let discountAmount = 0
  let couponCode = ''
  let couponLabel = ''
  let couponOk = false
  let couponMessage = coupon.message

  if (coupon.ok && coupon.discount >= autoWelcome) {
    discountAmount = coupon.discount
    couponCode = coupon.code
    couponLabel = coupon.label
    couponOk = true
    couponMessage = coupon.message
  } else if (autoWelcome > 0) {
    discountAmount = autoWelcome
    couponCode = 'WELCOME'
    couponLabel = `₹${autoWelcome} first-order off`
    couponOk = true
    couponMessage = couponLabel
  }

  const shippingFee = calcShipping(itemsTotal, { isFirstOrder })
  const taxableValue = Math.max(0, itemsTotal - discountAmount + shippingFee)
  const gst = buildGstBreakdown(taxableValue, {
    shippingState: opts.shippingState,
    businessState: opts.businessState,
    rate: opts.gstRate,
  })

  return {
    itemsTotal,
    discountAmount,
    shippingFee,
    taxableValue: gst.taxableValue,
    gstRate: gst.gstRate,
    gstRatePercent: gst.gstRatePercent,
    gstAmount: gst.gstAmount,
    cgstAmount: gst.cgstAmount,
    sgstAmount: gst.sgstAmount,
    igstAmount: gst.igstAmount,
    gstType: gst.gstType,
    pricesIncludeGst: false,
    totalAmount: gst.taxableValue + gst.gstAmount,
    couponCode,
    couponLabel,
    couponOk,
    couponMessage,
    isFirstOrder,
  }
}
