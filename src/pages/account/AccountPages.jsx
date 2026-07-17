import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import Breadcrumb from '../../components/layout/Breadcrumb'
import Footer from '../../components/layout/Footer'
import {
  LogOutIcon,
  MailIcon,
  PackageIcon,
  PhoneIcon,
  TruckIcon,
  UserIcon,
} from '../../components/icons'
import { ROUTES } from '../../config'
import { useAuth } from '../../context/AuthContext'
import { getOrdersForUser } from '../../utils/ordersStorage'

const initialsFrom = (name, email) => {
  const source = (name || email || 'P').trim()
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

const formatPrice = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const formatDate = (iso) => {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
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
  const key = String(status || 'placed').toLowerCase()
  if (key.includes('deliver')) return 'is-delivered'
  if (key.includes('ship')) return 'is-shipped'
  if (key.includes('cancel')) return 'is-cancelled'
  return 'is-placed'
}

export const AccountPage = () => {
  const { user, logout } = useAuth()
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
  const orders = useMemo(
    () => getOrdersForUser(user?.email),
    [user?.email]
  )

  return (
    <>
      <main className="account-page">
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

        <section className="orders-shell">
          <div className="container orders-shell__inner">
            <header className="orders-head">
              <div>
                <p className="orders-head__kicker">Order history</p>
                <h1>My orders</h1>
                <p>
                  Track deliveries, review past purchases, and reorder your
                  favourites.
                </p>
              </div>
              <div className="orders-head__meta">
                <span>{orders.length} order{orders.length === 1 ? '' : 's'}</span>
                <Link to={ROUTES.SHOP}>Continue shopping</Link>
              </div>
            </header>

            <div className="orders-trust">
              <div>
                <TruckIcon size={16} />
                <span>Usually ships in 24-48 hrs</span>
              </div>
              <div>
                <PackageIcon size={16} />
                <span>Pan-India delivery in 2-5 days</span>
              </div>
              <div>
                <PhoneIcon size={16} />
                <span>Support on WhatsApp anytime</span>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="orders-empty">
                <span className="orders-empty__icon" aria-hidden="true">
                  <PackageIcon size={28} />
                </span>
                <h2>No orders yet</h2>
                <p>
                  Your purchases will appear here after checkout - with order ID,
                  status, and item details.
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
                {orders.map((order) => (
                  <li key={order.id} className="order-card">
                    <div className="order-card__top">
                      <div>
                        <span className="order-card__id">{order.id}</span>
                        <p className="order-card__date">
                          Placed on {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`order-card__status ${statusClass(order.status)}`}
                      >
                        {order.status || 'Placed'}
                      </span>
                    </div>

                    <div className="order-card__items">
                      {(order.items || []).slice(0, 3).map((item, idx) => (
                        <div
                          key={`${order.id}-${item.id || idx}`}
                          className="order-card__item"
                        >
                          {item.image ? (
                            <img
                              src={item.image}
                              alt=""
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <span className="order-card__item-fallback">
                              <PackageIcon size={14} />
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
                        </div>
                      ))}
                      {(order.items || []).length > 3 && (
                        <p className="order-card__more">
                          +{(order.items || []).length - 3} more item
                          {(order.items || []).length - 3 === 1 ? '' : 's'}
                        </p>
                      )}
                    </div>

                    <div className="order-card__foot">
                      <div>
                        <span>Payment</span>
                        <strong>{paymentLabel(order.payment)}</strong>
                      </div>
                      <div>
                        <span>Ship to</span>
                        <strong>
                          {order.city || '-'}
                          {order.state ? `, ${order.state}` : ''}
                        </strong>
                      </div>
                      <div className="order-card__total">
                        <span>Total</span>
                        <strong>{formatPrice(order.total)}</strong>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
