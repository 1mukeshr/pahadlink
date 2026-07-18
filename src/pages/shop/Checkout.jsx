import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Breadcrumb from '../../components/layout/Breadcrumb'
import Footer from '../../components/layout/Footer'
import {
  CheckCircleIcon,
  CloseIcon,
  GiftIcon,
  ShieldIcon,
  TruckIcon,
  CartIcon,
  CodIcon,
  UpiIcon,
  CardPayIcon,
} from '../../components/icons'
import { ROUTES, STORAGE, productPath } from '../../config'
import { useAuth } from '../../context/AuthContext'
import { useShop } from '../../context/ShopContext'
import { saveOrder } from '../../utils/ordersStorage'
import { createOrder, validateCoupon } from '../../services/orderService'
import {
  INDIA_STATES,
  LOCATION_EVENT,
  locationToCheckoutFields,
  matchState,
  readLocation,
  upsertAddress,
} from '../../utils/locationStorage'
import {
  FREE_SHIP_AT,
  applyCoupon,
  calcShipping,
  normalizeCouponCode,
} from '../../data/coupons'

const ORDER_POPUP_MS = 20000

const STATES = INDIA_STATES

const PAYMENTS = [
  { id: 'cod', title: 'COD', desc: 'Pay on delivery', Icon: CodIcon },
  { id: 'upi', title: 'UPI', desc: 'GPay, PhonePe…', Icon: UpiIcon },
  { id: 'card', title: 'Card', desc: 'Credit / debit', Icon: CardPayIcon },
]

const formatPrice = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const makeOrderId = () => {
  const t = Date.now().toString().slice(-8)
  return `PL${t}`
}

const readJson = (key) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const parseLocation = (location) => locationToCheckoutFields(location)

const buildInitialForm = (user) => {
  const saved = readJson(STORAGE.CHECKOUT_ADDRESS) || {}
  const fromLoc = parseLocation(readLocation())
  const state =
    fromLoc.state && STATES.includes(fromLoc.state)
      ? fromLoc.state
      : saved.state && STATES.includes(saved.state)
        ? saved.state
        : 'Uttarakhand'

  return {
    name: user?.name || fromLoc.name || saved.name || '',
    email: user?.email || saved.email || '',
    phone: fromLoc.phone || saved.phone || '',
    address: fromLoc.address || saved.address || '',
    landmark: fromLoc.landmark || saved.landmark || '',
    city: fromLoc.city || saved.city || '',
    state,
    pincode: fromLoc.pincode || saved.pincode || '',
    notes: '',
    addressId: fromLoc.addressId || '',
    tag: fromLoc.tag || 'Home',
  }
}

const persistAddress = (form) => {
  try {
    localStorage.setItem(
      STORAGE.CHECKOUT_ADDRESS,
      JSON.stringify({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        landmark: form.landmark.trim(),
        city: form.city.trim(),
        state: form.state,
        pincode: form.pincode.trim(),
      })
    )
    // Upsert into saved delivery addresses + set as active
    upsertAddress(
      {
        id: form.addressId || null,
        tag: form.tag || 'Home',
        name: form.name.trim(),
        phone: form.phone.trim(),
        line1: form.address.trim(),
        area: form.landmark.trim(),
        city: form.city.trim(),
        state: form.state,
        pin: form.pincode.trim(),
        source: 'checkout',
      },
      { select: true }
    )
  } catch {
    /* ignore quota */
  }
}

