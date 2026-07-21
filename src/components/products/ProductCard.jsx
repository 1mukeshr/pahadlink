import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { StarRating, HeartIcon, CheckCircleIcon } from '../icons'
import { useShop } from '../../context/ShopContext'
import { productPath, MAX_QTY_PER_ITEM_PER_CUSTOMER } from '../../config'
import {
  getProductVariants,
  getStockStatus,
  getVariantBySize,
  isProductInStock,
} from '../../data/siteData'

const formatPrice = (n) => `₹${n.toLocaleString('en-IN')}`

const discountPct = (price, compareAt) =>
  compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0

/**
 * Clean product card - discount, rating, sizes, wishlist, add to bag
 */
const ProductCard = ({ product, preferredSize }) => {
  const { stockTick, addToCart, toggleWishlist, isInWishlist, getCartQtyForVariant, getCartQtyForProduct } =
    useShop()
  const variants = useMemo(
    () => getProductVariants(product),
    // stockTick refreshes live inventory overlay
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [product, stockTick]
  )
  const inStockVariants = useMemo(
    () => variants.filter((v) => v.stock > 0),
    [variants]
  )
  const productAvailable = isProductInStock(product)

  const defaultSize =
    (preferredSize && inStockVariants.some((v) => v.size === preferredSize)
      ? preferredSize
      : null) ||
    inStockVariants[0]?.size ||
    variants[0]?.size ||
    product.sizes?.[0]

  const [size, setSize] = useState(defaultSize)
  const [qty, setQty] = useState(1)
  const [justAdded, setJustAdded] = useState(false)
  const addedTimer = useRef(null)

  const selected = getVariantBySize(product, size)
  const stockInfo = getStockStatus(product, selected.size)
  const inCartQty = getCartQtyForVariant?.(product.id, selected.size) || 0
  const inCartProduct = getCartQtyForProduct?.(product.id) || 0
  const customerRoom = Math.max(0, MAX_QTY_PER_ITEM_PER_CUSTOMER - inCartProduct)
  const stockRoom = Math.max(0, stockInfo.stock - inCartQty)
  const maxQty = Math.min(customerRoom, stockRoom)
  const canAdd = stockInfo.inStock && maxQty > 0
  const atCustomerLimit = customerRoom <= 0
  const off = discountPct(selected.price, selected.compareAt)
  const wished = isInWishlist(product.id)
  const href = productPath(product.id)

  useEffect(() => {
    setSize(defaultSize)
    setQty(1)
    setJustAdded(false)
  }, [product.id, defaultSize])

  useEffect(() => {
    setQty((q) => Math.min(Math.max(1, q), Math.max(1, maxQty || 1)))
  }, [maxQty, size])

  useEffect(
    () => () => {
      if (addedTimer.current) clearTimeout(addedTimer.current)
    },
    []
  )

  const handleAddToCart = () => {
    if (!canAdd) return
    const addQty = Math.min(qty, maxQty)
    const ok = addToCart(product, {
      size: selected.size,
      qty: addQty,
      price: selected.price,
    })
    if (ok === false) return
    setJustAdded(true)
    if (addedTimer.current) clearTimeout(addedTimer.current)
    addedTimer.current = setTimeout(() => setJustAdded(false), 1600)
  }

  return (
    <article
      className={`product-card${!productAvailable ? ' is-oos' : ''}${
        stockInfo.lowStock ? ' is-low-stock' : ''
      }`}
    >
      <div className="product-card__media">
        <Link to={href} className="product-card__media-link">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            decoding="async"
          />
          <span className="product-card__quick">View product</span>
        </Link>
        {!productAvailable ? (
          <span className="product-card__stock product-card__stock--oos">
            Out of stock
          </span>
        ) : stockInfo.lowStock ? (
          <span className="product-card__stock product-card__stock--low">
            {stockInfo.label}
          </span>
        ) : null}
        <button
          type="button"
          className={`product-card__wish${wished ? ' is-active' : ''}`}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wished}
          onClick={() => toggleWishlist(product)}
        >
          <HeartIcon size={16} />
        </button>
      </div>

      <div className="product-card__body">
        {product.rating != null && (
          <div className="product-card__rating">
            <StarRating rating={Math.round(product.rating)} />
            <span>{product.rating.toFixed(1)}</span>
          </div>
        )}

        <h3 className="product-card__title">
          <Link to={href}>{product.name}</Link>
        </h3>

        <div className="product-card__price-row">
          <div className="product-card__price-group">
            <span className="product-card__price">
              {formatPrice(selected.price)}
            </span>
            {selected.compareAt > selected.price && (
              <span className="product-card__compare">
                {formatPrice(selected.compareAt)}
              </span>
            )}
          </div>
          {off > 0 && (
            <span className="product-card__badge">-{off}%</span>
          )}
        </div>
        {selected.compareAt > selected.price && (
          <p className="product-card__save">
            Save {formatPrice(selected.compareAt - selected.price)}
          </p>
        )}

        <div className="product-card__options">
          <span className="product-card__select-wrap">
            <select
              className="product-card__select"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              aria-label="Select option"
              disabled={!productAvailable}
            >
              {variants.map((v) => (
                <option key={v.size} value={v.size} disabled={v.stock <= 0}>
                  {v.size}
                  {v.stock <= 0 ? ' — Out of stock' : ''}
                </option>
              ))}
            </select>
          </span>

          <div className="product-card__qty">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={!canAdd}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              −
            </button>
            <span>{qty}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={!canAdd || qty >= maxQty}
              onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            >
              +
            </button>
          </div>
        </div>

        <div className="product-card__actions">
          <button
            type="button"
            className={`product-card__bag${justAdded ? ' is-added' : ''}${
              !canAdd ? ' is-disabled' : ''
            }`}
            onClick={handleAddToCart}
            disabled={!canAdd}
            aria-live="polite"
          >
            {justAdded ? (
              <>
                <CheckCircleIcon size={15} />
                Added
              </>
            ) : !stockInfo.inStock ? (
              'Out of stock'
            ) : atCustomerLimit ? (
              `Max ${MAX_QTY_PER_ITEM_PER_CUSTOMER} of this product`
            ) : maxQty <= 0 ? (
              'Max in bag'
            ) : (
              'Add to bag'
            )}
          </button>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
