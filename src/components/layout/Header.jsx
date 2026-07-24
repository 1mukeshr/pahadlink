import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import CategoryNav from './CategoryNav'
import PincodeBox from './PincodeBox'
import HeaderSearch from './HeaderSearch'
import {
  UserIcon,
  DropdownIcon,
  HeartIcon,
  CartIcon,
  PackageIcon,
  LogOutIcon,
  ArrowLeftIcon,
  CloseIcon,
  GiftIcon,
} from '../icons'
import { useAuth } from '../../context/AuthContext'
import { useShop } from '../../context/ShopContext'
import { ROUTES, AUTH_PATHS, HIDE_CATEGORY_NAV_PATHS, STORAGE } from '../../config'
import { capitalizeWords } from '../../utils/text'
import logo from '../../assets/images/logo.png'

const PROMO = {
  text: 'Flat ₹75 off on your first order',
  code: 'PAHAD15',
  extra: 'Free delivery on first order · later from ₹39',
  to: `${ROUTES.SHOP}?tag=bestseller`,
}

const Header = () => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout, isAdmin, isSeller } = useAuth()
  const { cartCount, wishlistCount, openCart, openWishlist } = useShop()
  const [menuOpen, setMenuOpen] = useState(false)
  const [promoOpen, setPromoOpen] = useState(() => {
    try {
      return localStorage.getItem(STORAGE.PROMO_BAR) !== '1'
    } catch {
      return true
    }
  })
  const menuRef = useRef(null)

  const isAuthPage = AUTH_PATHS.includes(pathname)
  const showCategoryNav =
    !isAuthPage && !HIDE_CATEGORY_NAV_PATHS.includes(pathname)
  const showPromo = promoOpen && !isAuthPage

  const accountLabel = capitalizeWords(
    user?.name?.split(' ')[0] || user?.username || 'Account'
  )
  const accountFullName = capitalizeWords(user?.name || user?.username || 'Account')

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const onLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  const dismissPromo = () => {
    setPromoOpen(false)
    try {
      localStorage.setItem(STORAGE.PROMO_BAR, '1')
    } catch {
      // ignore
    }
  }

  return (
    <header
      className={`site-header${isAuthPage ? ' site-header--auth' : ''}${
        showPromo ? ' has-promo' : ''
      }`}
    >
      {showPromo && (
        <div className="header-promo" role="region" aria-label="Site offer">
          <div className="header-promo__inner">
            <GiftIcon size={15} className="header-promo__gift" aria-hidden="true" />
            <p className="header-promo__copy">
              <strong className="header-promo__title">{PROMO.text}</strong>
              <span className="header-promo__sep" aria-hidden="true">
                ·
              </span>
              <span className="header-promo__code">
                Use code <em>{PROMO.code}</em>
              </span>
              <span className="header-promo__sep header-promo__sep--extra" aria-hidden="true">
                ·
              </span>
              <span className="header-promo__extra">{PROMO.extra}</span>
            </p>
            <Link to={PROMO.to} className="header-promo__cta">
              Shop now
            </Link>
            <button
              type="button"
              className="header-promo__close"
              aria-label="Dismiss offer"
              onClick={dismissPromo}
            >
              <CloseIcon size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="header-top">
        <div className="header-container">
          <div className="header-left">
            <Link to="/" className="header-logo" aria-label="PahadLink home">
              <img src={logo} alt="PahadLink" className="header-logo__img" />
            </Link>

            {!isAuthPage && <PincodeBox />}
          </div>

          {!isAuthPage && (
            <div className="header-center">
              <HeaderSearch />
            </div>
          )}

          <nav className="header-nav" aria-label="Main navigation">
            {!isAuthPage && (isAdmin || isSeller) && (
              <>
                {isAdmin && (
                  <Link
                    to={ROUTES.ADMIN}
                    className="header-icon-link"
                    aria-label="Admin panel"
                  >
                    <span className="header-icon-wrap">
                      <PackageIcon size={20} />
                    </span>
                    <span className="header-icon-label">Admin</span>
                  </Link>
                )}
                <Link
                  to={ROUTES.SELLER}
                  className="header-icon-link"
                  aria-label={isAdmin ? 'Fulfilment desk' : 'Seller desk'}
                >
                  <span className="header-icon-wrap">
                    <PackageIcon size={20} />
                  </span>
                  <span className="header-icon-label">
                    {isAdmin ? 'Fulfilment' : 'Seller'}
                  </span>
                </Link>
                <span className="header-nav-divider" aria-hidden="true" />
              </>
            )}

            {!isAuthPage && !isAdmin && !isSeller && (
              <>
                <button
                  type="button"
                  className="header-icon-link"
                  aria-label={`Wishlist, ${wishlistCount} items`}
                  onClick={openWishlist}
                >
                  <span className="header-icon-wrap">
                    <HeartIcon size={20} />
                    {wishlistCount > 0 && (
                      <span className="header-badge">
                        {wishlistCount > 99 ? '99+' : wishlistCount}
                      </span>
                    )}
                  </span>
                  <span className="header-icon-label">Wishlist</span>
                </button>

                <span className="header-nav-divider" aria-hidden="true" />

                <button
                  type="button"
                  className="header-icon-link header-bag"
                  aria-label={`Bag, ${cartCount} items`}
                  onClick={openCart}
                >
                  <span className="header-icon-wrap">
                    <CartIcon size={20} />
                    {cartCount > 0 && (
                      <span className="header-badge">
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </span>
                  <span className="header-icon-label">Bag</span>
                </button>

                <span className="header-nav-divider" aria-hidden="true" />
              </>
            )}

            {!isAuthPage && !isAuthenticated && (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `header-icon-link header-account${isActive ? ' header-account--active' : ''}`
                }
              >
                <span className="header-icon-wrap">
                  <UserIcon size={20} />
                </span>
                <span className="header-icon-label">
                  Account
                </span>
              </NavLink>
            )}

            {!isAuthPage && isAuthenticated && (
              <div className="header-account-menu" ref={menuRef}>
                <button
                  type="button"
                  className="header-icon-link header-account header-account--btn"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-expanded={menuOpen}
                >
                  <span className="header-icon-wrap">
                    <UserIcon size={20} />
                  </span>
                  <span className="header-icon-label">
                    {accountLabel}
                    <DropdownIcon
                      size={14}
                      className={`header-account-chevron${menuOpen ? ' is-open' : ''}`}
                    />
                  </span>
                </button>

                {menuOpen && (
                  <div className="header-account-dropdown" role="menu">
                    <div className="header-account-meta">
                      <span className="header-account-meta__avatar" aria-hidden="true">
                        <UserIcon size={18} />
                      </span>
                      <div className="header-account-meta__text">
                        <strong>{accountFullName}</strong>
                        <span>{user?.email || user?.username}</span>
                      </div>
                    </div>

                    <div className="header-account-dropdown__group">
                      {isAdmin && (
                        <Link
                          to={ROUTES.ADMIN}
                          className="header-account-item"
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                        >
                          <PackageIcon size={16} />
                          <span>Admin panel</span>
                        </Link>
                      )}
                      {(isSeller || isAdmin) && (
                        <Link
                          to={ROUTES.SELLER}
                          className="header-account-item"
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                        >
                          <PackageIcon size={16} />
                          <span>{isAdmin ? 'Fulfilment desk' : 'Seller desk'}</span>
                        </Link>
                      )}
                      {!isAdmin && !isSeller && (
                        <>
                          <Link
                            to={ROUTES.ACCOUNT}
                            className="header-account-item"
                            role="menuitem"
                            onClick={() => setMenuOpen(false)}
                          >
                            <UserIcon size={16} />
                            <span>My account</span>
                          </Link>
                          <Link
                            to={ROUTES.ORDERS}
                            className="header-account-item"
                            role="menuitem"
                            onClick={() => setMenuOpen(false)}
                          >
                            <PackageIcon size={16} />
                            <span>My orders</span>
                          </Link>
                          <button
                            type="button"
                            className="header-account-item"
                            role="menuitem"
                            onClick={() => {
                              setMenuOpen(false)
                              openWishlist()
                            }}
                          >
                            <HeartIcon size={16} />
                            <span>Wishlist</span>
                          </button>
                        </>
                      )}
                      {(isAdmin || isSeller) && (
                        <Link
                          to={ROUTES.ACCOUNT}
                          className="header-account-item"
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                        >
                          <UserIcon size={16} />
                          <span>Account</span>
                        </Link>
                      )}
                    </div>

                    <div className="header-account-dropdown__foot">
                      <button
                        type="button"
                        className="header-account-item header-account-item--danger"
                        role="menuitem"
                        onClick={onLogout}
                      >
                        <LogOutIcon size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isAuthPage && (
              <Link to="/" className="header-auth-home">
                <ArrowLeftIcon size={16} className="header-auth-home__icon" />
                <span>Back to Home</span>
              </Link>
            )}
          </nav>
        </div>
      </div>

      {showCategoryNav && <CategoryNav />}
    </header>
  )
}

export default Header
