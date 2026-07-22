import { Router } from 'express'
import mongoose from 'mongoose'
import Review, { buildRatingSummary } from '../models/Review.js'
import { optionalProtect } from '../middleware/auth.js'

const router = Router()

function requireMongo(_req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'Reviews unavailable — database disconnected.',
    })
  }
  return next()
}

function normalizeRating(value) {
  const rating = Number(value)
  if (!Number.isFinite(rating)) return null
  const rounded = Math.round(rating)
  if (rounded < 1 || rounded > 5) return null
  return rounded
}

/** Public: recent reviews for home / social proof */
router.get('/recent', requireMongo, async (req, res) => {
  try {
    const limit = Math.min(12, Math.max(1, Number(req.query.limit) || 6))
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .limit(limit)

    const summaryDocs = await Review.find({}, { rating: 1 }).lean()
    const summary = buildRatingSummary(summaryDocs)

    res.json({
      reviews: reviews.map((r) => r.toSafeJSON()),
      summary,
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load reviews' })
  }
})

/** Public: batch rating summaries for product cards */
router.get('/summary', requireMongo, async (req, res) => {
  try {
    const ids = String(req.query.ids || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 60)

    if (!ids.length) {
      return res.json({ summaries: {} })
    }

    const rows = await Review.aggregate([
      { $match: { productId: { $in: ids } } },
      {
        $group: {
          _id: '$productId',
          average: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ])

    const summaries = {}
    for (const row of rows) {
      summaries[row._id] = {
        average: Math.round(row.average * 10) / 10,
        count: row.count,
      }
    }

    res.json({ summaries })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load summaries' })
  }
})

/** Public: reviews for one product */
router.get('/product/:productId', requireMongo, async (req, res) => {
  try {
    const productId = String(req.params.productId || '').trim()
    if (!productId) {
      return res.status(400).json({ message: 'Product id required' })
    }

    const reviews = await Review.find({ productId }).sort({ createdAt: -1 }).limit(100)
    const summary = buildRatingSummary(reviews)

    res.json({
      productId,
      reviews: reviews.map((r) => r.toSafeJSON()),
      summary,
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load reviews' })
  }
})

/** Auth: submit a product review (1–5) */
router.post('/', requireMongo, optionalProtect, async (req, res) => {
  try {
    const productId = String(req.body.productId || '').trim()
    const productName = String(req.body.productName || '').trim().slice(0, 160)
    const comment = String(req.body.comment || '').trim().slice(0, 500)
    const userLocation = String(req.body.userLocation || '').trim().slice(0, 80)
    const rating = normalizeRating(req.body.rating)

    if (!productId) {
      return res.status(400).json({ message: 'Product is required' })
    }
    if (!rating) {
      return res.status(400).json({ message: 'Rating must be 1–5' })
    }
    if (comment && comment.length < 8) {
      return res.status(400).json({
        message: 'Please write a short review (at least 8 characters)',
      })
    }

    const userName =
      String(req.user?.name || req.body.userName || '').trim().slice(0, 80) ||
      'Guest shopper'

    if (!req.user && userName.length < 2) {
      return res.status(400).json({ message: 'Please enter your name' })
    }

    let review

    if (req.user?._id || req.user?.id) {
      const userId = req.user._id || req.user.id
      review = await Review.findOneAndUpdate(
        { productId, user: userId },
        {
          productId,
          productName,
          user: userId,
          userName,
          userLocation,
          rating,
          comment,
          // Never trust client "verified" — only order-linked reviews are verified
          verified: false,
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      )
    } else {
      review = await Review.create({
        productId,
        productName,
        user: null,
        userName,
        userLocation,
        rating,
        comment,
        verified: false,
      })
    }

    const all = await Review.find({ productId }).sort({ createdAt: -1 }).limit(100)
    res.status(201).json({
      message: 'Review saved',
      review: review.toSafeJSON(),
      reviews: all.map((r) => r.toSafeJSON()),
      summary: buildRatingSummary(all),
    })
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'You already reviewed this product' })
    }
    res.status(500).json({ message: error.message || 'Failed to save review' })
  }
})

/** Auth helper used by order review flow */
export async function createReviewsFromOrder(order, { rating, comment }) {
  const score = normalizeRating(rating)
  if (!score || !order) return []

  const userId = order.user || null
  const userName = String(order.customerName || 'Customer').trim().slice(0, 80)
  const items = Array.isArray(order.items) ? order.items : []
  const seen = new Set()
  const created = []

  for (const item of items) {
    const productId = String(item.productId || '').trim()
    if (!productId || seen.has(productId)) continue
    seen.add(productId)

    const payload = {
      productId,
      productName: String(item.name || '').trim().slice(0, 160),
      user: userId,
      userName,
      userLocation: '',
      rating: score,
      comment: String(comment || '').trim().slice(0, 500),
      orderId: order._id,
      verified: true,
    }

    let doc
    if (userId) {
      doc = await Review.findOneAndUpdate(
        { productId, user: userId },
        payload,
        { new: true, upsert: true, setDefaultsOnInsert: true }
      )
    } else {
      doc = await Review.create(payload)
    }
    created.push(doc.toSafeJSON())
  }

  return created
}

export default router
