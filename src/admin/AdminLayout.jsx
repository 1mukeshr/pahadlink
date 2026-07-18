import { useEffect } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '../config'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/images/logo.png'
import './admin.css'

const BASE = import.meta.env.BASE_URL || '/'
const FAVICON_PNG = `${BASE}favicon.png`
const FAVICON_ICO = `${BASE}favicon.ico`

export default function AdminLayout({ children, mode = 'admin' }) {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const prevTitle = document.title
    document.title =
      mode === 'admin' ? 'PahadLink Admin' : 'PahadLink Seller'

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
  }, [mode])

  const onLogout = () => {
    logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  return (
    <div className="admin-app" data-admin-mode={mode}>
      <div className="admin-shell">
        <aside className="admin-nav" aria-label="Admin navigation">
          <Link
            to={ROUTES.HOME}
            className="admin-nav__brand"
            aria-label="PahadLink home"
          >
            <img src={logo} alt="PahadLink" className="admin-nav__logo" />
            <span className="admin-nav__portal">
              {mode === 'admin' ? 'Admin portal' : 'Seller portal'}
            </span>
          </Link>

          <nav className="admin-nav__links">
            {isAdmin && (
              <NavLink
                to={ROUTES.ADMIN}
                className={({ isActive }) =>
                  `admin-nav__link${isActive ? ' is-active' : ''}`
                }
                end
              >
                <span className="admin-nav__ico" aria-hidden="true">
                  ▦
                </span>
                Dashboard
              </NavLink>
            )}
            <NavLink
              to={ROUTES.SELLER}
              className={({ isActive }) =>
                `admin-nav__link${isActive ? ' is-active' : ''}`
              }
            >
              <span className="admin-nav__ico" aria-hidden="true">
                ↗
              </span>
              Fulfilment
            </NavLink>
          </nav>

          <div className="admin-nav__foot">
            <div className="admin-nav__user">
              <strong>{user?.name || user?.username || mode}</strong>
              <span>{user?.role}</span>
              <em>{user?.email || 'Signed in'}</em>
            </div>
            <Link to={ROUTES.HOME} className="admin-nav__ghost">
              Storefront
            </Link>
            <button type="button" className="admin-nav__ghost" onClick={onLogout}>
              Log out
            </button>
          </div>
        </aside>

        <div className="admin-main">{children}</div>
      </div>
    </div>
  )
}
