/**
 * App shell - keep thin.
 * Routes: src/routes/AppRoutes.jsx
 * Config: src/config/index.js
 *
 * HashRouter works reliably on GitHub project Pages
 * (https://1mukeshr.github.io/pahadlink/#/...).
 *
 * Admin/seller console lives in src/admin/ with its own CSS/layout —
 * storefront chrome is hidden on those routes.
 */
import { HashRouter, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ShopProvider } from './context/ShopContext'
import {
  Header,
  CartDrawer,
  MobileBottomNav,
  ScrollToTop,
  RouteProgress,
} from './components/layout'
import SupportChat from './components/support/SupportChat'
import ThemePicker from './components/theme/ThemePicker'
import AppRoutes from './routes/AppRoutes'

function isAdminPlatformPath(pathname) {
  return (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/seller' ||
    pathname.startsWith('/seller/')
  )
}

function StorefrontChrome({ children }) {
  const { pathname } = useLocation()
  const adminPlatform = isAdminPlatformPath(pathname)

  if (adminPlatform) {
    return children
  }

  return (
    <>
      <Header />
      {children}
      <CartDrawer />
      <MobileBottomNav />
      <ThemePicker />
      <SupportChat />
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <ShopProvider>
        <HashRouter>
          <ScrollToTop />
          <RouteProgress />
          <StorefrontChrome>
            <AppRoutes />
          </StorefrontChrome>
        </HashRouter>
      </ShopProvider>
    </AuthProvider>
  )
}

export default App
