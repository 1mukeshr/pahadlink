import mongoose from 'mongoose'

export const CRM_STATUSES = [
  'new',
  'contacted',
  'interested',
  'converted',
  'lost',
]

export const CRM_SOURCES = [
  'website',
  'phone',
  'whatsapp',
  'referral',
  'social',
  'other',
]

const crmLeadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    phone: { type: String, default: '', trim: true },
    source: {
      type: String,
      enum: CRM_SOURCES,
      default: 'website',
    },
    status: {
      type: String,
      enum: CRM_STATUSES,
      default: 'new',
    },
    interest: { type: String, default: '', trim: true, maxlength: 120 },
    notes: { type: String, default: '', maxlength: 1000 },
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    lastContactAt: { type: Date, default: null },
  },
  { timestamps: true }
)

crmLeadSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    phone: this.phone,
    source: this.source,
    status: this.status,
    interest: this.interest,
    notes: this.notes,
    relatedUser: this.relatedUser,
    assignedTo: this.assignedTo,
    lastContactAt: this.lastContactAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  }
}

export default mongoose.model('CrmLead', crmLeadSchema)
