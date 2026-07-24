/**
 * GST helpers — catalog prices are exclusive; 5% GST is added on top.
 * Default 5% for packaged foods / general PahadLink catalog.
 */

export const GST_RATE = 0.05
export const GST_RATE_PERCENT = 5
export const GST_BUSINESS_STATE = 'Uttarakhand'

function normalizeState(raw = '') {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/**
 * Add GST on a taxable (ex-GST) amount.
 * total = taxable + gst
 */
export function applyExclusiveGst(taxableAmount, rate = GST_RATE) {
  const taxableValue = Math.max(0, Math.round(Number(taxableAmount) || 0))
  const safeRate = Math.max(0, Number(rate) || 0)
  const gstAmount =
    safeRate > 0 ? Math.round(taxableValue * safeRate) : 0
  return {
    taxableValue,
    gstAmount,
    inclusiveAmount: taxableValue + gstAmount,
    gstRate: safeRate,
    gstRatePercent: Math.round(safeRate * 1000) / 10,
  }
}

/**
 * Extract tax from an inclusive (tax-in) amount — used for legacy order display.
 */
export function splitInclusiveGst(inclusiveAmount, rate = GST_RATE) {
  const gross = Math.max(0, Math.round(Number(inclusiveAmount) || 0))
  const safeRate = Math.max(0, Number(rate) || 0)
  const gstAmount =
    safeRate > 0 ? Math.round((gross * safeRate) / (1 + safeRate)) : 0
  return {
    inclusiveAmount: gross,
    taxableValue: Math.max(0, gross - gstAmount),
    gstAmount,
    gstRate: safeRate,
    gstRatePercent: Math.round(safeRate * 1000) / 10,
  }
}

/**
 * Split GST into CGST+SGST (intra-state) or IGST (inter-state).
 */
export function allocateGst(
  gstAmount,
  { shippingState = '', businessState = GST_BUSINESS_STATE } = {}
) {
  const total = Math.max(0, Math.round(Number(gstAmount) || 0))
  const ship = normalizeState(shippingState)
  const biz = normalizeState(businessState)
  const sameState = Boolean(ship && biz && ship === biz)

  if (sameState || !ship) {
    const cgstAmount = Math.floor(total / 2)
    const sgstAmount = total - cgstAmount
    return {
      cgstAmount,
      sgstAmount,
      igstAmount: 0,
      gstType: 'cgst_sgst',
    }
  }

  return {
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: total,
    gstType: 'igst',
  }
}

/**
 * Full GST breakdown: GST is added on taxableValue.
 * totalPayable = taxableValue + gstAmount
 */
export function buildGstBreakdown(taxableTotal, opts = {}) {
  const base = applyExclusiveGst(taxableTotal, opts.rate ?? GST_RATE)
  const split = allocateGst(base.gstAmount, opts)
  return {
    ...base,
    ...split,
    pricesIncludeGst: false,
  }
}
