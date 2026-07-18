import mongoose from 'mongoose'

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'return_requested',
  'returned',
]

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded']

/** Allowed status moves by role */
export const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'shipped', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['return_requested'],
  return_requested: ['returned', 'delivered'],
  returned: [],
  cancelled: [],
}

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, default: '', trim: true },
    name: { type: String, required: true, trim: true },
    size: { type: String, default: '', trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, trim: true, lowercase: true },
    customerPhone: { type: String, default: '', trim: true },
    items: {
      type: [orderItemSchema],
      validate: [(v) => v.length > 0, 'At least one item required'],
    },
    totalAmount: { type: Number, required: true, min: 0 },
    itemsTotal: { type: Number, default: 0, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String, default: '', trim: true, uppercase: true },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'upi', 'card'],
      default: 'cod',
    },
    shippingAddress: {
      line1: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    trackingNumber: { type: String, default: '', trim: true },
    courier: { type: String, default: '', trim: true },
    assignedSeller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    stockDeducted: { type: Boolean, default: false },
    review: {
      rating: { type: Number, min: 1, max: 5, default: null },
      comment: { type: String, default: '', maxlength: 500 },
      createdAt: { type: Date, default: null },
    },
    returnReason: { type: String, default: '', maxlength: 500 },
    notes: { type: String, default: '', maxlength: 500 },
    timeline: [
      {
        status: String,
        note: String,
        by: String,
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
)

orderSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    orderNumber: this.orderNumber,
    user: this.user,
    customerName: this.customerName,
    customerEmail: this.customerEmail,
    customerPhone: this.customerPhone,
    items: this.items,
    totalAmount: this.totalAmount,
    itemsTotal: this.itemsTotal,
    shippingFee: this.shippingFee,
    discountAmount: this.discountAmount,
    couponCode: this.couponCode,
    status: this.status,
    paymentStatus: this.paymentStatus,
    paymentMethod: this.paymentMethod,
    shippingAddress: this.shippingAddress,
    trackingNumber: this.trackingNumber,
    courier: this.courier,
    assignedSeller: this.assignedSeller,
    stockDeducted: this.stockDeducted,
    review: this.review,
    returnReason: this.returnReason,
    notes: this.notes,
    timeline: this.timeline || [],
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  }
}

export function buildOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = Math.floor(Math.random() * 900 + 100)
  return `PL-${stamp}-${rand}`
}

export function canTransition(from, to) {
  const allowed = STATUS_TRANSITIONS[from] || []
  return allowed.includes(to)
}

export default mongoose.model('Order', orderSchema)
