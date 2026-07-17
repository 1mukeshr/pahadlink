import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { STORAGE } from '../config'
import { getProductMinPrice, getVariantBySize } from '../data/siteData'

const ShopContext = createContext(null)

const readStore = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

export function ShopProvider({ children }) {
  const [cart, setCart] = useState(() => readStore(STORAGE.CART, []))
  const [wishlist, setWishlist] = useState(() => readStore(STORAGE.WISHLIST, []))
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE.CART, JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    localStorage.setItem(STORAGE.WISHLIST, JSON.stringify(wishlist))
  }, [wishlist])

  useEffect(() => {
    if (!cartOpen) return undefined

    const body = document.body
    const prevOverflow = body.style.overflow

    // Keep page width stable - html already uses scrollbar-gutter: stable
    body.style.overflow = 'hidden'

    const onKey = (e) => {
      if (e.key === 'Escape') setCartOpen(false)
    }
    document.addEventListener('keydown', onKey)

    return () => {
      body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
    }
  }, [cartOpen])

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + (item.qty || 1), 0),
    [cart],
  )

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * (item.qty || 1), 0),
    [cart],
  )

  const wishlistCount = wishlist.length

  const openCart = useCallback(() => setCartOpen(true), [])
  const closeCart = useCallback(() => setCartOpen(false), [])
  const toggleCart = useCallback(() => setCartOpen((o) => !o), [])

  const addToCart = useCallback(
    (product, { size, qty = 1, open = true, price } = {}) => {
      const variant = getVariantBySize(product, size)
      const unitSize = variant.size
      const unitPrice = price ?? variant.price

      setCart((prev) => {
        const key = `${product.id}::${unitSize}`
        const existing = prev.find((item) => item.key === key)
        if (existing) {
          return prev.map((item) =>
            item.key === key
              ? { ...item, qty: item.qty + qty, price: unitPrice }
              : item,
          )
        }
        return [
          ...prev,
          {
            key,
            id: product.id,
            name: product.name,
            image: product.image,
            price: unitPrice,
            size: unitSize,
            qty,
          },
        ]
      })
      if (open) setCartOpen(true)
    },
    [],
  )

  const updateCartQty = useCallback((key, qty) => {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((item) => item.key !== key)
      return prev.map((item) => (item.key === key ? { ...item, qty } : item))
    })
  }, [])

  const removeFromCart = useCallback((key) => {
    setCart((prev) => prev.filter((item) => item.key !== key))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  const toggleWishlist = useCallback((product) => {
    setWishlist((prev) => {
      const exists = prev.some((item) => item.id === product.id)
      if (exists) return prev.filter((item) => item.id !== product.id)
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          image: product.image,
          price: getProductMinPrice(product),
        },
      ]
    })
  }, [])

  const isInWishlist = useCallback(
    (productId) => wishlist.some((item) => item.id === productId),
    [wishlist],
  )

  const value = useMemo(
    () => ({
      cart,
      wishlist,
      cartCount,
      cartTotal,
      wishlistCount,
      cartOpen,
      openCart,
      closeCart,
      toggleCart,
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
      toggleWishlist,
      isInWishlist,
    }),
    [
      cart,
      wishlist,
      cartCount,
      cartTotal,
      wishlistCount,
      cartOpen,
      openCart,
      closeCart,
      toggleCart,
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
      toggleWishlist,
      isInWishlist,
    ],
  )

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop() {
  const ctx = useContext(ShopContext)
  if (!ctx) throw new Error('useShop must be used within ShopProvider')
  return ctx
}
