import api from './api'

const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js'
const ONLINE_METHODS = new Set(['upi', 'card', 'netbanking', 'wallet', 'razorpay'])

let scriptPromise = null

export function isOnlinePaymentMethod(method) {
  return ONLINE_METHODS.has(String(method || '').toLowerCase())
}

export async function fetchPaymentStatus() {
  const { data } = await api.get('/payments/status')
  return data
}

export async function createRazorpayCheckout(orderId) {
  const { data } = await api.post('/payments/razorpay/create', { orderId })
  return data
}

export async function verifyRazorpayPayment(payload) {
  const { data } = await api.post('/payments/razorpay/verify', payload)
  return data.order
}

export async function markRazorpayFailed(orderId, reason) {
  const { data } = await api.post('/payments/razorpay/fail', { orderId, reason })
  return data.order
}

function loadRazorpayScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay requires a browser'))
  }
  if (window.Razorpay) return Promise.resolve(window.Razorpay)
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_URL}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Razorpay))
      existing.addEventListener('error', () => {
        scriptPromise = null
        reject(new Error('Failed to load Razorpay'))
      })
      if (window.Razorpay) resolve(window.Razorpay)
      return
    }
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => resolve(window.Razorpay)
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Failed to load Razorpay checkout'))
    }
    document.body.appendChild(script)
  })

  return scriptPromise
}

/**
 * Open Razorpay Standard Checkout (HoH / Shopify-style online pay).
 * Resolves with verified API order on success; rejects on cancel/failure.
 */
export async function openRazorpayCheckout({
  order,
  customer,
  preference = '',
  themeColor = '#1f5c3a',
}) {
  const orderRef = order?.id || order?.orderNumber
  if (!orderRef) throw new Error('Missing order for payment')

  const session = await createRazorpayCheckout(orderRef)
  const Razorpay = await loadRazorpayScript()
  if (!Razorpay) throw new Error('Razorpay checkout is unavailable')

  const methodPref = String(preference || session.preference || '').toLowerCase()
  const options = {
    key: session.keyId,
    amount: session.amount,
    currency: session.currency || 'INR',
    name: 'PahadLink',
    description: `Order ${order.orderNumber || orderRef}`,
    order_id: session.razorpayOrderId,
    prefill: {
      name: customer?.name || '',
      email: customer?.email || '',
      contact: customer?.phone || '',
    },
    notes: {
      orderNumber: order.orderNumber || orderRef,
    },
    theme: { color: themeColor },
    modal: {
      ondismiss: () => {
        /* handled via promise reject below */
      },
    },
  }

  if (methodPref === 'upi') options.method = 'upi'
  if (methodPref === 'card') options.method = 'card'
  if (methodPref === 'netbanking') options.method = 'netbanking'
  if (methodPref === 'wallet') options.method = 'wallet'

  return new Promise((resolve, reject) => {
    let settled = false

    const rzp = new Razorpay({
      ...options,
      handler: async (response) => {
        try {
          const paid = await verifyRazorpayPayment({
            orderId: orderRef,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })
          settled = true
          resolve(paid)
        } catch (err) {
          settled = true
          reject(err)
        }
      },
      modal: {
        ondismiss: async () => {
          if (settled) return
          settled = true
          try {
            await markRazorpayFailed(orderRef, 'Payment window closed')
          } catch {
            /* ignore */
          }
          reject(new Error('Payment cancelled. You can retry from My Orders or place again.'))
        },
      },
    })

    rzp.on('payment.failed', async (response) => {
      if (settled) return
      settled = true
      const reason =
        response?.error?.description ||
        response?.error?.reason ||
        'Payment failed'
      try {
        await markRazorpayFailed(orderRef, reason)
      } catch {
        /* ignore */
      }
      reject(new Error(reason))
    })

    rzp.open()
  })
}
