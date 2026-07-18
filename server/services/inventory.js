import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '../data')
const STORE_PATH = join(DATA_DIR, 'inventory.json')

/** Default stock by productId (mirrors storefront defaults / overrides) */
const DEFAULTS = {
  'pahadi-rajma': { stock: 40 },
  'raw-honey': { stock: 28 },
  'mandua-flour': { stock: 32 },
  'gahat-dal': { stock: 30 },
  'red-rice': { stockBySize: { '1 kg': 18, '2 kg': 8, '5 kg': 0 } },
  'bal-mithai': { stockBySize: { '250g': 14, '500g': 0 } },
  'herbal-tea': { stock: 36 },
  'buransh-squash': { stock: 22 },
  'pahadi-topi': { stock: 0 },
  'ringaal-basket': { stockBySize: { Medium: 7, Large: 0 } },
  'jhangora': { stock: 26 },
  singori: { stock: 20 },
  gangajal: { stock: 50 },
  'rudraksha-mala': { stock: 3 },
  'festival-hamper': { stockBySize: { Standard: 9, Premium: 0 } },
  'organic-gift-box': { stockBySize: { 'Box of 4': 12, 'Box of 6': 2 } },
}

function ensureStore() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  if (!existsSync(STORE_PATH)) {
    writeFileSync(STORE_PATH, `${JSON.stringify(DEFAULTS, null, 2)}\n`)
  }
}

function readStore() {
  ensureStore()
  try {
    const raw = JSON.parse(readFileSync(STORE_PATH, 'utf8'))
    return raw && typeof raw === 'object' ? raw : { ...DEFAULTS }
  } catch {
    return { ...DEFAULTS }
  }
}

function writeStore(data) {
  ensureStore()
  writeFileSync(STORE_PATH, `${JSON.stringify(data, null, 2)}\n`)
}

export function getStock(productId, size) {
  const store = readStore()
  const entry = store[productId] || DEFAULTS[productId]
  if (!entry) return 999
  if (entry.stockBySize && size && Object.prototype.hasOwnProperty.call(entry.stockBySize, size)) {
    return Math.max(0, Number(entry.stockBySize[size]) || 0)
  }
  if (typeof entry.stock === 'number') return Math.max(0, entry.stock)
  return 999
}

export function getInventorySnapshot() {
  const store = readStore()
  const ids = new Set([...Object.keys(DEFAULTS), ...Object.keys(store)])
  const items = []
  for (const id of ids) {
    const entry = store[id] || DEFAULTS[id] || { stock: 0 }
    items.push({
      productId: id,
      stock: typeof entry.stock === 'number' ? entry.stock : null,
      stockBySize: entry.stockBySize || null,
    })
  }
  return items.sort((a, b) => a.productId.localeCompare(b.productId))
}

/**
 * Decrement stock for order line items.
 * Returns { ok, message?, shortages? }
 */
export function decrementStock(items) {
  if (!Array.isArray(items) || !items.length) {
    return { ok: true }
  }

  const store = readStore()
  const shortages = []

  for (const item of items) {
    const productId = String(item.productId || '').trim()
    if (!productId) continue
    const qty = Math.max(1, Number(item.quantity) || 1)
    const size = item.size ? String(item.size) : ''
    const entry = store[productId] || structuredClone(DEFAULTS[productId] || { stock: 24 })

    if (entry.stockBySize && size && Object.prototype.hasOwnProperty.call(entry.stockBySize, size)) {
      const available = Math.max(0, Number(entry.stockBySize[size]) || 0)
      if (available < qty) {
        shortages.push({ productId, size, need: qty, available })
        continue
      }
      entry.stockBySize[size] = available - qty
    } else if (typeof entry.stock === 'number') {
      if (entry.stock < qty) {
        shortages.push({ productId, size: size || null, need: qty, available: entry.stock })
        continue
      }
      entry.stock -= qty
    }

    store[productId] = entry
  }

  if (shortages.length) {
    return { ok: false, message: 'Insufficient stock for one or more items', shortages }
  }

  writeStore(store)
  return { ok: true }
}

export function restoreStock(items) {
  if (!Array.isArray(items) || !items.length) return { ok: true }
  const store = readStore()

  for (const item of items) {
    const productId = String(item.productId || '').trim()
    if (!productId) continue
    const qty = Math.max(1, Number(item.quantity) || 1)
    const size = item.size ? String(item.size) : ''
    const entry = store[productId] || structuredClone(DEFAULTS[productId] || { stock: 0 })

    if (entry.stockBySize && size && Object.prototype.hasOwnProperty.call(entry.stockBySize, size)) {
      entry.stockBySize[size] = Math.max(0, Number(entry.stockBySize[size]) || 0) + qty
    } else if (typeof entry.stock === 'number') {
      entry.stock = Math.max(0, entry.stock) + qty
    } else {
      entry.stock = qty
    }
    store[productId] = entry
  }

  writeStore(store)
  return { ok: true }
}
