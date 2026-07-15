import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Breadcrumb from '../../components/layout/Breadcrumb'
import Footer from '../../components/layout/Footer'
import {
  CheckCircleIcon,
  CloseIcon,
  ShieldIcon,
  TruckIcon,
  CartIcon,
  CodIcon,
  UpiIcon,
  CardPayIcon,
} from '../../components/icons'
import { ROUTES, STORAGE } from '../../config'
import { useAuth } from '../../context/AuthContext'
import { useShop } from '../../context/ShopContext'
import { saveOrder } from '../../utils/ordersStorage'

const FREE_SHIP_AT = 499
const SHIPPING_FEE = 49
const ORDER_POPUP_MS = 35000

const STATES = [
  'Uttarakhand',
  'Himachal Pradesh',
  'Delhi',
  'Uttar Pradesh',
  'Haryana',
  'Punjab',
  'Rajasthan',
  'Maharashtra',
  'Karnataka',
  'Other',
]

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

const parseLocation = (location) => {
  if (!location) return { city: '', state: '', pincode: '' }
  const pincode = location.pin || ''
  let city = ''
  let state = ''
  if (location.label) {
    const parts = String(location.label)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (parts[0]) city = parts[0]
    if (parts[1]) {
      const match = STATES.find(
        (s) => s.toLowerCase() === parts[1].toLowerCase()
      )
      state = match || parts[1]
    }
  }
  return { city, state, pincode }
}

