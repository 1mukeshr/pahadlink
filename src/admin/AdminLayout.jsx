import { useEffect, useState } from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { ROUTES } from '../config'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/images/logo.png'
import './admin.css'

const BASE = import.meta.env.BASE_URL || '/'
const FAVICON_PNG = `${BASE}favicon.png`
const FAVICON_ICO = `${BASE}favicon.ico`

function initialsFrom(name, email) {
  const source = String(name || email || 'P').trim()
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

export default function AdminLayout({ children, mode = 'admin' }) {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)

  const portalLabel =
    mode === 'admin'
      ? 'Admin'
      : isAdmin
        ? 'Sellers'
        : 'Seller'

  const roleLabel =
    user?.role === 'admin' ? 'Admin' : user?.role === 'seller' ? 'Seller' : user?.role

  useEffect(() => {
    const prevTitle = document.title
    document.title =
      mode === 'admin'
        ? 'PahadLink Admin'
        : isAdmin
          ? 'PahadLink Admin · Sellers'
          : 'PahadLink Seller'

    const iconLinks = [
      ...document.querySelectorAll("link[rel='icon']"),
      ...document.querySelectorAll("link[rel='shortcut icon']"),
    ]
    const prev = iconLinks.map((el) => ({
      el,
      href: el.getAttribute('href'),
      type: el.getAttribute('type'),
    }))

    iconLinks.forEach((el) => {
      const isPng = (el.getAttribute('type') || '').includes('png')
      el.setAttribute('href', isPng ? FAVICON_PNG : FAVICON_ICO)
    })

    return () => {
      document.title = prevTitle
      prev.forEach(({ el, href }) => {
        if (href) el.setAttribute('href', href)
      })
    }
  }, [mode, isAdmin])

  useEffect(() => {
    setNavOpen(false)
  }, [mode, location.pathname])

  const onLogout = () => {
    logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  return (
    <div className="admin-app" data-admin-mode={mode}>
      <div className={`admin-shell${navOpen ? ' is-nav-open' : ''}`}>
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-topbar__menu"
            aria-expanded={navOpen}
            aria-controls="admin-nav"
            onClick={() => setNavOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
            <span className="visually-hidden">Menu</span>
          </button>
          <div className="admin-topbar__brand">
            <img src={logo} alt="" className="admin-topbar__logo" />
            <div>
              <strong>PahadLink</strong>
              <em>{portalLabel}</em>
            </div>
          </div>
          <span className="admin-topbar__role">{roleLabel}</span>
        </header>

        {navOpen && (
          <button
            type="button"
            className="admin-nav-backdrop"
            aria-label="Close menu"
            onClick={() => setNavOpen(false)}
          />
        )}

        <aside className="admin-nav" id="admin-nav" aria-label="Admin navigation">
          <div className="admin-nav__brand">
            <img src={logo} alt="PahadLink" className="admin-nav__logo" />
            <span className="admin-nav__portal">{portalLabel}</span>
          </div>

          <p className="admin-nav__section">Workspace</p>
          <nav className="admin-nav__links">
            {isAdmin && (
            <NavLink
              to={ROUTES.ADMIN}
              className={({ isActive }) =>
                `admin-nav__link${isActive ? ' is-active' : ''}`
              }
              end
              onClick={() => setNavOpen(false)}
            >
              <span className="admin-nav__ico" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                  <path
                    d="M4 19V9l4 3 4-7 4 5 4-3v12H4Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4 19h16"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              Dashboard
            </NavLink>
            )}
            {isAdmin && (
              <NavLink
                to={ROUTES.ADMIN_ORDERS}
                className={({ isActive }) =>
                  `admin-nav__link${isActive ? ' is-active' : ''}`
                }
                onClick={() => setNavOpen(false)}
              >
                <span className="admin-nav__ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                    <path
                      d="M7 4h10l1 3H6l1-3Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M6 7h12v11.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 18.5V7Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M9 11h6M9 15h4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                Orders
              </NavLink>
            )}
            {isAdmin && (
              <NavLink
                to={ROUTES.ADMIN_LEADS}
                className={({ isActive }) =>
                  `admin-nav__link${isActive ? ' is-active' : ''}`
                }
                onClick={() => setNavOpen(false)}
              >
                <span className="admin-nav__ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                    <path
                      d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="9"
                      cy="7"
                      r="3.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M22 21v-2a3.5 3.5 0 0 0-2.5-3.35M16.5 3.7a3.5 3.5 0 0 1 0 6.6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                Leads
              </NavLink>
            )}
            <NavLink
              to={ROUTES.SELLER}
              className={({ isActive }) =>
                `admin-nav__link${isActive ? ' is-active' : ''}`
              }
              onClick={() => setNavOpen(false)}
            >
              <span className="admin-nav__ico" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                  <path
                    d="M4 7h16l-1.2 12.2a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.8L4 7Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path
                    d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                </svg>
              </span>
              Sellers
            </NavLink>
          </nav>

          <div className="admin-nav__foot">
            <div className="admin-nav__user">
              <span className="admin-nav__avatar" aria-hidden="true">
                {initialsFrom(user?.name, user?.email || user?.username)}
              </span>
              <div className="admin-nav__user-text">
                <strong>{user?.name || user?.username || mode}</strong>
                <span>{roleLabel}</span>
                <em>{user?.email || 'Signed in'}</em>
              </div>
            </div>
            {mode === 'seller' && isAdmin && (
              <Link
                to={ROUTES.ADMIN}
                className="admin-nav__ghost"
                onClick={() => setNavOpen(false)}
              >
                Admin dashboard
              </Link>
            )}
            <button type="button" className="admin-nav__ghost admin-nav__ghost--danger" onClick={onLogout}>
              Log out
            </button>
          </div>
        </aside>

        <div className="admin-main">{children}</div>
      </div>
    </div>
  )
}
