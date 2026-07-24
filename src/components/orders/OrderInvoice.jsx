import { useEffect, useState } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import logo from '../../assets/images/logo.png'
import { CloseIcon, DownloadIcon, PrintIcon } from '../icons'
import { GST_RATE_PERCENT, buildGstBreakdown } from '../../data/gst'
import { mapApiOrderToUi, paymentStatusLabel } from '../../services/orderService'
import './orderInvoice.css'

const SELLER = {
  line: 'Almora Road, Haldwani',
  city: 'Uttarakhand 263139',
  phone: '+91 96904 21423',
  email: 'care@pahadlink.com',
  state: 'Uttarakhand',
  stateCode: '05',
}

const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
]
const TENS = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
]

function twoDigits(n) {
  if (n < 20) return ONES[n]
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`.trim()
}

/** Indian numbering: Crore / Lakh / Thousand */
function amountInWords(amount) {
  let n = Math.round(Number(amount) || 0)
  if (n === 0) return 'Zero Rupees Only'
  const parts = []
  const crore = Math.floor(n / 10000000)
  n %= 10000000
  const lakh = Math.floor(n / 100000)
  n %= 100000
  const thousand = Math.floor(n / 1000)
  n %= 1000
  const hundred = Math.floor(n / 100)
  const rest = n % 100
  if (crore) parts.push(`${twoDigits(crore)} Crore`)
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`)
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`)
  if (hundred) parts.push(`${ONES[hundred]} Hundred`)
  if (rest) parts.push(twoDigits(rest))
  return `${parts.join(' ')} Rupees Only`
}

const formatPrice = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN')}`

const formatDate = (iso) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

const paymentLabel = (id) => {
  if (id === 'upi') return 'UPI'
  if (id === 'cod' || !id) return 'Cash on delivery'
  return String(id)
}

function toInvoiceOrder(order) {
  if (!order) return null
  if (
    order.orderNumber ||
    order.totalAmount != null ||
    order.customerName ||
    order.shippingAddress
  ) {
    return mapApiOrderToUi(order)
  }
  return order
}

function buildInvoiceTotals(order) {
  const items = order.items || []
  const subtotal = items.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * Number(item.qty || item.quantity || 1),
    0
  )
  const shipping = Number(order.shipping || 0)
  const discount = Number(order.discount || 0)
  const taxableBase = Math.max(0, subtotal - discount + shipping)
  const fallback = buildGstBreakdown(taxableBase, {
    shippingState: order.state || '',
  })
  const gstType = order.gstType || fallback.gstType
  const ratePct =
    order.gstRate != null
      ? Math.round(Number(order.gstRate) * 1000) / 10
      : GST_RATE_PERCENT
  const cgst =
    order.cgstAmount != null ? Number(order.cgstAmount) : fallback.cgstAmount
  const sgst =
    order.sgstAmount != null ? Number(order.sgstAmount) : fallback.sgstAmount
  const igst =
    order.igstAmount != null ? Number(order.igstAmount) : fallback.igstAmount
  const gstAmount =
    order.gstAmount != null
      ? Number(order.gstAmount)
      : gstType === 'igst'
        ? igst
        : cgst + sgst
  const taxableValue =
    order.taxableValue != null ? Number(order.taxableValue) : taxableBase
  const total = Number(order.total || 0)

  return {
    subtotal,
    shipping,
    discount,
    taxableValue,
    gstType,
    ratePct,
    cgst,
    sgst,
    igst,
    gstAmount,
    total,
  }
}

