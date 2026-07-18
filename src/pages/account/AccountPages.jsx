import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Breadcrumb from '../../components/layout/Breadcrumb'
import Footer from '../../components/layout/Footer'
import {
  ArrowRightIcon,
  CloseIcon,
  LogOutIcon,
  MailIcon,
  PackageIcon,
  TruckIcon,
  UserIcon,
} from '../../components/icons'
import { ROUTES, ROLES } from '../../config'
import { useAuth } from '../../context/AuthContext'
import { resolveProductImage } from '../../data/siteData'
import { getOrdersForUser, saveOrder } from '../../utils/ordersStorage'
import {
  fetchMyOrders,
  mapApiOrderToUi,
  requestReturn,
  STATUS_LABELS,
  submitReview,
} from '../../services/orderService'

const FLOW_STEPS = [
  { key: 'pending', label: 'Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
]

const FLOW_INDEX = {
  pending: 0,
  confirmed: 1,
  processing: 1,
  shipped: 2,
  delivered: 3,
  return_requested: 3,
  returned: 3,
  cancelled: -1,
}

const initialsFrom = (name, email) => {
  const source = (name || email || 'P').trim()
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

const formatPrice = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const formatDateTime = (iso) => {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return '-'
  }
}

const paymentLabel = (id) => {
  if (id === 'upi') return 'UPI'
  if (id === 'card') return 'Card'
  return 'Cash on delivery'
}

const statusClass = (status) => {
  const key = String(status || 'pending').toLowerCase()
  if (key.includes('deliver')) return 'is-delivered'
  if (key.includes('ship')) return 'is-shipped'
  if (key.includes('cancel')) return 'is-cancelled'
  if (key.includes('return')) return 'is-return'
  if (key.includes('process') || key.includes('confirm')) return 'is-confirmed'
  return 'is-placed'
}

const statusText = (order) =>
  order?.statusLabel || STATUS_LABELS[order?.status] || order?.status || 'Pending'

const resolveItemImage = (item) => resolveProductImage(item)

const itemsSubtotal = (items) =>
  (items || []).reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1),
    0
  )