const buildInitialForm = (user) => {
  const saved = readJson(STORAGE.CHECKOUT_ADDRESS) || {}
  const fromLoc = parseLocation(readJson(STORAGE.LOCATION))
  const state =
    saved.state && STATES.includes(saved.state)
      ? saved.state
      : fromLoc.state && STATES.includes(fromLoc.state)
        ? fromLoc.state
        : 'Uttarakhand'

  return {
    name: user?.name || saved.name || '',
    email: user?.email || saved.email || '',
    phone: saved.phone || '',
    address: saved.address || '',
    landmark: saved.landmark || '',
    city: saved.city || fromLoc.city || '',
    state,
    pincode: saved.pincode || fromLoc.pincode || '',
    notes: '',
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

  const shipping = cartTotal >= FREE_SHIP_AT ? 0 : SHIPPING_FEE
  const payable = cartTotal + shipping
  const shipLeft = Math.max(0, FREE_SHIP_AT - cartTotal)
  const shipProgress = Math.min(100, Math.round((cartTotal / FREE_SHIP_AT) * 100))

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

  const placeOrder = (e) => {
    e?.preventDefault?.()
    if (!cart.length || !validate()) return

    setPlacing(true)
    const orderId = makeOrderId()
    const placed = {
      id: orderId,
      payment,
      total: payable,
      shipping,
      itemCount: cart.length,
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        qty: item.qty || 1,
        price: item.price,
        size: item.size,
        image: item.image,
      })),
      email: form.email.trim(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      state: form.state,
      pincode: form.pincode.trim(),
      address: form.address.trim(),
      landmark: form.landmark.trim(),
      notes: form.notes.trim(),
      createdAt: new Date().toISOString(),
      status: 'Placed',
    }
    window.setTimeout(() => {
      persistAddress(form)
      saveOrder(placed)
      setOrder({
        id: placed.id,
        payment: placed.payment,
        total: placed.total,
        shipping: placed.shipping,
        items: placed.itemCount,
        email: placed.email,
      })
      clearCart()
      closeCart()
      setPlacing(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 700)
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
              <CloseIcon size={18} />
            </button>

            <span className="order-popup__icon" aria-hidden="true">
              <CheckCircleIcon size={34} />
            </span>
            <p className="order-popup__kicker">Order confirmed</p>
            <h2 id="order-popup-title">Thank you for your order</h2>
            <p className="order-popup__lead">
              Order <strong>{order.id}</strong> is placed
              {order.email ? (
                <>
                  . Confirmation will go to <strong>{order.email}</strong>
                </>
              ) : null}
              .
            </p>

            <ul className="order-popup__meta">
              <li>
                <span>Payment</span>
                <strong>{paymentLabel}</strong>
              </li>
              <li>
                <span>Items</span>
                <strong>{order.items}</strong>
              </li>
              <li>
                <span>Total</span>
                <strong>{formatPrice(order.total)}</strong>
              </li>
            </ul>

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
            <p className="order-popup__hint">Closes automatically in about 35 seconds</p>
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
      <main className="checkout-page">
        <div className="breadcrumb-bar">
          <div className="container">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        </div>

        <section className="checkout-shell" aria-label="Checkout">
          <div className="container">
            <nav className="bag-steps" aria-label="Checkout steps">
              <button type="button" className="bag-steps__btn" onClick={openCart}>
                Bag
              </button>
              <i />
              <span className="is-active">Address</span>
              <i />
              <span className="is-active">Payment</span>
            </nav>

            <div className="checkout-shell__grid">
              <div className="checkout-main">
                <header className="checkout-head">
                  <h1>Checkout</h1>
                  <p>
                    {cartCount} item{cartCount === 1 ? '' : 's'} · enter delivery
                    & payment
                  </p>
                </header>

                <form
                  id="checkout-form"
                  className="checkout-form"
                  onSubmit={placeOrder}
                  noValidate
                >
                  <fieldset className="checkout-block">
                    <legend>Contact</legend>
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
                  </fieldset>

                  <fieldset className="checkout-block">
                    <legend>Delivery address</legend>
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
                  </fieldset>
                </form>
              </div>

              <aside className="checkout-summary" aria-label="Order summary">
                <div className="checkout-summary__panel">
                  <div className="checkout-summary__head">
                    <div>
                      <h2>Order summary</h2>
                      <p>
                        {cartCount} item{cartCount === 1 ? '' : 's'}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="checkout-summary__edit"
                      onClick={openCart}
                    >
                      Edit bag
                    </button>
                  </div>

                  <ul className="checkout-summary__list">
                    {cart.map((item) => (
                      <li key={item.key} className="checkout-summary__item">
                        <div className="checkout-summary__thumb">
                          <img
                            src={item.image}
                            alt=""
                            loading="lazy"
                            decoding="async"
                          />
                          <span>{item.qty}</span>
                        </div>
                        <div className="checkout-summary__meta">
                          <div className="checkout-summary__title-row">
                            <strong>{item.name}</strong>
                            <b>{formatPrice(item.price * item.qty)}</b>
                          </div>
                          <span className="checkout-summary__size">
                            {item.size}
                          </span>
                          <div className="checkout-summary__controls">
                            <div className="checkout-summary__qty">
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
                                onClick={() =>
                                  updateCartQty(item.key, item.qty + 1)
                                }
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              className="checkout-summary__remove"
                              onClick={() => removeFromCart(item.key)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div
                    className={`checkout-summary__ship${
                      shipLeft === 0 ? ' is-free' : ''
                    }`}
                  >
                    <div className="checkout-summary__ship-row">
                      <TruckIcon size={15} />
                      {shipLeft > 0 ? (
                        <p>
                          Add <strong>{formatPrice(shipLeft)}</strong> more for
                          free delivery
                        </p>
                      ) : (
                        <p>
                          <strong>Free delivery</strong> on this order
                        </p>
                      )}
                    </div>
                    <div
                      className="checkout-summary__ship-bar"
                      aria-hidden="true"
                    >
                      <span style={{ width: `${shipProgress}%` }} />
                    </div>
                  </div>

                  <div className="checkout-summary__totals">
                    <div>
                      <span>Subtotal</span>
                      <span>{formatPrice(cartTotal)}</span>
                    </div>
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

                  <div className="checkout-summary__pay">
                    <h3>Payment</h3>
                    <div
                      className="checkout-payments checkout-payments--chips"
                      role="radiogroup"
                      aria-label="Payment method"
                    >
                      {PAYMENTS.map((option) => {
                        const PayIcon = option.Icon
                        return (
                          <label
                            key={option.id}
                            className={`checkout-pay-chip${
                              payment === option.id ? ' is-active' : ''
                            }`}
                          >
                            <input
                              type="radio"
                              name="payment"
                              value={option.id}
                              checked={payment === option.id}
                              onChange={() => setPayment(option.id)}
                            />
                            <span className="checkout-pay-chip__icon" aria-hidden="true">
                              <PayIcon size={22} />
                            </span>
                            <strong>{option.title}</strong>
                            <span>{option.desc}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

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
                    Secure checkout · {PAYMENTS.find((p) => p.id === payment)?.title || 'Pay'}
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <div className="checkout-mobile-bar">
          <div>
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
