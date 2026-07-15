import mongoose from 'mongoose'

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
]

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded']

const orderItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
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
    shippingAddress: {
      line1: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    notes: { type: String, default: '', maxlength: 500 },
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
    status: this.status,
    paymentStatus: this.paymentStatus,
    shippingAddress: this.shippingAddress,
    notes: this.notes,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  }
}

export function buildOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = Math.floor(Math.random() * 900 + 100)
  return `PL-${stamp}-${rand}`
}

export default mongoose.model('Order', orderSchema)
