import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import Breadcrumb from '../../components/layout/Breadcrumb'
import Footer from '../../components/layout/Footer'
import ProductCard from '../../components/products/ProductCard'
import ProductReviews from '../../components/products/ProductReviews'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  HeartIcon,
  ShieldIcon,
  StarRating,
  TruckIcon,
} from '../../components/icons'
import { ROUTES, categoryPath, MAX_QTY_PER_ITEM_PER_CUSTOMER } from '../../config'
import {
  getProductById,
  getProductVariants,
  getRelatedProducts,
  getStockStatus,
  getVariantBySize,
} from '../../data/siteData'
import { useAuth } from '../../context/AuthContext'
import { useShop } from '../../context/ShopContext'
import {
  hasCompleteShippingAddress,
  requestOpenAddressPicker,
} from '../../utils/locationStorage'
import { fetchProductReviews } from '../../services/reviewService'

const RELATED_VISIBLE = 5

const formatPrice = (n) => `₹${n.toLocaleString('en-IN')}`

const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const product = useMemo(() => getProductById(id), [id])
  const related = useMemo(
    () => (product ? getRelatedProducts(product, 10) : []),
    [product]
  )

  const {
    addToCart,
    toggleWishlist,
    isInWishlist,
    getCartQtyForVariant,
    getCartQtyForProduct,
  } = useShop()
  const [activeImage, setActiveImage] = useState(0)
  const [size, setSize] = useState('')
  const [qty, setQty] = useState(1)
  const [justAdded, setJustAdded] = useState(false)
  const [tab, setTab] = useState('description')
  const [canSlideLeft, setCanSlideLeft] = useState(false)
  const [canSlideRight, setCanSlideRight] = useState(false)
  const [zoom, setZoom] = useState({ active: false, x: 50, y: 50 })
  const [liveRating, setLiveRating] = useState({
    average: product?.rating || 0,
    count: 0,
  })
  const addedTimer = useRef(null)
  const relatedTrackRef = useRef(null)
  const zoomFrame = useRef(0)

  const getZoomPoint = (event, media) => {
    const rect = media.getBoundingClientRect()
    if (!rect.width || !rect.height) return null

    const point = 'touches' in event && event.touches[0]
      ? event.touches[0]
      : event
    if (!point || point.clientX == null) return null

    return {
      x: Math.min(
        100,
        Math.max(0, ((point.clientX - rect.left) / rect.width) * 100)
      ),
      y: Math.min(
        100,
        Math.max(0, ((point.clientY - rect.top) / rect.height) * 100)
      ),
    }
  }

  const canHoverZoom = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches

  const handleMediaZoomMove = (event) => {
    if (!canHoverZoom()) return
    const point = getZoomPoint(event, event.currentTarget)
    if (!point) return

    cancelAnimationFrame(zoomFrame.current)
    zoomFrame.current = requestAnimationFrame(() => {
      setZoom({ active: true, x: point.x, y: point.y })
    })
  }

  const handleMediaZoomLeave = () => {
    if (!canHoverZoom()) return
    cancelAnimationFrame(zoomFrame.current)
    setZoom((prev) => ({ ...prev, active: false }))
  }

  const handleMediaZoomTap = (event) => {
    if (canHoverZoom()) return
    const point = getZoomPoint(event, event.currentTarget)
    if (!point) return

    setZoom((prev) =>
      prev.active
        ? { active: false, x: 50, y: 50 }
        : { active: true, x: point.x, y: point.y }
    )
  }

  const handleMediaTouchMove = (event) => {
    if (canHoverZoom() || !zoom.active || !event.touches?.[0]) return
    const point = getZoomPoint(event, event.currentTarget)
    if (!point) return

    cancelAnimationFrame(zoomFrame.current)
    zoomFrame.current = requestAnimationFrame(() => {
      setZoom({ active: true, x: point.x, y: point.y })
    })
  }

  const updateRelatedScroll = useCallback(() => {
    const track = relatedTrackRef.current
    if (!track) return
    const { scrollLeft, scrollWidth, clientWidth } = track
    setCanSlideLeft(scrollLeft > 8)
    setCanSlideRight(scrollLeft + clientWidth < scrollWidth - 8)
  }, [])

  const scrollRelated = (direction) => {
    const track = relatedTrackRef.current
    if (!track) return
    const slide = track.querySelector('.product-detail-related__slide')
    const gap = 14
    const step = slide
      ? slide.getBoundingClientRect().width + gap
      : track.clientWidth / RELATED_VISIBLE
    track.scrollBy({
      left: direction === 'next' ? step : -step,
      behavior: 'smooth',
    })
  }

  const scrollToReviews = (event) => {
    event?.preventDefault?.()
    const target = document.getElementById('product-reviews')
    if (!target) return

    const header = document.querySelector('.site-header')
    const offset = (header?.getBoundingClientRect?.().height || 72) + 12
    const top = target.getBoundingClientRect().top + window.scrollY - offset

    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    window.history.replaceState(null, '', '#product-reviews')
  }

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [id])

  useEffect(() => {
    if (window.location.hash !== '#product-reviews') return undefined
    const timer = window.setTimeout(() => scrollToReviews(), 120)
    return () => window.clearTimeout(timer)
  }, [product?.id])

  useEffect(() => {
    if (!product?.id) return undefined
    let alive = true
    setLiveRating({ average: product.rating || 0, count: 0 })
    fetchProductReviews(product.id).then((data) => {
      if (!alive) return
      setLiveRating({
        average: data.summary.average || product.rating || 0,
        count: data.summary.count || 0,
      })
    })
    return () => {
      alive = false
    }
  }, [product?.id, product?.rating])

  useEffect(() => {
    if (!product) return
    const variants = getProductVariants(product)
    const firstInStock =
      variants.find((v) => v.stock > 0)?.size ||
      variants[0]?.size ||
      product.sizes?.[0]
    setSize(firstInStock || '')
    setQty(1)
    setActiveImage(0)
    setJustAdded(false)
    setTab('description')
    setZoom({ active: false, x: 50, y: 50 })
  }, [product])

  useEffect(() => {
    setZoom({ active: false, x: 50, y: 50 })
  }, [activeImage])

  useEffect(
    () => () => {
      cancelAnimationFrame(zoomFrame.current)
    },
    []
  )

  useEffect(() => {
    const track = relatedTrackRef.current
    if (!track || !related.length) return undefined

    updateRelatedScroll()
    track.addEventListener('scroll', updateRelatedScroll, { passive: true })
    window.addEventListener('resize', updateRelatedScroll)

    return () => {
      track.removeEventListener('scroll', updateRelatedScroll)
      window.removeEventListener('resize', updateRelatedScroll)
    }
  }, [related, updateRelatedScroll])

  useEffect(
    () => () => {
      if (addedTimer.current) clearTimeout(addedTimer.current)
    },
    []
  )

  const selectedSize = size || product?.sizes?.[0]
  const previewStock =
    product && selectedSize
      ? getStockStatus(product, selectedSize)
      : { stock: 0, inStock: false }
  const previewInCart =
    product && selectedSize
      ? getCartQtyForVariant?.(product.id, selectedSize) || 0
      : 0
  const previewInProduct =
    product ? getCartQtyForProduct?.(product.id) || 0 : 0
  const previewCustomerRoom = Math.max(
    0,
    MAX_QTY_PER_ITEM_PER_CUSTOMER - previewInProduct
  )
  const previewMaxQty = Math.min(
    previewCustomerRoom,
    Math.max(0, previewStock.stock - previewInCart)
  )

  useEffect(() => {
    setQty((q) => Math.min(Math.max(1, q), Math.max(1, previewMaxQty || 1)))
  }, [previewMaxQty, selectedSize])

  if (!product) {
    return <Navigate to={ROUTES.SHOP} replace />
  }

  const variants = getProductVariants(product)
  const selected = getVariantBySize(product, size)
  const stockInfo = getStockStatus(product, selected.size)
  const inCartQty = getCartQtyForVariant?.(product.id, selected.size) || 0
  const inCartProduct = getCartQtyForProduct?.(product.id) || 0
  const customerRoom = Math.max(0, MAX_QTY_PER_ITEM_PER_CUSTOMER - inCartProduct)
  const maxQty = Math.min(
    customerRoom,
    Math.max(0, stockInfo.stock - inCartQty)
  )
  const canAdd = stockInfo.inStock && maxQty > 0
  const atCustomerLimit = customerRoom <= 0
  const off =
    selected.compareAt > selected.price
      ? Math.round(
          ((selected.compareAt - selected.price) / selected.compareAt) * 100
        )
      : 0
  const wished = isInWishlist(product.id)

  const handleAdd = (openCart = true) => {
    if (!canAdd) return
    const addQty = Math.min(qty, maxQty)
    const ok = addToCart(product, {
      size: selected.size,
      qty: addQty,
      price: selected.price,
      open: openCart,
    })
    if (ok === false) return
    setJustAdded(true)
    if (addedTimer.current) clearTimeout(addedTimer.current)
    addedTimer.current = setTimeout(() => setJustAdded(false), 1600)
  }

  const handleBuyNow = () => {
    if (!canAdd) return
    const addQty = Math.min(qty, maxQty)
    const ok = addToCart(product, {
      size: selected.size,
      qty: addQty,
      price: selected.price,
      open: false,
    })
    if (ok === false) return

    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN, {
        state: { from: ROUTES.CHECKOUT, intent: 'checkout' },
      })
      return
    }
    if (!hasCompleteShippingAddress()) {
      navigate(ROUTES.HOME)
      requestOpenAddressPicker({
        message:
          'Add your current location and delivery address, then continue to checkout.',
        resumeCheckout: true,
      })
      return
    }
    navigate(ROUTES.CHECKOUT)
  }

  const breadcrumbItems = [
    { label: 'Shop', to: ROUTES.SHOP },
    {
      label: product.categoryName,
      to: categoryPath(product.categoryId),
    },
    { label: product.name.split('|')[0].trim() },
  ]

  return (
    <>
      <main className="product-detail-page">
        <div className="breadcrumb-bar">
          <div className="container">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        </div>

        <section className="product-detail">
          <div className="container product-detail__grid">
            <div className="product-detail__gallery">
              <div className="product-detail__thumbs" aria-label="Product images">
                {product.images.map((src, index) => (
                  <button
                    key={`${src}-${index}`}
                    type="button"
                    className={`product-detail__thumb${
                      activeImage === index ? ' is-active' : ''
                    }`}
                    onClick={() => setActiveImage(index)}
                    aria-label={`View image ${index + 1}`}
                  >
                    <img
                      src={src}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                ))}
              </div>
              <div
                className={`product-detail__main-media${
                  zoom.active ? ' is-zooming' : ''
                }${!stockInfo.inStock ? ' is-oos' : ''}`}
                onMouseEnter={handleMediaZoomMove}
                onMouseMove={handleMediaZoomMove}
                onMouseLeave={handleMediaZoomLeave}
                onClick={handleMediaZoomTap}
                onTouchMove={handleMediaTouchMove}
              >
                {off > 0 && (
                  <span className="product-detail__badge">-{off}%</span>
                )}
                {!stockInfo.inStock && (
                  <span className="product-detail__stock-badge product-detail__stock-badge--oos">
                    Out of stock
                  </span>
                )}
                <img
                  src={product.images[activeImage]}
                  alt={product.name}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  style={{
                    transformOrigin: `${zoom.x}% ${zoom.y}%`,
                  }}
                />
                <span className="product-detail__zoom-hint" aria-hidden="true">
                  <span className="product-detail__zoom-hint-hover">
                    Hover to zoom
                  </span>
                  <span className="product-detail__zoom-hint-tap">
                    Tap to zoom
                  </span>
                </span>
              </div>
            </div>

            <div className="product-detail__info">
              <p className="product-detail__category">
                <Link to={categoryPath(product.categoryId)}>
                  {product.categoryName}
                </Link>
                {product.subcategory ? ` · ${product.subcategory}` : ''}
              </p>

              <h1>{product.name}</h1>

              {(liveRating.average > 0 || product.rating != null) && (
                <div className="product-detail__rating">
                  <button
                    type="button"
                    className="product-detail__rating-btn"
                    onClick={scrollToReviews}
                    aria-label="See ratings and reviews"
                  >
                    <StarRating rating={liveRating.average || product.rating} />
                    <strong>
                      {(liveRating.average || product.rating || 0).toFixed(1)}
                    </strong>
                    <span>
                      {liveRating.count > 0
                        ? `${liveRating.count} rating${liveRating.count === 1 ? '' : 's'}`
                        : 'Verified ratings'}
                    </span>
                  </button>
                  <a
                    href="#product-reviews"
                    className="product-detail__rating-link"
                    onClick={scrollToReviews}
                  >
                    See reviews
                  </a>
                </div>
              )}

              <div className="product-detail__price-block">
                <div className="product-detail__price-row">
                  <span className="product-detail__price">
                    {formatPrice(selected.price)}
                  </span>
                  {selected.compareAt > selected.price && (
                    <span className="product-detail__compare">
                      {formatPrice(selected.compareAt)}
                    </span>
                  )}
                  {off > 0 && (
                    <span className="product-detail__off">{off}% off</span>
                  )}
                </div>
                {selected.compareAt > selected.price && (
                  <p className="product-detail__save">
                    You save {formatPrice(selected.compareAt - selected.price)}
                  </p>
                )}
                <p
                  className={`product-detail__availability${
                    !stockInfo.inStock
                      ? ' is-oos'
                      : stockInfo.lowStock
                        ? ' is-low'
                        : ''
                  }`}
                >
                  {stockInfo.label}
                </p>
              </div>

              <div className="product-detail__field">
                <div className="product-detail__sizes" role="list" aria-label="Options">
                  {variants.map((option) => {
                    const optionOff =
                      option.compareAt > option.price
                        ? Math.round(
                            ((option.compareAt - option.price) /
                              option.compareAt) *
                              100
                          )
                        : 0
                    const optionSave =
                      option.compareAt > option.price
                        ? option.compareAt - option.price
                        : 0
                    const optionOos = (option.stock ?? 0) <= 0

                    return (
                      <button
                        key={option.size}
                        type="button"
                        role="listitem"
                        className={`product-detail__size${
                          size === option.size ? ' is-active' : ''
                        }${optionOos ? ' is-oos' : ''}`}
                        onClick={() => setSize(option.size)}
                        disabled={optionOos}
                        aria-disabled={optionOos}
                      >
                        <span className="product-detail__size-name">
                          {option.size}
                        </span>
                        <span className="product-detail__size-price">
                          {optionOos ? 'Out of stock' : formatPrice(option.price)}
                        </span>
                        {!optionOos && optionOff > 0 && (
                          <span className="product-detail__size-meta">
                            <span className="product-detail__size-off">
                              {optionOff}% off
                            </span>
                            <span className="product-detail__size-save">
                              Save {formatPrice(optionSave)}
                            </span>
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="product-detail__field">
                <span className="product-detail__label">Quantity</span>
                <div className="product-detail__qty">
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

              <div className="product-detail__actions">
                <button
                  type="button"
                  className={`product-detail__bag${justAdded ? ' is-added' : ''}`}
                  onClick={() => handleAdd(true)}
                  disabled={!canAdd}
                >
                  {justAdded ? (
                    <>
                      <CheckCircleIcon size={16} />
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
                <button
                  type="button"
                  className="product-detail__buy"
                  onClick={handleBuyNow}
                  disabled={!canAdd}
                >
                  Buy now
                </button>
                <button
                  type="button"
                  className={`product-detail__wish${wished ? ' is-active' : ''}`}
                  aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
                  aria-pressed={wished}
                  onClick={() => toggleWishlist(product)}
                >
                  <HeartIcon size={18} />
                </button>
              </div>

              <ul className="product-detail__trust">
                <li>
                  <TruckIcon size={16} />
                  Free delivery on first order · later from ₹39
                </li>
                <li>
                  <ShieldIcon size={16} />
                  Secure checkout
                </li>
                <li>
                  <CheckCircleIcon size={16} />
                  Easy returns in 7 days
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="product-detail-tabs">
          <div className="container">
            <div className="product-detail-tabs__panel-wrap">
              <div
                className="product-detail-tabs__nav"
                role="tablist"
                aria-label="Product information"
              >
                {[
                  { id: 'description', label: 'Description' },
                  { id: 'details', label: 'Specifications' },
                  { id: 'highlights', label: 'Highlights' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    id={`product-tab-${item.id}`}
                    aria-controls={`product-panel-${item.id}`}
                    aria-selected={tab === item.id}
                    tabIndex={tab === item.id ? 0 : -1}
                    className={`product-detail-tabs__tab${
                      tab === item.id ? ' is-active' : ''
                    }`}
                    onClick={() => setTab(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div
                className="product-detail-tabs__panel"
                role="tabpanel"
                id={`product-panel-${tab}`}
                aria-labelledby={`product-tab-${tab}`}
                key={tab}
              >
                {tab === 'description' && (
                  <div className="product-detail-tabs__block">
                    <p className="product-detail-tabs__lead">
                      {product.description}
                    </p>
                  </div>
                )}

                {tab === 'details' && (
                  <div className="product-detail-tabs__block">
                    <dl className="product-detail-spec">
                      {product.details.map((row) => (
                        <div key={row.label} className="product-detail-spec__row">
                          <dt>{row.label}</dt>
                          <dd>{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {tab === 'highlights' && (
                  <div className="product-detail-tabs__block">
                    <ul className="product-detail-highlights">
                      {product.highlights.map((line) => (
                        <li key={line}>
                          <CheckCircleIcon size={15} />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <ProductReviews
          product={product}
          onSummaryChange={(next) =>
            setLiveRating({
              average: next.average || product.rating || 0,
              count: next.count || 0,
            })
          }
        />

        {related.length > 0 && (
          <section className="product-detail-related">
            <div className="container">
              <div className="section-head section-head--row">
                <div>
                  <h2>Related products</h2>
                </div>
                <div className="product-detail-related__head-actions">
                  <div className="product-detail-related__controls">
                    <button
                      type="button"
                      className="product-detail-related__nav"
                      onClick={() => scrollRelated('prev')}
                      disabled={!canSlideLeft}
                      aria-label="Previous related products"
                    >
                      <ArrowLeftIcon size={15} />
                    </button>
                    <button
                      type="button"
                      className="product-detail-related__nav"
                      onClick={() => scrollRelated('next')}
                      disabled={!canSlideRight}
                      aria-label="Next related products"
                    >
                      <ArrowRightIcon size={15} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="product-detail-related__slider">
                {canSlideLeft && (
                  <div
                    className="product-detail-related__fade product-detail-related__fade--left"
                    aria-hidden="true"
                  />
                )}
                {canSlideRight && (
                  <div
                    className="product-detail-related__fade product-detail-related__fade--right"
                    aria-hidden="true"
                  />
                )}
                <div
                  className="product-detail-related__track"
                  ref={relatedTrackRef}
                >
                  {related.map((item) => (
                    <div key={item.id} className="product-detail-related__slide">
                      <ProductCard product={item} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="product-section__footer">
                <Link
                  to={categoryPath(product.categoryId)}
                  className="product-section__see-all"
                >
                  <span>View all {product.categoryName}</span>
                  <ArrowRightIcon size={16} />
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}

export default ProductDetail
