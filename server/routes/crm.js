import { Router } from 'express'
import CrmLead, { CRM_STATUSES, CRM_SOURCES } from '../models/CrmLead.js'
import User from '../models/User.js'
import Order from '../models/Order.js'
import { protect, authorize } from '../middleware/auth.js'

const router = Router()

router.use(protect, authorize('admin'))

/** CRM dashboard summary */
router.get('/stats', async (_req, res) => {
  try {
    const [leads, customers, byStatus, bySource, recentOrders] = await Promise.all([
      CrmLead.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      CrmLead.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      CrmLead.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]),
      Order.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ])

    const statusMap = Object.fromEntries(byStatus.map((s) => [s._id, s.count]))
    const sourceMap = Object.fromEntries(
      bySource.map((s) => [s._id || 'other', s.count])
    )

    res.json({
      leads,
      customers,
      recentOrders,
      byStatus: {
        new: statusMap.new || 0,
        contacted: statusMap.contacted || 0,
        interested: statusMap.interested || 0,
        converted: statusMap.converted || 0,
        lost: statusMap.lost || 0,
      },
      bySource: {
        website: sourceMap.website || 0,
        phone: sourceMap.phone || 0,
        whatsapp: sourceMap.whatsapp || 0,
        referral: sourceMap.referral || 0,
        social: sourceMap.social || 0,
        other: sourceMap.other || 0,
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load CRM stats' })
  }
})

/** List leads */
router.get('/leads', async (req, res) => {
  try {
    const { status, q } = req.query
    const filter = {}

    if (status && CRM_STATUSES.includes(status)) {
      filter.status = status
    }

    if (q) {
      const text = String(q).trim()
      filter.$or = [
        { name: new RegExp(text, 'i') },
        { email: new RegExp(text, 'i') },
        { phone: new RegExp(text, 'i') },
        { interest: new RegExp(text, 'i') },
      ]
    }

    const leads = await CrmLead.find(filter).sort({ createdAt: -1 }).limit(200)
    res.json({ leads: leads.map((l) => l.toSafeJSON()) })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load leads' })
  }
})

/** Create lead */
router.post('/leads', async (req, res) => {
  try {
    const { name, email, phone, source, status, interest, notes } = req.body

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Name is required' })
    }

    const lead = await CrmLead.create({
      name: String(name).trim(),
      email: String(email || '').trim().toLowerCase(),
      phone: String(phone || '').trim(),
      source: CRM_SOURCES.includes(source) ? source : 'website',
      status: CRM_STATUSES.includes(status) ? status : 'new',
      interest: String(interest || '').trim(),
      notes: String(notes || '').trim(),
      assignedTo: req.user._id,
      lastContactAt: status && status !== 'new' ? new Date() : null,
    })

    res.status(201).json({ lead: lead.toSafeJSON() })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create lead' })
  }
})

/** Update lead */
router.patch('/leads/:id', async (req, res) => {
  try {
    const lead = await CrmLead.findById(req.params.id)
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' })
    }

    const fields = ['name', 'email', 'phone', 'interest', 'notes']
    fields.forEach((key) => {
      if (typeof req.body[key] === 'string') {
        lead[key] = req.body[key].trim()
      }
    })

    if (CRM_SOURCES.includes(req.body.source)) {
      lead.source = req.body.source
    }

    if (CRM_STATUSES.includes(req.body.status)) {
      if (lead.status !== req.body.status) {
        lead.lastContactAt = new Date()
      }
      lead.status = req.body.status
    }

    await lead.save()
    res.json({ message: 'Lead updated', lead: lead.toSafeJSON() })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update lead' })
  }
})

/** Delete lead */
router.delete('/leads/:id', async (req, res) => {
  try {
    const lead = await CrmLead.findByIdAndDelete(req.params.id)
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' })
    }
    res.json({ message: 'Lead deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete lead' })
  }
})

/** Customer list (registered users for CRM) */
router.get('/customers', async (_req, res) => {
  try {
    const customers = await User.find({ role: 'customer' })
      .sort({ createdAt: -1 })
      .limit(200)

    const customerIds = customers.map((c) => c._id)
    const orderCounts = await Order.aggregate([
      { $match: { user: { $in: customerIds } } },
      {
        $group: {
          _id: '$user',
          orders: { $sum: 1 },
          spent: { $sum: '$totalAmount' },
        },
      },
    ])

    const countMap = Object.fromEntries(
      orderCounts.map((row) => [
        row._id.toString(),
        { orders: row.orders, spent: row.spent },
      ])
    )

    res.json({
      customers: customers.map((c) => {
        const stats = countMap[c._id.toString()] || { orders: 0, spent: 0 }
        return {
          ...c.toSafeJSON(),
          orderCount: stats.orders,
          totalSpent: stats.spent,
        }
      }),
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load customers' })
  }
})

export default router
