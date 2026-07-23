import crypto from 'crypto'
import Razorpay from 'razorpay'

let client = null

export function isRazorpayConfigured() {
  return Boolean(
    String(process.env.RAZORPAY_KEY_ID || '').trim() &&
      String(process.env.RAZORPAY_KEY_SECRET || '').trim()
  )
}

export function getRazorpayKeyId() {
  return String(process.env.RAZORPAY_KEY_ID || '').trim()
}

export function getRazorpayClient() {
  if (!isRazorpayConfigured()) {
    throw new Error('Razorpay is not configured (set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)')
  }
  if (!client) {
    client = new Razorpay({
      key_id: getRazorpayKeyId(),
      key_secret: String(process.env.RAZORPAY_KEY_SECRET || '').trim(),
    })
  }
  return client
}

/** Amount in paise for INR */
export function toPaise(amountInr) {
  return Math.round(Number(amountInr || 0) * 100)
}

export async function createRazorpayOrder({ amountInr, receipt, notes = {} }) {
  const amount = toPaise(amountInr)
  if (!Number.isFinite(amount) || amount < 100) {
    throw new Error('Order amount must be at least ₹1')
  }
  const rzp = getRazorpayClient()
  return rzp.orders.create({
    amount,
    currency: 'INR',
    receipt: String(receipt || '').slice(0, 40),
    notes,
  })
}

export function verifyPaymentSignature({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) {
  const secret = String(process.env.RAZORPAY_KEY_SECRET || '').trim()
  const body = `${razorpayOrderId}|${razorpayPaymentId}`
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
  return expected === String(razorpaySignature || '')
}