const Checkout = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    cart,
    cartCount,
    cartTotal,
    updateCartQty,
    removeFromCart,
    clearCart,
    closeCart,
    openCart,
  } = useShop()

  const [form, setForm] = useState(() => buildInitialForm(user))
  const [payment, setPayment] = useState('cod')
  const [errors, setErrors] = useState({})
  const [placing, setPlacing] = useState(false)
  const [order, setOrder] = useState(null)
  const [showNote, setShowNote] = useState(false)
  const [placeError, setPlaceError] = useState('')
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  // Live-sync header location → checkout fields
  useEffect(() => {
    const applyLocation = (detail) => {
      const fields = locationToCheckoutFields(detail || readLocation())
      if (!fields.address && !fields.city && !fields.pincode) return
      setForm((prev) => ({
        ...prev,
        address: fields.address || prev.address,
        landmark: fields.landmark || prev.landmark,
        city: fields.city || prev.city,
        state: matchState(fields.state) || prev.state,
        pincode: fields.pincode || prev.pincode,
        name: fields.name || prev.name,
        phone: fields.phone || prev.phone,
        addressId: fields.addressId || prev.addressId,
        tag: fields.tag || prev.tag,
      }))
    }

    const onCustom = (e) => applyLocation(e.detail)
    const onStorage = (e) => {
      if (e.key === STORAGE.LOCATION) {
        try {
          applyLocation(e.newValue ? JSON.parse(e.newValue) : null)
        } catch {
          /* ignore */
        }
      }
    }

    window.addEventListener(LOCATION_EVENT, onCustom)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(LOCATION_EVENT, onCustom)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const dismissOrderPopup = useCallback(() => {
    setOrder(null)
    navigate(ROUTES.SHOP, { replace: true })
  }, [navigate])

  useEffect(() => {
    if (!order) return undefined
    const timer = window.setTimeout(dismissOrderPopup, ORDER_POPUP_MS)
    return () => window.clearTimeout(timer)
  }, [order, dismissOrderPopup])

  useEffect(() => {
    if (!order) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') dismissOrderPopup()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [order, dismissOrderPopup])

  const shipping = calcShipping(cartTotal)
  const discount = appliedCoupon?.discount || 0
  const payable = Math.max(0, cartTotal - discount + shipping)
  const shipLeft = Math.max(0, FREE_SHIP_AT - cartTotal)
  const shipProgress = Math.min(100, Math.round((cartTotal / FREE_SHIP_AT) * 100))

  useEffect(() => {
    if (!appliedCoupon?.code) return
    const code = appliedCoupon.code
    const refreshed = applyCoupon(cartTotal, code, { isFirstOrder: true })
    if (!refreshed.ok) {
      setAppliedCoupon(null)
      setCouponError(refreshed.message)
      return
    }
    setAppliedCoupon((prev) =>
      prev && prev.discount === refreshed.discount && prev.code === refreshed.code
        ? prev
        : refreshed
    )
  }, [cartTotal]) // eslint-disable-line react-hooks/exhaustive-deps

  const onApplyCoupon = async (e) => {
    e?.preventDefault?.()
    const code = normalizeCouponCode(couponInput)
    setCouponError('')
    if (!code) {
      setCouponError('Enter a coupon code')
      return
    }
    if (!cartTotal) {
      setCouponError('Add items to bag before applying a coupon')
      return
    }

    setCouponLoading(true)
    try {
      const result = await validateCoupon({
        code,
        subtotal: cartTotal,
        email: form.email.trim(),
      })
      setAppliedCoupon(result)
      setCouponInput(result.code || code)
      setCouponError('')
    } catch (err) {
      // Offline / API down — still allow local preview for known codes
      const local = applyCoupon(cartTotal, code, { isFirstOrder: true })
      if (local.ok && /API|server|reach/i.test(err.message || '')) {
        setAppliedCoupon(local)
        setCouponInput(local.code)
        setCouponError('')
      } else {
        setAppliedCoupon(null)
        setCouponError(err.message || local.message || 'Invalid coupon')
      }
    } finally {
      setCouponLoading(false)
    }
  }

  const onRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponInput('')
    setCouponError('')
  }

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Name is required'
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
      next.email = 'Valid email is required'
    }
    if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, ''))) {
      next.phone = 'Enter a valid 10-digit mobile'
    }
    if (!form.address.trim() || form.address.trim().length < 8) {
      next.address = 'Full address is required'
    }
    if (!form.city.trim()) next.city = 'City is required'
    if (!form.state) next.state = 'State is required'
    if (!/^\d{6}$/.test(form.pincode.trim())) {
      next.pincode = 'Enter a 6-digit pincode'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const placeOrder = async (e) => {
    e?.preventDefault?.()
    if (!cart.length || !validate() || placing) return

    setPlacing(true)
    setPlaceError('')

    const localId = makeOrderId()
    const placed = {
      id: localId,
      payment,
      total: payable,
      shipping,
      discount,
      couponCode: appliedCoupon?.code || '',
      itemCount: cart.length,
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        qty: item.qty || 1,
        price: item.price,
        size: item.size,
        image: item.image,
      })),
      email: form.email.trim().toLowerCase(),
      userEmail: (user?.email || form.email).trim().toLowerCase(),
      userId: user?.id || user?._id || null,
      name: form.name.trim(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      state: form.state,
      pincode: form.pincode.trim(),
      address: form.address.trim(),
      landmark: form.landmark.trim(),
      notes: form.notes.trim(),
      createdAt: new Date().toISOString(),
      status: 'pending',
    }

    try {
      const apiOrder = await createOrder({
        customerName: placed.name,
        customerEmail: placed.email,
        customerPhone: placed.phone,
        paymentMethod: payment,
        couponCode: appliedCoupon?.code || '',
        notes: [placed.notes, placed.landmark ? `Landmark: ${placed.landmark}` : '']
          .filter(Boolean)
          .join('\n'),
        shippingAddress: {
          line1: placed.address,
          city: placed.city,
          state: placed.state,
          pincode: placed.pincode,
        },
        items: placed.items.map((item) => ({
          productId: item.id,
          name: item.name,
          size: item.size || '',
          quantity: item.qty || 1,
          price: item.price,
        })),
      })

      if (apiOrder?.orderNumber) {
        placed.id = apiOrder.orderNumber
        placed.paymentStatus = apiOrder.paymentStatus
        placed.status = apiOrder.status || placed.status
        placed.apiId = apiOrder.id
        if (typeof apiOrder.totalAmount === 'number') {
          placed.total = apiOrder.totalAmount
        }
        if (typeof apiOrder.shippingFee === 'number') {
          placed.shipping = apiOrder.shippingFee
        }
        if (typeof apiOrder.discountAmount === 'number') {
          placed.discount = apiOrder.discountAmount
        }
        if (apiOrder.couponCode) {
          placed.couponCode = apiOrder.couponCode
        }
      }

      persistAddress(form)
      saveOrder(placed)
      setOrder({
        id: placed.id,
        payment: placed.payment,
        total: placed.total,
        shipping: placed.shipping,
        items: placed.itemCount,
        email: placed.email,
        paymentStatus: placed.paymentStatus,
      })
      clearCart()
      closeCart()
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    } catch (err) {
      setPlaceError(err.message || 'Could not place order. Is the API running?')
    } finally {
      setPlacing(false)
    }
  }

  const breadcrumbItems = useMemo(
    () => [{ label: 'Shop', to: ROUTES.SHOP }, { label: 'Checkout' }],
    []
  )

  if (order) {
    const paymentLabel =
      PAYMENTS.find((p) => p.id === order.payment)?.title || 'Checkout'

    return (
      <>
        <main className="checkout-page checkout-page--done">
          <div className="breadcrumb-bar">
            <div className="container">
              <Breadcrumb items={breadcrumbItems} />
            </div>
          </div>
          <section className="checkout-done">
            <div className="container checkout-done__inner">
              <h1>Order placed</h1>
              <p>You can keep shopping while we prepare your order.</p>
              <Link to={ROUTES.SHOP} className="btn-hero-primary">
                Continue shopping
              </Link>
            </div>
          </section>
        </main>
        <Footer />

        <div
          className="order-popup"
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-popup-title"
        >
          <button
            type="button"
            className="order-popup__backdrop"
            aria-label="Close order confirmation"
            onClick={dismissOrderPopup}
          />
          <div className="order-popup__panel">
            <div
              className="order-popup__timer"
              style={{ animationDuration: `${ORDER_POPUP_MS}ms` }}
              aria-hidden="true"
            />
            <button
              type="button"
              className="order-popup__close"
              aria-label="Close"
              onClick={dismissOrderPopup}
            >
              <CloseIcon size={16} />
            </button>

            <p className="order-popup__brand">PahadLink</p>

            <span className="order-popup__icon" aria-hidden="true">
              <CheckCircleIcon size={36} />
            </span>

            <p className="order-popup__kicker">Order confirmed</p>
            <h2 id="order-popup-title">Thank you</h2>
            <p className="order-popup__lead">
              {order.email ? (
                <>
                  We emailed <strong>{order.email}</strong>
                  {order.payment !== 'cod' ? <> with your receipt</> : null}.
                </>
              ) : (
                <>Your pahadi order is confirmed and being packed.</>
              )}
            </p>

            <p className="order-popup__id">
              <span>Order</span>
              <strong>{order.id}</strong>
            </p>

            <dl className="order-popup__meta">
              <div>
                <dt>Payment</dt>
                <dd>{paymentLabel}</dd>
              </div>
              <div>
                <dt>Items</dt>
                <dd>{order.items}</dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>
            </dl>

            <div className="order-popup__actions">
              <Link to={ROUTES.ORDERS} className="btn-hero-primary">
                View my orders
              </Link>
              <button
                type="button"
                className="order-popup__ghost"
                onClick={dismissOrderPopup}
              >
                Continue shopping
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!cart.length) {
    return (
      <>
        <main className="checkout-page">
          <div className="breadcrumb-bar">
            <div className="container">
              <Breadcrumb items={breadcrumbItems} />
            </div>
          </div>
          <section className="checkout-empty">
            <div className="container checkout-empty__inner">
              <span className="checkout-empty__icon" aria-hidden="true">
                <CartIcon size={30} />
              </span>
              <h1>Your bag is empty</h1>
              <p>Add pahadi favourites, then come back to checkout.</p>
              <Link to={ROUTES.SHOP} className="btn-hero-primary">
                Browse shop
              </Link>
            </div>
          </section>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <main className="checkout-page checkout-page--bag">
        <div className="breadcrumb-bar">
          <div className="container">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        </div>

        <section className="checkout-shell" aria-label="Checkout">
          <div className="container checkout-shell__inner">
            <header className="checkout-top">
              <div>
                <h1>
                  Checkout
                  <em>
                    · {cartCount} item{cartCount === 1 ? '' : 's'}
                  </em>
                </h1>
              </div>
              <nav className="checkout-steps" aria-label="Checkout steps">
                <span className="is-active">Bag</span>
                <i aria-hidden="true" />
                <span className="is-active">Address</span>
                <i aria-hidden="true" />
                <span className="is-active">Payment</span>
              </nav>
            </header>

            <div className="checkout-shell__grid">
              <div className="checkout-main">
                {shipLeft > 0 ? (
                  <div className="checkout-offer checkout-offer--ship">
                    <TruckIcon size={16} />
                    <p>
                      Add <strong>{formatPrice(shipLeft)}</strong> more for free
                      delivery
                    </p>
                    <div className="checkout-offer__bar" aria-hidden="true">
                      <span style={{ width: `${shipProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="checkout-offer checkout-offer--free">
                    <TruckIcon size={15} />
                    <p>
                      <strong>Free delivery</strong> on this order
                    </p>
                  </div>
                )}

                <section className="checkout-card" aria-label="Bag items">
                  <div className="checkout-card__head">
                    <h2>Your bag</h2>
                    <button
                      type="button"
                      className="checkout-card__link"
                      onClick={openCart}
                    >
                      Edit
                    </button>
                  </div>

                  <ul className="checkout-bag">
                    {cart.map((item) => (
                      <li key={item.key} className="checkout-bag__item">
                        <Link
                          to={productPath(item.id)}
                          className="checkout-bag__thumb"
                        >
                          <img
                            src={item.image}
                            alt=""
                            loading="lazy"
                            decoding="async"
                          />
                        </Link>
                        <div className="checkout-bag__body">
                          <div className="checkout-bag__row">
                            <div className="checkout-bag__info">
                              <strong>{item.name}</strong>
                              <span>{item.size || 'Standard'}</span>
                            </div>
                            <b>{formatPrice(item.price * item.qty)}</b>
                          </div>
                          <div className="checkout-bag__actions">
                            <div className="checkout-bag__qty">
                              <button
                                type="button"
                                aria-label="Decrease quantity"
                                onClick={() =>
                                  updateCartQty(item.key, item.qty - 1)
                                }
                              >
                                −
                              </button>
                              <em>{item.qty}</em>
                              <button
                                type="button"
                                aria-label="Increase quantity"
                                disabled={
                                  typeof item.maxStock === 'number' &&
                                  item.qty >= item.maxStock
                                }
                                onClick={() =>
                                  updateCartQty(item.key, item.qty + 1)
                                }
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              className="checkout-bag__remove"
                              onClick={() => removeFromCart(item.key)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                <form
                  id="checkout-form"
                  className="checkout-form"
                  onSubmit={placeOrder}
                  noValidate
                >
                  <section className="checkout-card">
                    <div className="checkout-card__head">
                      <h2>Delivery address</h2>
                    </div>

                    <div className="checkout-fields checkout-fields--2">
                      <label className="checkout-field">
                        <span>Full name</span>
                        <input
                          name="name"
                          value={form.name}
                          onChange={onChange}
                          autoComplete="name"
                          placeholder="Your name"
                        />
                        {errors.name && (
                          <em className="checkout-error">{errors.name}</em>
                        )}
                      </label>
                      <label className="checkout-field">
                        <span>Mobile</span>
                        <input
                          name="phone"
                          value={form.phone}
                          onChange={onChange}
                          autoComplete="tel"
                          inputMode="numeric"
                          placeholder="10-digit mobile"
                        />
                        {errors.phone && (
                          <em className="checkout-error">{errors.phone}</em>
                        )}
                      </label>
                    </div>

                    <label className="checkout-field">
                      <span>Email</span>
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={onChange}
                        autoComplete="email"
                        placeholder="you@example.com"
                      />
                      {errors.email && (
                        <em className="checkout-error">{errors.email}</em>
                      )}
                    </label>

                    <label className="checkout-field">
                      <span>Address</span>
                      <textarea
                        name="address"
                        value={form.address}
                        onChange={onChange}
                        rows={2}
                        placeholder="House no., street, area"
                      />
                      {errors.address && (
                        <em className="checkout-error">{errors.address}</em>
                      )}
                    </label>

                    <label className="checkout-field">
                      <span>Landmark (optional)</span>
                      <input
                        name="landmark"
                        value={form.landmark}
                        onChange={onChange}
                        placeholder="Near temple, market…"
                      />
                    </label>

                    <div className="checkout-fields checkout-fields--3">
                      <label className="checkout-field">
                        <span>City</span>
                        <input
                          name="city"
                          value={form.city}
                          onChange={onChange}
                          autoComplete="address-level2"
                          placeholder="City"
                        />
                        {errors.city && (
                          <em className="checkout-error">{errors.city}</em>
                        )}
                      </label>
                      <label className="checkout-field">
                        <span>State</span>
                        <select
                          name="state"
                          value={form.state}
                          onChange={onChange}
                        >
                          {STATES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="checkout-field">
                        <span>Pincode</span>
                        <input
                          name="pincode"
                          value={form.pincode}
                          onChange={onChange}
                          inputMode="numeric"
                          autoComplete="postal-code"
                          placeholder="6 digits"
                        />
                        {errors.pincode && (
                          <em className="checkout-error">{errors.pincode}</em>
                        )}
                      </label>
                    </div>

                    {!showNote ? (
                      <button
                        type="button"
                        className="checkout-note-toggle"
                        onClick={() => setShowNote(true)}
                      >
                        + Add delivery note
                      </button>
                    ) : (
                      <label className="checkout-field">
                        <span>Order note (optional)</span>
                        <input
                          name="notes"
                          value={form.notes}
                          onChange={onChange}
                          placeholder="Gift message or delivery note"
                          autoFocus
                        />
                      </label>
                    )}
                  </section>
                </form>
              </div>

              <aside className="checkout-summary" aria-label="Price details">
                <div className="checkout-summary__panel">
                  <section className="checkout-summary__offers">
                    <h2>Offers</h2>
                    {appliedCoupon?.ok || appliedCoupon?.code ? (
                      <div className="checkout-summary__coupon-applied">
                        <span
                          className="checkout-summary__coupon-applied-icon"
                          aria-hidden="true"
                        >
                          <CheckCircleIcon size={18} />
                        </span>
                        <div>
                          <strong>{appliedCoupon.code}</strong>
                          <span>
                            {appliedCoupon.label || appliedCoupon.message}
                          </span>
                        </div>
                        <button type="button" onClick={onRemoveCoupon}>
                          Remove
                        </button>
                      </div>
                    ) : (
                      <form
                        className="checkout-summary__coupon-row"
                        onSubmit={onApplyCoupon}
                      >
                        <span
                          className="checkout-summary__coupon-icon"
                          aria-hidden="true"
                        >
                          <GiftIcon size={16} />
                        </span>
                        <input
                          id="checkout-coupon"
                          type="text"
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value)
                            if (couponError) setCouponError('')
                          }}
                          placeholder="Enter coupon code"
                          autoComplete="off"
                          spellCheck={false}
                          aria-label="Coupon code"
                        />
                        <button
                          type="submit"
                          disabled={couponLoading || !cart.length}
                        >
                          {couponLoading ? '…' : 'Apply'}
                        </button>
                      </form>
                    )}
                    {couponError && (
                      <p className="checkout-error" role="alert">
                        {couponError}
                      </p>
                    )}
                    {!appliedCoupon?.code && (
                      <div className="checkout-summary__coupon-hint">
                        <span>Try</span>
                        <button
                          type="button"
                          onClick={() => setCouponInput('PAHAD15')}
                        >
                          PAHAD15
                        </button>
                        <button
                          type="button"
                          onClick={() => setCouponInput('HILL50')}
                        >
                          HILL50
                        </button>
                      </div>
                    )}
                  </section>

                  <section className="checkout-summary__pay">
                    <h2>Payment mode</h2>
                    <div
                      className="checkout-pay-mode"
                      role="radiogroup"
                      aria-label="Payment method"
                    >
                      {PAYMENTS.map((option) => {
                        const PayIcon = option.Icon
                        const active = payment === option.id
                        return (
                          <label
                            key={option.id}
                            className={`checkout-pay-mode__opt${
                              active ? ' is-active' : ''
                            }`}
                          >
                            <input
                              type="radio"
                              name="payment"
                              value={option.id}
                              checked={active}
                              onChange={() => setPayment(option.id)}
                            />
                            <span className="checkout-pay-mode__icon" aria-hidden="true">
                              <PayIcon size={20} />
                            </span>
                            <span className="checkout-pay-mode__text">
                              <strong>{option.title}</strong>
                              <em>{option.desc}</em>
                            </span>
                            {active && (
                              <span className="checkout-pay-mode__tick" aria-hidden="true">
                                <CheckCircleIcon size={16} />
                              </span>
                            )}
                          </label>
                        )
                      })}
                    </div>
                  </section>

                  <section className="checkout-summary__price">
                    <h2>Price details</h2>
                    <div className="checkout-summary__totals">
                      <div>
                        <span>Items total</span>
                        <span>{formatPrice(cartTotal)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="checkout-summary__discount">
                          <span>Coupon discount</span>
                          <span>−{formatPrice(discount)}</span>
                        </div>
                      )}
                      <div>
                        <span>Delivery</span>
                        <span className={shipping === 0 ? 'is-free' : undefined}>
                          {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                        </span>
                      </div>
                      <div className="checkout-summary__payable">
                        <span>Total</span>
                        <strong>{formatPrice(payable)}</strong>
                      </div>
                    </div>
                  </section>

                  {placeError && (
                    <p
                      className="checkout-error checkout-error--block"
                      role="alert"
                    >
                      {placeError}
                    </p>
                  )}

                  <button
                    type="submit"
                    form="checkout-form"
                    className="checkout-summary__cta"
                    disabled={placing}
                  >
                    {placing
                      ? 'Placing order…'
                      : `Place order · ${formatPrice(payable)}`}
                  </button>
                  <p className="checkout-summary__secure">
                    <ShieldIcon size={13} />
                    PahadLink secure checkout ·{' '}
                    {PAYMENTS.find((p) => p.id === payment)?.title || 'Pay'}
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <div className="checkout-mobile-bar">
          <div className="checkout-mobile-bar__total">
            <span>Total</span>
            <strong>{formatPrice(payable)}</strong>
          </div>
          <button type="button" disabled={placing} onClick={placeOrder}>
            {placing ? 'Placing…' : 'Place order'}
          </button>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default Checkout