async function toDataUrl(src) {
  try {
    const res = await fetch(src)
    const blob = await res.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return src
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function InvoiceSheet({ inv, totals, logoSrc }) {
  const items = inv.items || []
  const billLines = [
    inv.name || 'Customer',
    inv.email,
    inv.phone ? `Phone: ${inv.phone}` : '',
  ].filter(Boolean)
  const shipLines = [
    inv.name,
    inv.address,
    [inv.city, inv.state].filter(Boolean).join(', '),
    inv.pincode ? `PIN ${inv.pincode}` : '',
    inv.phone ? `Phone: ${inv.phone}` : '',
  ].filter(Boolean)

  return (
    <div className="order-invoice__sheet" id="order-invoice-print">
      <header className="order-invoice__mast">
        <img src={logoSrc} alt="" className="order-invoice__logo" />
        <h1>Invoice</h1>
      </header>

      <section className="order-invoice__grid2">
        <div className="order-invoice__block">
          <h2>Sold by</h2>
          <p className="order-invoice__block-body">
            {SELLER.line}
            <br />
            {SELLER.city}
            <br />
            {SELLER.state} ({SELLER.stateCode})
            <br />
            {SELLER.phone}
            <br />
            {SELLER.email}
          </p>
        </div>
        <div className="order-invoice__block">
          <h2>Invoice details</h2>
          <dl className="order-invoice__dl">
            <div>
              <dt>Invoice no.</dt>
              <dd>{inv.id}</dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>{formatDate(inv.createdAt)}</dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>
                {paymentLabel(inv.payment)} · {paymentStatusLabel(inv)}
              </dd>
            </div>
            <div>
              <dt>Place of supply</dt>
              <dd>{inv.state || SELLER.state}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="order-invoice__grid2">
        <div className="order-invoice__block">
          <h2>Invoice to</h2>
          <p className="order-invoice__block-body">
            {billLines.map((line) => (
              <span key={line}>
                {line === billLines[0] ? <strong>{line}</strong> : line}
                <br />
              </span>
            ))}
          </p>
        </div>
        <div className="order-invoice__block">
          <h2>Deliver to</h2>
          <p className="order-invoice__block-body">
            {shipLines.map((line, i) => (
              <span key={`${line}-${i}`}>
                {i === 0 ? <strong>{line}</strong> : line}
                <br />
              </span>
            ))}
          </p>
        </div>
      </section>

      <table className="order-invoice__table">
        <colgroup>
          <col className="col-sr" />
          <col className="col-item" />
          <col className="col-size" />
          <col className="col-qty" />
          <col className="col-rate" />
          <col className="col-amt" />
        </colgroup>
        <thead>
          <tr>
            <th className="is-center">#</th>
            <th>Item</th>
            <th className="is-center">Size</th>
            <th className="is-num">Qty</th>
            <th className="is-num">Rate</th>
            <th className="is-num">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const qty = Number(item.qty || item.quantity || 1)
            const rate = Number(item.price || 0)
            return (
              <tr key={`${item.id || item.productId || idx}-${idx}`}>
                <td className="is-center">{idx + 1}</td>
                <td>{item.name}</td>
                <td className="is-center">{item.size || '—'}</td>
                <td className="is-num">{qty}</td>
                <td className="is-num">{formatPrice(rate)}</td>
                <td className="is-num">{formatPrice(rate * qty)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <section className="order-invoice__bottom">
        <div className="order-invoice__words">
          <span>Amount in words</span>
          <strong>{amountInWords(totals.total)}</strong>
          <p className="order-invoice__hint">
            Prices exclusive of GST ({totals.ratePct}%). Computer-generated
            invoice.
          </p>
        </div>
        <table className="order-invoice__totals">
          <tbody>
            <tr>
              <th>Subtotal</th>
              <td>{formatPrice(totals.subtotal)}</td>
            </tr>
            {totals.discount > 0 ? (
              <tr>
                <th>
                  Discount
                  {inv.couponCode ? ` (${inv.couponCode})` : ''}
                </th>
                <td>−{formatPrice(totals.discount)}</td>
              </tr>
            ) : null}
            <tr>
              <th>Shipping</th>
              <td>
                {totals.shipping === 0
                  ? 'Free'
                  : formatPrice(totals.shipping)}
              </td>
            </tr>
            <tr>
              <th>Taxable value</th>
              <td>{formatPrice(totals.taxableValue)}</td>
            </tr>
            {totals.gstType === 'igst' ? (
              <tr>
                <th>IGST ({totals.ratePct}%)</th>
                <td>{formatPrice(totals.igst)}</td>
              </tr>
            ) : (
              <>
                <tr>
                  <th>CGST ({totals.ratePct / 2}%)</th>
                  <td>{formatPrice(totals.cgst)}</td>
                </tr>
                <tr>
                  <th>SGST ({totals.ratePct / 2}%)</th>
                  <td>{formatPrice(totals.sgst)}</td>
                </tr>
              </>
            )}
            <tr className="is-total">
              <th>Total</th>
              <td>{formatPrice(totals.total)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <footer className="order-invoice__foot">
        <div className="order-invoice__sign">
          <span className="order-invoice__sign-line" aria-hidden="true" />
          <p>Authorised Signatory</p>
        </div>
        <p className="order-invoice__thanks">Thank you for shopping with us.</p>
      </footer>
    </div>
  )
}

function buildDownloadHtml(inv, totals, logoData) {
  const items = inv.items || []
  const billHtml = [
    `<strong>${escapeHtml(inv.name || 'Customer')}</strong>`,
    inv.email ? escapeHtml(inv.email) : '',
    inv.phone ? `Phone: ${escapeHtml(inv.phone)}` : '',
  ]
    .filter(Boolean)
    .join('<br />')

  const shipHtml = [
    inv.name,
    inv.address,
    [inv.city, inv.state].filter(Boolean).join(', '),
    inv.pincode ? `PIN ${inv.pincode}` : '',
    inv.phone ? `Phone: ${inv.phone}` : '',
  ]
    .filter(Boolean)
    .map((l, i) => (i === 0 ? `<strong>${escapeHtml(l)}</strong>` : escapeHtml(l)))
    .join('<br />')

  const rows = items
    .map((item, idx) => {
      const qty = Number(item.qty || item.quantity || 1)
      const rate = Number(item.price || 0)
      return `<tr>
        <td class="center">${idx + 1}</td>
        <td>${escapeHtml(item.name || '')}</td>
        <td class="center">${escapeHtml(item.size || '—')}</td>
        <td class="num">${qty}</td>
        <td class="num">${formatPrice(rate)}</td>
        <td class="num">${formatPrice(rate * qty)}</td>
      </tr>`
    })
    .join('')

  const taxRows =
    totals.gstType === 'igst'
      ? `<tr><th>IGST (${totals.ratePct}%)</th><td>${formatPrice(totals.igst)}</td></tr>`
      : `<tr><th>CGST (${totals.ratePct / 2}%)</th><td>${formatPrice(totals.cgst)}</td></tr>
         <tr><th>SGST (${totals.ratePct / 2}%)</th><td>${formatPrice(totals.sgst)}</td></tr>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice ${escapeHtml(String(inv.id))}</title>
  <style>${DOWNLOAD_CSS}</style>
</head>
<body>
  <div class="sheet">
    <header class="mast">
      <img src="${logoData}" alt="" class="logo" />
      <h1>Invoice</h1>
    </header>
    <section class="grid2">
      <div class="block">
        <h2>Sold by</h2>
        <p>${SELLER.line}<br />${SELLER.city}<br />${SELLER.state} (${SELLER.stateCode})<br />${SELLER.phone}<br />${SELLER.email}</p>
      </div>
      <div class="block">
        <h2>Invoice details</h2>
        <table class="dl">
          <tr><th>Invoice no.</th><td>${escapeHtml(String(inv.id))}</td></tr>
          <tr><th>Date</th><td>${escapeHtml(formatDate(inv.createdAt))}</td></tr>
          <tr><th>Payment</th><td>${escapeHtml(paymentLabel(inv.payment))} · ${escapeHtml(paymentStatusLabel(inv))}</td></tr>
          <tr><th>Place of supply</th><td>${escapeHtml(inv.state || SELLER.state)}</td></tr>
        </table>
      </div>
    </section>
    <section class="grid2">
      <div class="block"><h2>Invoice to</h2><p>${billHtml}</p></div>
      <div class="block"><h2>Deliver to</h2><p>${shipHtml}</p></div>
    </section>
    <table class="items">
      <colgroup>
        <col style="width:6%" />
        <col style="width:44%" />
        <col style="width:12%" />
        <col style="width:10%" />
        <col style="width:14%" />
        <col style="width:14%" />
      </colgroup>
      <thead>
        <tr>
          <th class="center">#</th><th>Item</th><th class="center">Size</th>
          <th class="num">Qty</th><th class="num">Rate</th><th class="num">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <section class="bottom">
      <div class="words">
        <span>Amount in words</span>
        <strong>${escapeHtml(amountInWords(totals.total))}</strong>
        <p class="hint">Prices exclusive of GST (${totals.ratePct}%). Computer-generated invoice.</p>
      </div>
      <table class="totals">
        <tr><th>Subtotal</th><td>${formatPrice(totals.subtotal)}</td></tr>
        ${
          totals.discount > 0
            ? `<tr><th>Discount${inv.couponCode ? ` (${escapeHtml(inv.couponCode)})` : ''}</th><td>−${formatPrice(totals.discount)}</td></tr>`
            : ''
        }
        <tr><th>Shipping</th><td>${totals.shipping === 0 ? 'Free' : formatPrice(totals.shipping)}</td></tr>
        <tr><th>Taxable value</th><td>${formatPrice(totals.taxableValue)}</td></tr>
        ${taxRows}
        <tr class="total"><th>Total</th><td>${formatPrice(totals.total)}</td></tr>
      </table>
    </section>
    <footer class="foot">
      <div class="sign"><span class="sign-line"></span><p>Authorised Signatory</p></div>
      <p class="thanks">Thank you for shopping with us.</p>
    </footer>
  </div>
</body>
</html>`
}

const DOWNLOAD_CSS = `
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    font-family: Arial, Helvetica, sans-serif;
    color: #374151;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .sheet {
    --ink: #111827;
    --body: #374151;
    --muted: #6b7280;
    --subtle: #9ca3af;
    --line: #e5e7eb;
    --line-soft: #f3f4f6;
    --head-bg: #f9fafb;
    width: 210mm;
    min-height: 297mm;
    margin: 0;
    padding: 14mm 16mm 12mm;
    display: flex;
    flex-direction: column;
    background: #fff;
    color: var(--body);
  }
  .mast {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding-bottom: 12px;
    margin-bottom: 14px;
    border-bottom: 1px solid var(--line);
  }
  .logo {
    display: block;
    height: 38px;
    width: auto;
    max-width: 150px;
    object-fit: contain;
  }
  .mast h1 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink);
  }
  .grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    margin-bottom: 12px;
    border: 1px solid var(--line);
  }
  .block {
    padding: 10px 12px;
    min-height: 96px;
  }
  .block + .block { border-left: 1px solid var(--line); }
  .block h2 {
    margin: 0 0 8px;
    padding-bottom: 4px;
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
    border-bottom: 1px solid var(--line-soft);
  }
  .block p {
    margin: 0;
    font-size: 11px;
    line-height: 1.5;
    color: var(--body);
  }
  .block p strong { color: var(--ink); }
  .dl {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
  }
  .dl th, .dl td {
    padding: 3px 0;
    vertical-align: top;
    line-height: 1.4;
  }
  .dl th {
    width: 40%;
    text-align: left;
    font-weight: 400;
    color: var(--muted);
  }
  .dl td {
    text-align: right;
    font-weight: 600;
    color: var(--ink);
    word-break: break-word;
  }
  .items {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    font-size: 11px;
    border: 1px solid var(--line);
  }
  .items th {
    padding: 8px 8px;
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--muted);
    background: var(--head-bg);
    border-bottom: 1px solid var(--line);
    text-align: left;
  }
  .items td {
    padding: 8px;
    border-bottom: 1px solid var(--line-soft);
    vertical-align: middle;
    color: var(--body);
    line-height: 1.35;
  }
  .items tr:last-child td { border-bottom: none; }
  .num {
    text-align: right !important;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
    color: var(--ink) !important;
  }
  .center { text-align: center !important; color: var(--body) !important; }
  .bottom {
    display: grid;
    grid-template-columns: 1fr 230px;
    gap: 24px;
    margin-top: 14px;
    align-items: start;
  }
  .words span {
    display: block;
    margin-bottom: 4px;
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .words strong {
    display: block;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.4;
    color: var(--ink);
  }
  .words .hint {
    margin: 10px 0 0;
    font-size: 10px;
    line-height: 1.4;
    color: var(--subtle);
  }
  .totals {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
  }
  .totals th, .totals td {
    padding: 5px 0;
    border-bottom: 1px solid var(--line-soft);
  }
  .totals th {
    width: 58%;
    text-align: left;
    font-weight: 400;
    color: var(--muted);
  }
  .totals td {
    text-align: right;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--ink);
  }
  .totals .total th, .totals .total td {
    border-bottom: none;
    border-top: 1.5px solid var(--ink);
    padding-top: 8px;
    font-size: 13px;
    font-weight: 700;
    color: var(--ink);
  }
  .foot {
    margin-top: auto;
    padding-top: 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-top: 1px solid var(--line);
    font-size: 10.5px;
    color: var(--muted);
  }
  .sign-line {
    display: block;
    width: 130px;
    height: 1px;
    margin-bottom: 8px;
    background: var(--line);
  }
  .sign p, .thanks { margin: 0; }
  .thanks { text-align: right; color: var(--body); }
`



/**
 * Proper A4 tax invoice for a PahadLink order.
 */
export default function OrderInvoice({ order, open, onClose }) {
  const inv = toInvoiceOrder(order)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open || !inv) return null

  const totals = buildInvoiceTotals(inv)

  const handlePrint = () => window.print()

  const handleDownload = async () => {
    setBusy(true)
    try {
      await downloadOrderInvoice(inv)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="order-invoice"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-invoice-title"
    >
      <button
        type="button"
        className="order-invoice__backdrop"
        aria-label="Close invoice"
        onClick={onClose}
      />

      <div className="order-invoice__shell">
        <header className="order-invoice__toolbar no-print">
          <div>
            <p className="order-invoice__toolbar-kicker">Invoice · A4</p>
            <strong id="order-invoice-title">{inv.id}</strong>
          </div>
          <div className="order-invoice__toolbar-actions">
            <button
              type="button"
              className="order-invoice__btn order-invoice__btn--secondary"
              onClick={handleDownload}
              disabled={busy}
            >
              <DownloadIcon size={16} />
              {busy ? 'Preparing PDF…' : 'Download PDF'}
            </button>
            <button
              type="button"
              className="order-invoice__btn order-invoice__btn--primary"
              onClick={handlePrint}
            >
              <PrintIcon size={16} />
              Print
            </button>
            <button
              type="button"
              className="order-invoice__btn order-invoice__btn--ghost"
              aria-label="Close"
              onClick={onClose}
            >
              <CloseIcon size={18} />
            </button>
          </div>
        </header>

        <div className="order-invoice__stage">
          <InvoiceSheet inv={inv} totals={totals} logoSrc={logo} />
        </div>
      </div>
    </div>
  )
}

function waitForImages(root) {
  const imgs = Array.from(root.querySelectorAll('img'))
  if (!imgs.length) return Promise.resolve()
  return Promise.all(
    imgs.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) {
            resolve()
            return
          }
          img.onload = () => resolve()
          img.onerror = () => resolve()
        })
    )
  )
}

/** Render invoice HTML off-screen and save as A4 PDF. */
async function htmlToA4Pdf(html, filename) {
  const host = document.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText =
    'position:fixed;left:-10000px;top:0;width:210mm;background:#fff;pointer-events:none;z-index:-1;font-family:Arial,Helvetica,sans-serif;color:#222;'
  document.body.appendChild(host)

  try {
    // Full HTML doc → extract body + styles into host
    const parsed = new DOMParser().parseFromString(html, 'text/html')
    const styleEl = document.createElement('style')
    styleEl.textContent = Array.from(parsed.querySelectorAll('style'))
      .map((s) => s.textContent)
      .join('\n')
    host.appendChild(styleEl)

    const sheet = parsed.querySelector('.sheet')
    if (!sheet) throw new Error('Invoice sheet not found')
    host.appendChild(document.importNode(sheet, true))

    await waitForImages(host)
    await new Promise((r) => setTimeout(r, 60))

    const target = host.querySelector('.sheet')
    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: target.scrollWidth,
      height: Math.max(target.scrollHeight, target.offsetHeight),
    })

    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    })

    const pageW = 210
    const pageH = 297
    const imgW = pageW
    const imgH = (canvas.height * imgW) / canvas.width

    let heightLeft = imgH
    let position = 0

    pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH, undefined, 'FAST')
    heightLeft -= pageH

    while (heightLeft > 0.5) {
      position = heightLeft - imgH
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH, undefined, 'FAST')
      heightLeft -= pageH
    }

    pdf.save(filename)
  } finally {
    host.remove()
  }
}

/** Download an A4 tax invoice as PDF. */
export async function downloadOrderInvoice(order) {
  const inv = toInvoiceOrder(order)
  if (!inv) throw new Error('Order not found')

  const totals = buildInvoiceTotals(inv)
  const logoData = await toDataUrl(logo)
  const safeId = String(inv.id || 'order').replace(/[^\w.-]+/g, '_')
  const html = buildDownloadHtml(inv, totals, logoData)

  await htmlToA4Pdf(html, `Invoice-${safeId}.pdf`)
  return inv.id
}
