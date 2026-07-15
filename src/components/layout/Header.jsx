import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import CategoryNav from './CategoryNav'
import PincodeBox from './PincodeBox'
import HeaderSearch from './HeaderSearch'
import {
  MountainIcon,
  UserIcon,
  ChevronDownIcon,
  HeartIcon,
  CartIcon,
  PackageIcon,
  LogOutIcon,
} from '../icons'
import { useAuth } from '../../context/AuthContext'
import { useShop } from '../../context/ShopContext'
import { ROUTES } from '../../config'

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password']

const Header = () => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const { cartCount, wishlistCount, openCart } = useShop()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const showCategoryNav = !AUTH_PATHS.includes(pathname)
  const isAuthPage = AUTH_PATHS.includes(pathname)

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

  return (
    <header className={`site-header${showCategoryNav ? '' : ' site-header--auth'}`}>
      <div className="header-top">
        <div className="header-container">
          <div className="header-left">
            <Link to="/" className="header-logo" aria-label="PahadLink home">
              <span className="header-logo-mark" aria-hidden="true">
                <MountainIcon size={20} />
              </span>
              <span className="logo-brand">
                <span className="logo-text">
                  Pahad<span className="logo-accent">Link</span>
                </span>
                <span className="logo-tagline">Pure from the hills</span>
              </span>
            </Link>

            <span className="header-left-divider" aria-hidden="true" />

            {!isAuthPage && <PincodeBox />}
          </div>

          {!isAuthPage && (
            <div className="header-center">
              <HeaderSearch />
            </div>
          )}

          <nav className="header-nav" aria-label="Main navigation">
            {!isAuthPage && (
              <>
                <Link
                  to={ROUTES.WISHLIST}
                  className="header-icon-link"
                  aria-label={`Wishlist, ${wishlistCount} items`}
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
                </Link>

                <span className="header-nav-divider" aria-hidden="true" />

                <button
                  type="button"
                  className="header-icon-link"
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
                  Login
                  <ChevronDownIcon size={12} className="header-account-chevron" />
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
                    {user?.name?.split(' ')[0] || user?.username}
                    <ChevronDownIcon size={12} className="header-account-chevron" />
                  </span>
                </button>

                {menuOpen && (
                  <div className="header-account-dropdown" role="menu">
                    <div className="header-account-meta">
                      <span className="header-account-meta__avatar" aria-hidden="true">
                        <UserIcon size={18} />
                      </span>
                      <div className="header-account-meta__text">
                        <strong>{user?.name}</strong>
                        <span>{user?.email || user?.username}</span>
                      </div>
                    </div>

                    <div className="header-account-dropdown__group">
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
                      <Link
                        to={ROUTES.WISHLIST}
                        className="header-account-item"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        <HeartIcon size={16} />
                        <span>Wishlist</span>
                      </Link>
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
                Back to Home
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
