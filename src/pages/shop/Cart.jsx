import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../config'
import { useShop } from '../../context/ShopContext'

/**
 * /bag and /cart open the right-side bag drawer instead of a full page.
 */
const Cart = () => {
  const navigate = useNavigate()
  const { openCart } = useShop()

  useEffect(() => {
    openCart()
    navigate(ROUTES.SHOP, { replace: true })
  }, [navigate, openCart])

  return null
}

export default Cart