export const AccountPage = () => {
  const { user, logout, isAdmin, isSeller } = useAuth()
  const initials = initialsFrom(user?.name, user?.email)

  return (
    <>
      <main className="account-page">
        <div className="breadcrumb-bar">
          <div className="container">
            <Breadcrumb items={[{ label: 'My account' }]} />
          </div>
        </div>

        <section className="account-shell">
          <div className="container account-shell__inner">
            <div className="account-card">
              <div className="account-card__hero">
                <span className="account-card__avatar" aria-hidden="true">
                  {initials}
                </span>
                <p className="account-card__kicker">Welcome back</p>
                <h1>{user?.name || 'My account'}</h1>
                <p className="account-card__lead">
                  Your PahadLink profile and shopping details in one place.
                </p>
                {user?.role && user.role !== ROLES.CUSTOMER && (
                  <p className="account-card__role">Role: {user.role}</p>
                )}
              </div>

              <ul className="account-card__list">
                <li>
                  <span className="account-card__label">
                    <UserIcon size={14} />
                    Name
                  </span>
                  <strong>{user?.name || '-'}</strong>
                </li>
                <li>
                  <span className="account-card__label">
                    <MailIcon size={14} />
                    Email
                  </span>
                  <strong>{user?.email || '-'}</strong>
                </li>
                <li>
                  <span className="account-card__label">
                    <UserIcon size={14} />
                    Username
                  </span>
                  <strong>{user?.username || '-'}</strong>
                </li>
              </ul>

              <div className="account-card__quick">
                <Link to={ROUTES.ORDERS} className="account-card__quick-link">
                  <PackageIcon size={16} />
                  <span>
                    <strong>My orders</strong>
                    <em>Track deliveries</em>
                  </span>
                </Link>
                <Link to={ROUTES.SHOP} className="account-card__quick-link">
                  <TruckIcon size={16} />
                  <span>
                    <strong>Shop</strong>
                    <em>Browse products</em>
                  </span>
                </Link>
                {isAdmin && (
                  <Link to={ROUTES.ADMIN} className="account-card__quick-link">
                    <PackageIcon size={16} />
                    <span>
                      <strong>Admin panel</strong>
                      <em>Orders & inventory</em>
                    </span>
                  </Link>
                )}
                {isSeller && (
                  <Link to={ROUTES.SELLER} className="account-card__quick-link">
                    <TruckIcon size={16} />
                    <span>
                      <strong>Seller desk</strong>
                      <em>Process & ship</em>
                    </span>
                  </Link>
                )}
              </div>

              <div className="account-card__actions">
                <Link to={ROUTES.ORDERS} className="btn-hero-primary">
                  View my orders
                </Link>
                <button
                  type="button"
                  className="account-card__logout"
                  onClick={logout}
                >
                  <LogOutIcon size={15} />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

export const OrdersPage = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState(() => getOrdersForUser(user))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeOrderId, setActiveOrderId] = useState(null)
  const [returnReason, setReturnReason] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [actionMsg, setActionMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const apiOrders = await fetchMyOrders()
      setOrders(apiOrders)
      apiOrders.forEach((order) => {
        if (order?.id) saveOrder(order)
      })
    } catch (err) {
      setOrders(getOrdersForUser(user))
      setError(err.message || 'Could not sync orders from server')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const activeOrder = useMemo(
    () => orders.find((order) => order.id === activeOrderId || order.apiId === activeOrderId) || null,
    [orders, activeOrderId]
  )

  useEffect(() => {
    if (!activeOrder) return undefined

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e) => {
      if (e.key === 'Escape') setActiveOrderId(null)
    }
    document.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
    }
  }, [activeOrder])

  const activeItems = activeOrder?.items || []
  const activeItemCount = activeItems.reduce(
    (sum, item) => sum + (item.qty || 1),
    0
  )

  const openOrderPopup = (orderId) => {
    setActiveOrderId(orderId)
    setActionMsg('')
    setReturnReason('')
    setReviewComment('')
    setReviewRating(5)
  }

  const closeOrderPopup = () => setActiveOrderId(null)

  const onReturn = async () => {
    if (!activeOrder?.apiId) return
    setBusy(true)
    setActionMsg('')
    try {
      const data = await requestReturn(activeOrder.apiId, returnReason)
      const mapped = mapApiOrderToUi(data.order)
      setOrders((prev) =>
        prev.map((o) => (o.apiId === mapped.apiId ? mapped : o))
      )
      saveOrder(mapped)
      setActionMsg('Return requested')
      setActiveOrderId(mapped.id)
    } catch (err) {
      setActionMsg(err.message || 'Return failed')
    } finally {
      setBusy(false)
    }
  }

  const onReview = async () => {
    if (!activeOrder?.apiId) return
    setBusy(true)
    setActionMsg('')
    try {
      const data = await submitReview(activeOrder.apiId, {
        rating: reviewRating,
        comment: reviewComment,
      })
      const mapped = mapApiOrderToUi(data.order)
      setOrders((prev) =>
        prev.map((o) => (o.apiId === mapped.apiId ? mapped : o))
      )
      saveOrder(mapped)
      setActionMsg('Thanks for your review')
    } catch (err) {
      setActionMsg(err.message || 'Review failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <main className="account-page orders-page">
        <div className="breadcrumb-bar">
          <div className="container">
            <Breadcrumb
              items={[
                { label: 'My account', to: ROUTES.ACCOUNT },
                { label: 'My orders' },
              ]}
            />
          </div>
        </div>

        <section className="orders-shell" aria-labelledby="orders-title">
          <div className="container orders-shell__inner">
            <header className="orders-head">
              <div className="orders-head__copy">
                <h1 id="orders-title">My orders</h1>
                <p>
                  {loading
                    ? 'Syncing your orders…'
                    : orders.length === 0
                      ? 'Track deliveries and revisit past hill finds here.'
                      : `${orders.length} order${orders.length === 1 ? '' : 's'} · live status from warehouse`}
                </p>
              </div>
              <Link to={ROUTES.SHOP} className="orders-head__shop">
                Continue shopping
                <ArrowRightIcon size={15} />
              </Link>
            </header>

            {error && (
              <p className="orders-sync-note" role="status">
                {error}. Showing saved orders on this device.
              </p>
            )}

            {!loading && orders.length === 0 ? (
              <div className="orders-empty">
                <span className="orders-empty__icon" aria-hidden="true">
                  <PackageIcon size={26} />
                </span>
                <h2>No orders yet</h2>
                <p>
                  When you place an order, it will show up here with status,
                  items, and delivery details.
                </p>
                <div className="orders-empty__actions">
                  <Link to={ROUTES.SHOP} className="btn-hero-primary">
                    Start shopping
                  </Link>
                  <Link to={ROUTES.ACCOUNT} className="orders-empty__ghost">
                    Back to account
                  </Link>
                </div>
              </div>
            ) : (
              <ul className="orders-list">
                {orders.map((order) => {
                  const items = order.items || []
                  const preview = items.slice(0, 3)
                  const extra = Math.max(0, items.length - preview.length)
                  const itemCount = items.reduce(
                    (sum, item) => sum + (item.qty || 1),
                    0
                  )

                  return (
                    <li key={order.apiId || order.id} className="order-card">
                      <button
                        type="button"
                        className="order-card__hit"
                        onClick={() => openOrderPopup(order.id)}
                      >
                        <div className="order-card__main">
                          <div className="order-card__thumbs" aria-hidden="true">
                            {preview.map((item, idx) => {
                              const thumb = resolveItemImage(item)
                              return thumb ? (
                                <img
                                  key={`${order.id}-thumb-${item.id || idx}`}
                                  src={thumb}
                                  alt=""
                                  loading="lazy"
                                  decoding="async"
                                  style={{ zIndex: preview.length - idx }}
                                />
                              ) : (
                                <span
                                  key={`${order.id}-thumb-${idx}`}
                                  className="order-card__thumb-fallback"
                                  style={{ zIndex: preview.length - idx }}
                                >
                                  <PackageIcon size={14} />
                                </span>
                              )
                            })}
                            {extra > 0 && (
                              <span className="order-card__thumb-more">
                                +{extra}
                              </span>
                            )}
                          </div>

                          <div className="order-card__info">
                            <div className="order-card__top">
                              <div>
                                <span className="order-card__id">{order.id}</span>
                                <p className="order-card__date">
                                  {formatDateTime(order.createdAt)}
                                  {order.city
                                    ? ` · ${order.city}${
                                        order.state ? `, ${order.state}` : ''
                                      }`
                                    : ''}
                                </p>
                              </div>
                              <span
                                className={`order-card__status ${statusClass(
                                  order.status
                                )}`}
                              >
                                {statusText(order)}
                              </span>
                            </div>

                            <ul className="order-card__names">
                              {preview.map((item, idx) => (
                                <li key={`${order.id}-name-${item.id || idx}`}>
                                  {item.name}
                                  {item.size ? ` · ${item.size}` : ''}
                                  {(item.qty || 1) > 1
                                    ? ` ×${item.qty}`
                                    : ''}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="order-card__foot">
                          <span>
                            {itemCount} item{itemCount === 1 ? '' : 's'}
                          </span>
                          <span>{paymentLabel(order.payment)}</span>
                          <strong>{formatPrice(order.total)}</strong>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      </main>

      {activeOrder && (
        <div
          className="orders-detail-popup"
          role="dialog"
          aria-modal="true"
          aria-labelledby="orders-detail-title"
        >
          <button
            type="button"
            className="orders-detail-popup__backdrop"
            aria-label="Close order details"
            onClick={closeOrderPopup}
          />
          <div className="orders-detail-popup__panel">
            <header className="orders-detail-popup__head">
              <div className="orders-detail-popup__head-main">
                <div className="orders-detail-popup__title-row">
                  <p className="orders-detail-popup__eyebrow">Order details</p>
                  <span
                    className={`order-card__status ${statusClass(
                      activeOrder.status
                    )}`}
                  >
                    {statusText(activeOrder)}
                  </span>
                </div>
                <h2 id="orders-detail-title">{activeOrder.id}</h2>
                <p className="orders-detail-popup__date">
                  Placed {formatDateTime(activeOrder.createdAt)}
                </p>
              </div>
              <button
                type="button"
                className="orders-detail-popup__close"
                aria-label="Close"
                onClick={closeOrderPopup}
              >
                <CloseIcon size={16} />
              </button>
            </header>

            {activeOrder.status !== 'cancelled' && (
              <ol
                className="orders-detail-popup__steps"
                aria-label="Order progress"
              >
                {FLOW_STEPS.map((step, idx) => {
                  const current = FLOW_INDEX[activeOrder.status] ?? 0
                  const done = current >= idx
                  const active = current === idx
                  return (
                    <li
                      key={step.key}
                      className={`orders-detail-popup__step${
                        done ? ' is-done' : ''
                      }${active ? ' is-active' : ''}`}
                    >
                      <span className="orders-detail-popup__step-dot" />
                      <span className="orders-detail-popup__step-label">
                        {step.label}
                      </span>
                    </li>
                  )
                })}
              </ol>
            )}

            {(activeOrder.trackingNumber || activeOrder.courier) && (
              <div className="orders-detail-popup__track-card">
                <TruckIcon size={16} />
                <div>
                  <span>Shipment</span>
                  <strong>
                    {activeOrder.courier || 'Courier'}
                    {activeOrder.trackingNumber
                      ? ` · ${activeOrder.trackingNumber}`
                      : ''}
                  </strong>
                </div>
              </div>
            )}

            <div className="orders-detail-popup__body">
              <p className="orders-detail-popup__section-label">Items</p>
              <ul className="orders-detail-popup__items">
                {activeItems.map((item, idx) => {
                  const img = resolveItemImage(item)
                  return (
                    <li key={`${activeOrder.id}-popup-${item.id || idx}`}>
                      {img ? (
                        <img
                          src={img}
                          alt=""
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="orders-detail-popup__fallback">
                          <PackageIcon size={18} />
                        </span>
                      )}
                      <div>
                        <strong>{item.name}</strong>
                        <span>
                          {item.size ? `${item.size} · ` : ''}
                          Qty {item.qty || 1}
                        </span>
                      </div>
                      <em>{formatPrice(item.price * (item.qty || 1))}</em>
                    </li>
                  )
                })}
              </ul>

              <div className="orders-detail-popup__info-grid">
                <div className="orders-detail-popup__info-card">
                  <span>Payment</span>
                  <strong>{paymentLabel(activeOrder.payment)}</strong>
                  <em>
                    {activeOrder.paymentStatus
                      ? String(activeOrder.paymentStatus)
                      : 'pending'}
                  </em>
                </div>
                <div className="orders-detail-popup__info-card">
                  <span>Deliver to</span>
                  <strong>
                    {activeOrder.city || '—'}
                    {activeOrder.state ? `, ${activeOrder.state}` : ''}
                  </strong>
                  <em>
                    {[activeOrder.address, activeOrder.pincode]
                      .filter(Boolean)
                      .join(' · ') || `${activeItemCount} item${activeItemCount === 1 ? '' : 's'}`}
                  </em>
                </div>
              </div>

              <div className="orders-detail-popup__totals">
                <div>
                  <span>Subtotal</span>
                  <strong>
                    {formatPrice(
                      itemsSubtotal(activeItems) ||
                        Number(activeOrder.total || 0) -
                          Number(activeOrder.shipping || 0) +
                          Number(activeOrder.discount || 0)
                    )}
                  </strong>
                </div>
                <div>
                  <span>Shipping</span>
                  <strong>
                    {Number(activeOrder.shipping || 0) === 0
                      ? 'Free'
                      : formatPrice(activeOrder.shipping)}
                  </strong>
                </div>
                {Number(activeOrder.discount || 0) > 0 && (
                  <div className="is-discount">
                    <span>
                      Discount
                      {activeOrder.couponCode
                        ? ` (${activeOrder.couponCode})`
                        : ''}
                    </span>
                    <strong>-{formatPrice(activeOrder.discount)}</strong>
                  </div>
                )}
                <div className="orders-detail-popup__total">
                  <span>Total paid</span>
                  <strong>{formatPrice(activeOrder.total)}</strong>
                </div>
              </div>

              {activeOrder.status === 'delivered' && (
                <div className="orders-detail-actions">
                  <label>
                    Return reason
                    <input
                      type="text"
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      placeholder="Damaged / wrong item / other"
                    />
                  </label>
                  <button
                    type="button"
                    className="btn-hero-primary"
                    disabled={busy || !activeOrder.apiId}
                    onClick={onReturn}
                  >
                    Request return
                  </button>
                </div>
              )}

              {['delivered', 'returned'].includes(activeOrder.status) &&
                !activeOrder.review?.rating && (
                  <div className="orders-detail-actions">
                    <label>
                      Rating
                      <select
                        value={reviewRating}
                        onChange={(e) =>
                          setReviewRating(Number(e.target.value))
                        }
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>
                            {n} star{n === 1 ? '' : 's'}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Review
                      <input
                        type="text"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="How was your order?"
                      />
                    </label>
                    <button
                      type="button"
                      className="btn-hero-primary"
                      disabled={busy || !activeOrder.apiId}
                      onClick={onReview}
                    >
                      Submit review
                    </button>
                  </div>
                )}

              {activeOrder.review?.rating && (
                <p className="orders-detail-popup__review">
                  Your review: <strong>{activeOrder.review.rating}/5</strong>
                  {activeOrder.review.comment
                    ? ` — ${activeOrder.review.comment}`
                    : ''}
                </p>
              )}

              {actionMsg && (
                <p className="orders-sync-note" role="status">
                  {actionMsg}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}
