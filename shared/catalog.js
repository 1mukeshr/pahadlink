/**
 * Product pricing catalog — id / name / base price / sizes.
 * Presentation (images, tags, copy) stays in src/data/siteData.js.
 * Server uses this for trusted order pricing.
 */

export const PRODUCT_PRICING = [
  { id: 'pahadi-rajma', name: 'Pahadi Rajma | Kidney Beans from the Hills', price: 249, sizes: ['500g', '1 kg', '2 kg'] },
  { id: 'raw-honey', name: 'Raw Forest Honey | Unprocessed Himalayan Honey', price: 349, sizes: ['250g', '500g', '1 kg'] },
  { id: 'mandua-flour', name: 'Mandua Atta | Finger Millet Flour', price: 189, sizes: ['500g', '1 kg', '2 kg'] },
  { id: 'gahat-dal', name: 'Gahat Dal | Horse Gram from Uttarakhand', price: 199, sizes: ['500g', '1 kg'] },
  { id: 'red-rice', name: 'Pahadi Red Rice | Naturally Aged', price: 299, sizes: ['1 kg', '2 kg', '5 kg'] },
  { id: 'bal-mithai', name: 'Bal Mithai | Classic Almora Sweet', price: 399, sizes: ['250g', '500g'] },
  { id: 'herbal-tea', name: 'Himalayan Herbal Tea | Mountain Blend', price: 229, sizes: ['100g', '250g'] },
  { id: 'buransh-squash', name: 'Buransh Squash | Rhododendron Drink Mix', price: 279, sizes: ['500ml', '1 L'] },
  { id: 'pahadi-topi', name: 'Pahadi Topi | Traditional Wool Cap', price: 449, sizes: ['Free size'] },
  { id: 'ringaal-basket', name: 'Ringaal Bamboo Basket | Handcrafted', price: 599, sizes: ['Medium', 'Large'] },
  { id: 'jhangora', name: 'Jhangora | Barnyard Millet', price: 169, sizes: ['500g', '1 kg'] },
  { id: 'festival-hamper', name: 'Festival Hamper | Honey, Sweets & Grains', price: 1299, sizes: ['Standard', 'Premium'] },
  { id: 'organic-gift-box', name: 'Organic Gift Box | Clean Pahadi Essentials', price: 899, sizes: ['Box of 4', 'Box of 6'] },
]

const byId = new Map(PRODUCT_PRICING.map((p) => [p.id, p]))

export function toBaseUnits(amount, unit) {
  if (unit === 'kg' || unit === 'l') return amount * 1000
  return amount
}

export function sizeWeight(size) {
  const raw = String(size).toLowerCase().replace(/\s+/g, '')
  const multi = raw.match(/^(\d+)x(\d+(?:\.\d+)?)(g|kg|ml|l)$/)
  if (multi) {
    return Number(multi[1]) * toBaseUnits(Number(multi[2]), multi[3])
  }
  const measured = raw.match(/^(\d+(?:\.\d+)?)(g|kg|ml|l)$/)
  if (measured) return toBaseUnits(Number(measured[1]), measured[2])
  const pcs = raw.match(/^(\d+)pcs?$/)
  if (pcs) return Number(pcs[1])
  const named = {
    freesize: 1,
    medium: 1,
    large: 1.35,
    standard: 1,
    premium: 1.4,
    boxof4: 4,
    boxof6: 6,
    '108beads': 1,
  }
  return named[raw] || 1
}

export function nicePrice(value) {
  const n = Math.max(1, Math.round(value))
  if (n < 20) return n
  return Math.round(n / 10) * 10 - 1
}

export function getCatalogProduct(productId) {
  return byId.get(String(productId || '').trim()) || null
}

export function resolveUnitPrice(productId, size) {
  const product = getCatalogProduct(productId)
  if (!product) return null
  const sizes = product.sizes?.length ? product.sizes : ['Default']
  const label = size && sizes.includes(size) ? size : sizes[0]
  const index = Math.max(0, sizes.indexOf(label))
  const weights = sizes.map(sizeWeight)
  const baseWeight = weights[0] || 1
  const ratio = weights[index] / baseWeight
  const bulk =
    ratio > 1 ? 1 - Math.min(0.12, (Math.sqrt(ratio) - 1) * 0.08) : 1
  const price =
    index === 0 ? product.price : nicePrice(product.price * ratio * bulk)
  return { product, size: label, price }
}
