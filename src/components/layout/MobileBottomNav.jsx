import { NavLink, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  BasketIcon,
  HeartIcon,
  CartIcon,
  UserIcon,
  PackageIcon,
} from '../icons'
import { useAuth } from '../../context/AuthContext'
import { useShop } from '../../context/ShopContext'
import { AUTH_PATHS, ROUTES, homePathForRole } from '../../config'

const hiddenExact = new Set([
  ...AUTH_PATHS,
  ROUTES.CHECKOUT,
])

/**
 * Fixed quick nav - mobile only.
 */
const MobileBottomNav = () => {
  const { pathname } = useLocation()
  const { user, isAuthenticated, isAdmin, isSeller } = useAuth()
  const {
    cartCount,
    wishlistCount,
    cartOpen,
    wishlistOpen,
    openCart,
    openWishlist,
  } = useShop()

  if (hiddenExact.has(pathname)) return null

  const isStaff = isAdmin || isSeller
  const deskTo = isAuthenticated && isStaff ? homePathForRole(user) : null
  const accountTo = isAuthenticated
    ? deskTo || ROUTES.ACCOUNT
    : ROUTES.LOGIN
  const accountLabel = isAuthenticated
    ? isAdmin
      ? 'Admin'
      : isSeller
        ? 'Seller'
        : user?.name?.split(' ')[0] || user?.username || 'Account'
    : 'Login'
  const shopActive =
    pathname === ROUTES.SHOP ||
    pathname.startsWith('/category/') ||
    pathname.startsWith('/product/')
  const accountActive =
    pathname === accountTo ||
    pathname.startsWith('/account') ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/seller')

  if (isStaff) {
    return (
      <nav
        className={`mobile-bottom-nav${cartOpen ? ' is-covered' : ''}`}
        aria-label="Staff navigation"
        aria-hidden={cartOpen}
      >
        {isAdmin && (
          <NavLink
            to={ROUTES.ADMIN}
            end
            className={({ isActive }) =>
              `mobile-bottom-nav__item${isActive ? ' is-active' : ''}`
            }
          >
            <PackageIcon size={20} />
            <span>Admin</span>
          </NavLink>
        )}

        <NavLink
          to={ROUTES.SELLER}
          className={({ isActive }) =>
            `mobile-bottom-nav__item${isActive ? ' is-active' : ''}`
          }
        >
          <PackageIcon size={20} />
          <span>{isAdmin ? 'Fulfil' : 'Seller'}</span>
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

  return (
    <nav
      className={`mobile-bottom-nav${cartOpen ? ' is-covered' : ''}`}
      aria-label="Quick navigation"
      aria-hidden={cartOpen}
    >
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

      <button
        type="button"
        className={`mobile-bottom-nav__item${wishlistOpen ? ' is-active' : ''}`}
        onClick={openWishlist}
        aria-label={`Wishlist, ${wishlistCount} items`}
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
      </button>

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
