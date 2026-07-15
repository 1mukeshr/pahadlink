import { NavLink, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  BasketIcon,
  HeartIcon,
  CartIcon,
  UserIcon,
} from '../icons'
import { useAuth } from '../../context/AuthContext'
import { useShop } from '../../context/ShopContext'
import { AUTH_PATHS, ROUTES } from '../../config'

const hiddenExact = new Set([
  ...AUTH_PATHS,
  ROUTES.CHECKOUT,
])

/**
 * Fixed quick nav — mobile only.
 */
const MobileBottomNav = () => {
  const { pathname } = useLocation()
  const { isAuthenticated } = useAuth()
  const { cartCount, wishlistCount, cartOpen, openCart } = useShop()

  if (hiddenExact.has(pathname) || cartOpen) return null

  const accountTo = isAuthenticated ? ROUTES.ACCOUNT : ROUTES.LOGIN
  const accountLabel = isAuthenticated ? 'Account' : 'Login'
  const shopActive =
    pathname === ROUTES.SHOP ||
    pathname.startsWith('/category/') ||
    pathname.startsWith('/product/')
  const accountActive =
    pathname === accountTo ||
    pathname.startsWith('/account') ||
    pathname.startsWith('/orders')

  return (
    <nav className="mobile-bottom-nav" aria-label="Quick navigation">
      <NavLink
        to={ROUTES.HOME}
        end
        className={({ isActive }) =>
          `mobile-bottom-nav__item${isActive ? ' is-active' : ''}`
        }
      >
        <HomeIcon size={20} />
        <span>Home</span>
      </NavLink>

      <NavLink
        to={ROUTES.SHOP}
        className={`mobile-bottom-nav__item${shopActive ? ' is-active' : ''}`}
      >
        <BasketIcon size={20} />
        <span>Shop</span>
      </NavLink>

      <button
        type="button"
        className="mobile-bottom-nav__item mobile-bottom-nav__item--bag"
        onClick={openCart}
        aria-label={`Bag, ${cartCount} items`}
      >
        <span className="mobile-bottom-nav__icon-wrap">
          <CartIcon size={20} />
          {cartCount > 0 && (
            <span className="mobile-bottom-nav__badge">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </span>
        <span>Bag</span>
      </button>

      <NavLink
        to={ROUTES.WISHLIST}
        className={({ isActive }) =>
          `mobile-bottom-nav__item${isActive ? ' is-active' : ''}`
        }
      >
        <span className="mobile-bottom-nav__icon-wrap">
          <HeartIcon size={20} />
          {wishlistCount > 0 && (
            <span className="mobile-bottom-nav__badge">
              {wishlistCount > 99 ? '99+' : wishlistCount}
            </span>
          )}
        </span>
        <span>Wishlist</span>
      </NavLink>

      <NavLink
        to={accountTo}
        className={`mobile-bottom-nav__item${accountActive ? ' is-active' : ''}`}
      >
        <UserIcon size={20} />
        <span>{accountLabel}</span>
      </NavLink>
    </nav>
  )
}

export default MobileBottomNav
