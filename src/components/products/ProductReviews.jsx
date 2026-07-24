import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircleIcon, StarPicker, StarRating } from '../icons'
import { useAuth } from '../../context/AuthContext'
import { ROUTES } from '../../config'
import { fetchProductReviews, submitProductReview } from '../../services/reviewService'

const formatDate = (value) => {
  if (!value) return ''
  try {
    return new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

/**
 * PahadLink compact ratings & reviews.
 */
const ProductReviews = ({ product, onSummaryChange }) => {
  const { user, isAuthenticated } = useAuth()
  const [reviews, setReviews] = useState([])
  const [summary, setSummary] = useState({
    average: product?.rating || 0,
    count: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  })
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [guestName, setGuestName] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [visibleCount, setVisibleCount] = useState(4)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setMessage('')
    setError('')
    setVisibleCount(4)

    fetchProductReviews(product.id)
      .then((data) => {
        if (!alive) return
        setReviews(data.reviews)
        setSummary(data.summary)
        onSummaryChange?.(data.summary)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [product.id])

  const bars = useMemo(() => {
    const total = summary.count || 1
    return [5, 4, 3, 2, 1].map((star) => {
      const count = summary.distribution?.[star] || 0
      return {
        star,
        count,
        pct: Math.round((count / total) * 100),
      }
    })
  }, [summary])

  const visibleReviews = reviews.slice(0, visibleCount)

  const onSubmit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')

    try {
      const data = await submitProductReview({
        productId: product.id,
        productName: product.name,
        rating,
        comment,
        userName: isAuthenticated ? user?.name : guestName,
        userLocation: '',
      })
      setReviews(data.reviews)
      setSummary(data.summary)
      onSummaryChange?.(data.summary)
      setComment('')
      setMessage(data.message || 'Thanks for your review!')
    } catch (err) {
      setError(err.message || 'Could not save review')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      className="product-reviews"
      id="product-reviews"
      aria-labelledby="product-reviews-title"
    >
      <div className="container">
        <div className="product-reviews__panel">
          <header className="product-reviews__head">
            <h2 id="product-reviews-title">Ratings & Reviews</h2>
          </header>

          <div className="product-reviews__top">
            <div className="product-reviews__overview">
              <div className="product-reviews__score-block" aria-live="polite">
                <div className="product-reviews__score-row">
                  <strong>{(summary.average || 0).toFixed(1)}</strong>
                  <span className="product-reviews__score-star" aria-hidden="true">
                    ★
                  </span>
                </div>
                <StarRating rating={summary.average || 0} size={14} />
                <p className="product-reviews__count">
                  {loading
                    ? 'Loading…'
                    : `${summary.count} Ratings & ${summary.count} Reviews`}
                </p>
              </div>

              <ul className="product-reviews__bars" aria-label="Rating breakdown">
                {bars.map((row) => (
                  <li key={row.star}>
                    <span>
                      {row.star} ★
                    </span>
                    <div className="product-reviews__bar" role="presentation">
                      <i style={{ width: `${row.pct}%` }} />
                    </div>
                    <em>{row.count}</em>
                  </li>
                ))}
              </ul>
            </div>

            <form className="product-reviews__form" onSubmit={onSubmit}>
              <div className="product-reviews__form-row">
                <span className="product-reviews__form-label">Rate this product</span>
                <StarPicker
                  value={rating}
                  onChange={setRating}
                  disabled={busy}
                  size={22}
                />
                <span className="product-reviews__picked">{rating}/5</span>
              </div>

              {!isAuthenticated && (
                <input
                  type="text"
                  className="product-reviews__input"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Your name"
                  maxLength={80}
                  required
                />
              )}

              <textarea
                className="product-reviews__input"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe your experience (optional details help others)"
                rows={2}
                maxLength={500}
                required
                minLength={8}
              />

              {error && (
                <p className="product-reviews__error" role="alert">
                  {error}
                </p>
              )}
              {message && (
                <p className="product-reviews__success" role="status">
                  {message}
                </p>
              )}

              <div className="product-reviews__form-actions">
                <button
                  type="submit"
                  className="product-reviews__submit"
                  disabled={busy || !rating}
                >
                  {busy ? 'Submitting…' : 'Submit'}
                </button>
                {!isAuthenticated && (
                  <Link to={ROUTES.LOGIN} className="product-reviews__login">
                    Login
                  </Link>
                )}
              </div>
            </form>
          </div>

          <div className="product-reviews__list">
            {reviews.length === 0 && !loading ? (
              <p className="product-reviews__empty">
                No reviews yet. Be the first to rate this product.
              </p>
            ) : (
              <ul>
                {visibleReviews.map((review) => (
                  <li key={review.id} className="product-reviews__item">
                    <div className="product-reviews__item-head">
                      <span
                        className={`product-reviews__badge product-reviews__badge--${
                          review.rating >= 4
                            ? 'good'
                            : review.rating >= 3
                              ? 'ok'
                              : 'low'
                        }`}
                      >
                        {review.rating} ★
                      </span>
                      <p className="product-reviews__title">
                        {review.comment || `Rated ${review.rating} out of 5`}
                      </p>
                    </div>

                    <div className="product-reviews__meta">
                      {review.verified ? (
                        <span className="product-reviews__certified">
                          <CheckCircleIcon size={12} />
                          Certified Buyer
                        </span>
                      ) : (
                        <span className="product-reviews__buyer">Buyer</span>
                      )}
                      <span className="product-reviews__sep">·</span>
                      <span>{review.userName || 'Shopper'}</span>
                      {formatDate(review.createdAt) ? (
                        <>
                          <span className="product-reviews__sep">·</span>
                          <span>{formatDate(review.createdAt)}</span>
                        </>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {reviews.length > visibleCount && (
              <button
                type="button"
                className="product-reviews__more"
                onClick={() => setVisibleCount((n) => n + 6)}
              >
                All {reviews.length} reviews ▾
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProductReviews
