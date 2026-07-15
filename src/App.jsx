/**
 * App shell - keep thin.
 * Routes: src/routes/AppRoutes.jsx
 * Config: src/config/index.js
 */
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ShopProvider } from './context/ShopContext'
import { Header, CartDrawer, MobileBottomNav } from './components/layout'
import SupportChat from './components/support/SupportChat'
import AppRoutes from './routes/AppRoutes'

function App() {
  return (
    <AuthProvider>
      <ShopProvider>
        <BrowserRouter>
          <Header />
          <AppRoutes />
          <CartDrawer />
          <MobileBottomNav />
          <SupportChat />
        </BrowserRouter>
      </ShopProvider>
    </AuthProvider>
  )
}

export default App
