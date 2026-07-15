/**
 * All app routes in one place.
 * Pages load on demand via React.lazy.
 */
import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../components/auth'
import PageLoader from '../components/layout/PageLoader'

const Home = lazy(() => import('../pages/Home'))
const Login = lazy(() => import('../pages/auth/Login'))
const Register = lazy(() => import('../pages/auth/Register'))
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'))
const Shop = lazy(() => import('../pages/shop/Shop'))
const CategoryPage = lazy(() => import('../pages/shop/Category'))
const ProductDetail = lazy(() => import('../pages/shop/ProductDetail'))
const Cart = lazy(() => import('../pages/shop/Cart'))
const Checkout = lazy(() => import('../pages/shop/Checkout'))
const WishlistPage = lazy(() =>
  import('../pages/shop/ShopPages').then((m) => ({ default: m.WishlistPage }))
)
const AccountPage = lazy(() =>
  import('../pages/account/AccountPages').then((m) => ({ default: m.AccountPage }))
)
const OrdersPage = lazy(() =>
  import('../pages/account/AccountPages').then((m) => ({ default: m.OrdersPage }))
)
const Contact = lazy(() => import('../pages/Contact'))
const PrivacyPage = lazy(() =>
  import('../pages/legal/LegalPage').then((m) => ({ default: m.PrivacyPage }))
)
const TermsPage = lazy(() =>
  import('../pages/legal/LegalPage').then((m) => ({ default: m.TermsPage }))
)
const RefundsPage = lazy(() =>
  import('../pages/legal/LegalPage').then((m) => ({ default: m.RefundsPage }))
)
export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/category/:id" element={<CategoryPage />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/bag" element={<Cart />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/refunds" element={<RefundsPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </Suspense>
  )
}
