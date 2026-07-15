import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { StarRating, HeartIcon, CheckCircleIcon } from '../icons'
import { useShop } from '../../context/ShopContext'
import { productPath } from '../../config'
import {
  getProductVariants,
  getVariantBySize,
} from '../../data/siteData'

const formatPrice = (n) => `₹${n.toLocaleString('en-IN')}`

const discountPct = (price, compareAt) =>
  compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0

/**
 * Clean product card - discount, rating, sizes, wishlist, add to bag
 */
const ProductCard = ({ product, preferredSize }) => {
  const variants = useMemo(() => getProductVariants(product), [product])
  const defaultSize =
    (preferredSize && variants.some((v) => v.size === preferredSize)
      ? preferredSize
      : variants[0]?.size) || product.sizes?.[0]

  const [size, setSize] = useState(defaultSize)
  const [qty, setQty] = useState(1)
  const [justAdded, setJustAdded] = useState(false)
  const addedTimer = useRef(null)
  const { addToCart, toggleWishlist, isInWishlist } = useShop()

  const selected = getVariantBySize(product, size)
  const off = discountPct(selected.price, selected.compareAt)
  const wished = isInWishlist(product.id)
  const href = productPath(product.id)

  useEffect(() => {
    setSize(defaultSize)
    setQty(1)
    setJustAdded(false)
  }, [product.id, defaultSize])

  useEffect(
    () => () => {
      if (addedTimer.current) clearTimeout(addedTimer.current)
    },
    []
  )

  const handleAddToCart = () => {
    addToCart(product, {
      size: selected.size,
      qty,
      price: selected.price,
    })
    setJustAdded(true)
    if (addedTimer.current) clearTimeout(addedTimer.current)
    addedTimer.current = setTimeout(() => setJustAdded(false), 1600)
  }

  return (
    <article className="product-card">
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
            >
              {variants.map((v) => (
                <option key={v.size} value={v.size}>
                  {v.size}
                </option>
              ))}
            </select>
          </span>

          <div className="product-card__qty">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              −
            </button>
            <span>{qty}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQty((q) => q + 1)}
            >
              +
            </button>
          </div>
        </div>

        <div className="product-card__actions">
          <button
            type="button"
            className={`product-card__bag${justAdded ? ' is-added' : ''}`}
            onClick={handleAddToCart}
            aria-live="polite"
          >
            {justAdded ? (
              <>
                <CheckCircleIcon size={15} />
                Added
              </>
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
