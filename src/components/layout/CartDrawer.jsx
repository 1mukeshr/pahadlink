import { memo, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useShop } from '../../context/ShopContext'
import { ROUTES, productPath } from '../../config'
import {
  hasCompleteShippingAddress,
  requestOpenAddressPicker,
} from '../../utils/locationStorage'
import {
  CartIcon,
  CloseIcon,
  TruckIcon,
  ArrowRightIcon,
  DropdownIcon,
} from '../icons'
import {
  FREE_SHIP_AT,
  FIRST_ORDER_DISCOUNT,
  SHIPPING_FEE,
  calcShipping,
} from '../../data/coupons'
import { GST_RATE_PERCENT, buildGstBreakdown } from '../../data/gst'
import { fetchFirstOrderStatus } from '../../services/orderService'

const formatPrice = (n) => `₹${n.toLocaleString('en-IN')}`
const COLLAPSED_ITEM_COUNT = 4

/**
 * Right-side bag drawer - primary bag UX (no full bag page needed)
 */
const CartDrawer = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const {
    cart,
    cartCount,
    cartTotal,
    cartOpen,
    closeCart,
    updateCartQty,
    removeFromCart,
  } = useShop()
  const panelRef = useRef(null)
  const wasOpen = useRef(false)
  const [showAllItems, setShowAllItems] = useState(false)
  // Default true — every new customer gets free delivery on first order
  const [isFirstOrder, setIsFirstOrder] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const first = await fetchFirstOrderStatus(user?.email || '')
        if (!cancelled) setIsFirstOrder(first)
      } catch {
        if (!cancelled) setIsFirstOrder(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.email, isAuthenticated])

  const shipping =
    cart.length === 0 ? 0 : calcShipping(cartTotal, { isFirstOrder })
  const taxableValue = cartTotal + shipping
  const gst = buildGstBreakdown(taxableValue)
  const payable = gst.taxableValue + gst.gstAmount
  const shipLeft = Math.max(0, FREE_SHIP_AT - cartTotal)
  const shipProgress = Math.min(100, Math.round((cartTotal / FREE_SHIP_AT) * 100))
  const hiddenItemCount = Math.max(0, cart.length - COLLAPSED_ITEM_COUNT)
  const visibleItems = showAllItems ? cart : cart.slice(0, COLLAPSED_ITEM_COUNT)

  const goCheckout = () => {
    closeCart()
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN, {
        state: { from: ROUTES.CHECKOUT, intent: 'checkout' },
      })
      return
    }
    if (!hasCompleteShippingAddress()) {
      navigate(ROUTES.HOME)
      requestOpenAddressPicker({
        message:
          'Add your current location and delivery address, then continue to checkout.',
        resumeCheckout: true,
      })
      return
    }
    navigate(ROUTES.CHECKOUT)
  }

  useEffect(() => {
    if (cartOpen && !wasOpen.current && panelRef.current) {
      panelRef.current.focus({ preventScroll: true })
      setShowAllItems(false)
    }
    wasOpen.current = cartOpen
  }, [cartOpen])

  return (
    <div
      className={`bag-drawer${cartOpen ? ' bag-drawer--open' : ''}`}
      aria-hidden={!cartOpen}
    >
      <button
        type="button"
        className="bag-drawer__backdrop"
        aria-label="Close bag"
        tabIndex={cartOpen ? 0 : -1}
        onClick={closeCart}
      />

      <aside
        ref={panelRef}
        className="bag-drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
        tabIndex={-1}
      >
        <header className="bag-drawer__head">
          <div className="bag-drawer__head-text">
            <h2>My bag</h2>
            <span className="bag-drawer__count">
              {cartCount} item{cartCount === 1 ? '' : 's'}
            </span>
          </div>
          <button
            type="button"
            className="bag-drawer__close"
            aria-label="Close bag"
            onClick={closeCart}
          >
            <CloseIcon size={18} />
          </button>
        </header>

        {cart.length > 0 && (
          <div className="bag-drawer__ship">
            <div className="bag-drawer__ship-row">
              <TruckIcon size={16} />
              {isFirstOrder || shipping === 0 ? (
                <p>
                  {isFirstOrder ? (
                    <>
                      <strong>Free delivery</strong> on your first order
                      {' · '}₹{FIRST_ORDER_DISCOUNT} off
                    </>
                  ) : (
                    <>
                      <strong>Free delivery</strong> unlocked on this order
                    </>
                  )}
                </p>
              ) : (
                <p>
                  Delivery <strong>{formatPrice(SHIPPING_FEE)}</strong>
                  {shipLeft > 0 ? (
                    <>
                      {' · '}add <strong>{formatPrice(shipLeft)}</strong> more
                      for free
                    </>
                  ) : null}
                </p>
              )}
            </div>
            {!isFirstOrder && shipLeft > 0 ? (
              <div className="bag-drawer__ship-bar" aria-hidden="true">
                <span style={{ width: `${shipProgress}%` }} />
              </div>
            ) : null}
          </div>
        )}

        <div className="bag-drawer__body">
          {cart.length === 0 ? (
            <div className="bag-drawer__empty">
              <span className="bag-drawer__empty-icon">
                <CartIcon size={28} />
              </span>
              <h3>Your bag is empty</h3>
              <p>Fresh pahadi picks are waiting - add something you love.</p>
              <button
                type="button"
                className="bag-drawer__checkout"
                onClick={closeCart}
              >
                Continue shopping
              </button>
            </div>
          ) : (
            <div className="bag-drawer__items">
              <ul className="bag-drawer__list">
                {visibleItems.map((item) => (
                  <li key={item.key} className="bag-drawer__item">
                  <Link
                    to={productPath(item.id)}
                    className="bag-drawer__thumb"
                    onClick={closeCart}
                  >
                    <img
                      src={item.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  </Link>

                  <div className="bag-drawer__item-info">
                    <div className="bag-drawer__item-top">
                      <Link
                        to={productPath(item.id)}
                        className="bag-drawer__name"
                        onClick={closeCart}
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        className="bag-drawer__remove"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => removeFromCart(item.key)}
                      >
                        <CloseIcon size={14} />
                      </button>
                    </div>

                    <div className="bag-drawer__item-meta">
                      <span className="bag-drawer__size">{item.size || '-'}</span>
                      <div className="bag-drawer__qty">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => updateCartQty(item.key, item.qty - 1)}
                        >
                          −
                        </button>
                        <span>{item.qty}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          disabled={
                            typeof item.maxStock === 'number' &&
                            item.qty >= item.maxStock
                          }
                          onClick={() => updateCartQty(item.key, item.qty + 1)}
                        >
                          +
                        </button>
                      </div>
                      <span className="bag-drawer__price">
                        {formatPrice(item.price * item.qty)}
                      </span>
                    </div>
                  </div>
                  </li>
                ))}
              </ul>

              {hiddenItemCount > 0 && (
                <button
                  type="button"
                  className={`bag-drawer__more${
                    showAllItems ? ' bag-drawer__more--open' : ''
                  }`}
                  aria-expanded={showAllItems}
                  onClick={() => setShowAllItems((show) => !show)}
                >
                  <span>
                    {showAllItems
                      ? 'Show less'
                      : `Show ${hiddenItemCount} more item${
                          hiddenItemCount === 1 ? '' : 's'
                        }`}
                  </span>
                  <DropdownIcon size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <footer className="bag-drawer__foot">
            <div className="bag-drawer__summary">
              <div className="bag-drawer__line">
                <span>Subtotal</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <div className="bag-drawer__line bag-drawer__line--muted">
                <span>Delivery</span>
                <span className={shipping === 0 ? 'is-free' : undefined}>
                  {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                </span>
              </div>
              <div className="bag-drawer__line bag-drawer__line--muted">
                <span>GST ({GST_RATE_PERCENT}%)</span>
                <span>{formatPrice(gst.gstAmount)}</span>
              </div>
              <div className="bag-drawer__total">
                <span>Total</span>
                <strong>{formatPrice(payable)}</strong>
              </div>
              <p className="bag-drawer__gst-note">
                Including GST ({GST_RATE_PERCENT}%)
              </p>
            </div>

            <button
              type="button"
              className="bag-drawer__checkout"
              onClick={goCheckout}
            >
              Proceed to checkout
              <ArrowRightIcon size={16} />
            </button>
          </footer>
        )}
      </aside>
    </div>
  )
}

export default memo(CartDrawer)
