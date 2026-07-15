import { memo, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useShop } from '../../context/ShopContext'
import { ROUTES, productPath } from '../../config'
import { CartIcon, CloseIcon, TruckIcon } from '../icons'

const formatPrice = (n) => `₹${n.toLocaleString('en-IN')}`
const FREE_SHIP_AT = 499
const SHIPPING_FEE = 49

/**
 * Right-side bag drawer - primary bag UX (no full bag page needed)
 */
const CartDrawer = () => {
  const navigate = useNavigate()
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

  const shipping = cart.length === 0 ? 0 : cartTotal >= FREE_SHIP_AT ? 0 : SHIPPING_FEE
  const payable = cartTotal + shipping
  const shipLeft = Math.max(0, FREE_SHIP_AT - cartTotal)
  const shipProgress = Math.min(100, Math.round((cartTotal / FREE_SHIP_AT) * 100))

  const goCheckout = () => {
    closeCart()
    navigate(ROUTES.CHECKOUT)
  }

  useEffect(() => {
    if (cartOpen && !wasOpen.current && panelRef.current) {
      panelRef.current.focus({ preventScroll: true })
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
              {shipLeft > 0 ? (
                <p>
                  Add <strong>{formatPrice(shipLeft)}</strong> more for free
                  delivery
                </p>
              ) : (
                <p>
                  <strong>Free delivery</strong> unlocked on this order
                </p>
              )}
            </div>
            <div className="bag-drawer__ship-bar" aria-hidden="true">
              <span style={{ width: `${shipProgress}%` }} />
            </div>
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
            <ul className="bag-drawer__list">
              {cart.map((item) => (
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

                    <span className="bag-drawer__size">
                      Size: {item.size || '-'}
                    </span>

                    <div className="bag-drawer__item-bottom">
                      <div className="bag-drawer__qty">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => updateCartQty(item.key, item.qty - 1)}
                        >
                          -
                        </button>
                        <span>{item.qty}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => updateCartQty(item.key, item.qty + 1)}
                        >
                          +
                        </button>
                      </div>
                      <div className="bag-drawer__prices">
                        <span className="bag-drawer__unit">
                          {formatPrice(item.price)} each
                        </span>
                        <span className="bag-drawer__price">
                          {formatPrice(item.price * item.qty)}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
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
              <div className="bag-drawer__total">
                <span>Total</span>
                <strong>{formatPrice(payable)}</strong>
              </div>
            </div>

            <button
              type="button"
              className="bag-drawer__checkout"
              onClick={goCheckout}
            >
              Continue · {formatPrice(payable)}
            </button>
            <button
              type="button"
              className="bag-drawer__continue"
              onClick={closeCart}
            >
              Continue shopping
            </button>
          </footer>
        )}
      </aside>
    </div>
  )
}

export default memo(CartDrawer)
