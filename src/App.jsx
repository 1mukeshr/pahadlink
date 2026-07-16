/**
 * App shell - keep thin.
 * Routes: src/routes/AppRoutes.jsx
 * Config: src/config/index.js
 *
 * HashRouter works reliably on GitHub project Pages
 * (https://1mukeshr.github.io/pahadlink/#/...).
 */
import { HashRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ShopProvider } from './context/ShopContext'
import {
  Header,
  CartDrawer,
  MobileBottomNav,
  ScrollToTop,
} from './components/layout'
import SupportChat from './components/support/SupportChat'
import AppRoutes from './routes/AppRoutes'

function App() {
  return (
    <AuthProvider>
      <ShopProvider>
        <HashRouter>
          <ScrollToTop />
          <Header />
          <AppRoutes />
          <CartDrawer />
          <MobileBottomNav />
          <SupportChat />
        </HashRouter>
      </ShopProvider>
    </AuthProvider>
  )
}

export default App
