import { STORAGE } from '../config'
import { isCompleteDeliveryLocation } from './checkoutValidation'

export const LOCATION_EVENT = 'pahadlink:location'
export const ADDRESSES_EVENT = 'pahadlink:addresses'
/** Open the header delivery-address picker (Home / after login) */
export const OPEN_ADDRESS_EVENT = 'pahadlink:open-address'

export const ADDRESS_TAGS = ['Home', 'Work', 'Hotel', 'Other']

export const INDIA_STATES = [
  'Uttarakhand',
  'Himachal Pradesh',
  'Delhi',
  'Uttar Pradesh',
  'Haryana',
  'Punjab',
  'Rajasthan',
  'Maharashtra',
  'Karnataka',
  'Other',
]

/** Normalize free-text state to checkout select value */
export function matchState(raw = '') {
  const text = String(raw).trim().toLowerCase()
  if (!text) return ''
  const hit = INDIA_STATES.find((s) => s.toLowerCase() === text)
  if (hit) return hit
  if (text.includes('delhi') || text === 'nct') return 'Delhi'
  if (text.includes('uttarakhand') || text.includes('ua') || text === 'uk') {
    return 'Uttarakhand'
  }
  if (text.includes('himachal')) return 'Himachal Pradesh'
  if (text.includes('uttar pradesh') || text === 'up') return 'Uttar Pradesh'
  return INDIA_STATES.includes(raw) ? raw : 'Other'
}

function makeId() {
  return `addr_${Date.now().toString(36)}_${Math.floor(Math.random() * 900 + 100)}`
}

export function normalizeLocation(input = {}) {
  const city = String(input.city || '').trim()
  const state = matchState(input.state || '')
  const pin = String(input.pin || input.pincode || '')
    .replace(/\D/g, '')
    .slice(0, 6)
  const line1 = String(input.line1 || input.address || '').trim()
  const floor = String(input.floor || '').trim()
  const area = String(input.area || input.locality || '').trim()
  const landmark = String(input.landmark || '').trim()
  const fullAddress = String(input.fullAddress || '').trim()
  const tag = ADDRESS_TAGS.includes(input.tag) ? input.tag : 'Home'
  const name = String(input.name || '').trim()
  const phone = String(input.phone || '')
    .replace(/\D/g, '')
    .slice(0, 10)

  let label = String(input.label || '').trim()
  if (!label) {
    label =
      [line1 || area, city].filter(Boolean).join(', ') ||
      (pin ? `Pincode ${pin}` : 'Selected location')
  }

  const resolvedLine1 = line1 || area || city || label

  return {
    id: input.id || null,
    tag,
    name,
    phone,
    label,
    fullAddress:
      fullAddress ||
      [line1, floor, area, landmark, city, state, pin]
        .filter(Boolean)
        .join(', '),
    line1: resolvedLine1,
    floor,
    area,
    landmark,
    city,
    state,
    pin,
    lat: typeof input.lat === 'number' ? input.lat : undefined,
    lng: typeof input.lng === 'number' ? input.lng : undefined,
    source: input.source || 'custom',
    updatedAt: input.updatedAt || new Date().toISOString(),
  }
}

function tokenizeAddress(text = '') {
  return String(text)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function uniqueJoinParts(...chunks) {
  const out = []
  const seen = new Set()
  for (const chunk of chunks) {
    for (const part of tokenizeAddress(chunk)) {
      const key = part.toLowerCase()
      if (seen.has(key)) continue
      if (out.some((p) => p.toLowerCase().includes(key) && p.length > part.length)) {
        continue
      }
      seen.add(key)
      out.push(part)
    }
  }
  return out.join(', ')
}

function isLocalityPart(part = '') {
  return /sector\s*\d*|phase\s*\d*|block\s*[a-z0-9]|nagar|colony|enclave|extension|\broad\b|marg|chowk|market|village|tehsil|township|society|layout|cross\b/i.test(
    part
  )
}

/**
 * Split a fetched GPS/search address into form fields:
 * house (line1) · locality (area) · city · pin — not one blob in house.
 * Always rebuilds from the richest fullAddress when available.
 */
export function splitAddressForForm(input = {}) {
  let city = String(input.city || '').trim()
  let state = matchState(input.state || '')
  let pin = String(input.pin || input.pincode || '')
    .replace(/\D/g, '')
    .slice(0, 6)
  const floor = String(input.floor || '').trim()
  let landmark = String(input.landmark || '').trim()
  let area = String(input.area || input.locality || '').trim()
  let line1 = String(input.line1 || input.address || '').trim()
  const fullAddress = String(input.fullAddress || input.label || '').trim()

  const isMetaPart = (part) => {
    const p = String(part || '').trim()
    if (!p) return true
    if (/^india$/i.test(p)) return true
    if (/^\d{6}$/.test(p.replace(/\s/g, ''))) return true
    if (pin && p.replace(/\D/g, '').includes(pin)) return true
    if (state && p.toLowerCase() === state.toLowerCase()) return true
    if (
      city &&
      (p.toLowerCase() === city.toLowerCase() ||
        (p.toLowerCase() === 'gurgaon' && city.toLowerCase() === 'gurugram') ||
        (p.toLowerCase() === 'gurugram' && city.toLowerCase() === 'gurgaon') ||
        p.toLowerCase().includes(city.toLowerCase()))
    ) {
      return true
    }
    if (
      /^(uttarakhand|haryana|delhi|nct of delhi|uttar pradesh|himachal pradesh|rajasthan|punjab|maharashtra|karnataka|gurgaon|gurugram)$/i.test(
        p
      )
    ) {
      return true
    }
    return false
  }

  if (!pin) {
    const hit = `${fullAddress} ${line1}`.match(/\b(\d{6})\b/)
    if (hit) pin = hit[1]
  }

  // Prefer fullAddress as source of truth for splitting
  let sourceParts = tokenizeAddress(fullAddress)
  if (sourceParts.length < 2) {
    sourceParts = uniqueJoinParts(line1, area, city)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  if (!city) {
    const trailing = [...tokenizeAddress(fullAddress)].reverse()
    for (const part of trailing) {
      if (isMetaPart(part)) continue
      if (isLocalityPart(part)) continue
      if (part.length >= 3) {
        city = part
        break
      }
    }
  }

  // Normalize Gurgaon / Gurugram
  if (/^gurgaon$/i.test(city)) city = 'Gurugram'

  let parts = sourceParts.filter((p) => !isMetaPart(p))

  if (city) {
    parts = parts.filter((p) => {
      const low = p.toLowerCase()
      const c = city.toLowerCase()
      if (low === c) return false
      if (c === 'gurugram' && low === 'gurgaon') return false
      if (c === 'gurgaon' && low === 'gurugram') return false
      return true
    })
  }

  if (parts.length >= 1) {
    // First token = house/building; rest = full locality
    let splitAt = 1
    // Keep short codes with building name: "B1-4, Spaze IT Park"
    if (
      parts.length >= 3 &&
      parts[0].length <= 16 &&
      !isLocalityPart(parts[1])
    ) {
      splitAt = 2
    }
    // If first part is already a locality keyword, leave house empty for user
    if (isLocalityPart(parts[0]) && !line1) {
      splitAt = 0
    }

    const houseParts = parts.slice(0, splitAt)
    const areaParts = parts.slice(splitAt)

    // Keep an existing short house name if it isn't already in parts
    if (
      line1 &&
      tokenizeAddress(line1).length === 1 &&
      !parts.some((p) => p.toLowerCase() === line1.toLowerCase())
    ) {
      line1 = uniqueJoinParts(line1, houseParts.join(', '))
    } else {
      line1 = houseParts.join(', ') || line1
    }

    const nextArea = areaParts.join(', ')
    // Always prefer the fuller locality from the fetched address
    if (nextArea) {
      area =
        !area ||
        nextArea.length >= area.length ||
        tokenizeAddress(nextArea).length >= tokenizeAddress(area).length
          ? nextArea
          : uniqueJoinParts(area, nextArea)
    } else if (!area && input.area) {
      area = String(input.area).trim()
    }
  }

  // Merge structured area from geocode if form locality is still thin
  const seedArea = String(input.area || '').trim()
  if (seedArea) {
    area = uniqueJoinParts(area, seedArea)
  }

  // Final: drop house tokens duplicated inside locality
  if (area && line1) {
    const houseSet = new Set(tokenizeAddress(line1).map((p) => p.toLowerCase()))
    area = tokenizeAddress(area)
      .filter((p) => !houseSet.has(p.toLowerCase()))
      .join(', ')
  }

  // Landmark: optional nearby POI if present separately and not already used
  if (!landmark && input.landmark) {
    landmark = String(input.landmark).trim()
  }

  return {
    id: input.id || null,
    tag: ADDRESS_TAGS.includes(input.tag) ? input.tag : 'Home',
    name: String(input.name || '').trim(),
    phone: String(input.phone || '')
      .replace(/\D/g, '')
      .slice(0, 10),
    line1: line1 || '',
    floor,
    area: area || '',
    landmark: landmark || '',
    city: city || '',
    state: state || 'Uttarakhand',
    pin: pin || '',
    fullAddress:
      fullAddress ||
      [line1, floor, area, landmark, city, state, pin].filter(Boolean).join(', '),
    lat: typeof input.lat === 'number' ? input.lat : undefined,
    lng: typeof input.lng === 'number' ? input.lng : undefined,
    source: input.source || 'custom',
  }
}

export function readLocation() {
  try {
    const raw = localStorage.getItem(STORAGE.LOCATION)
    return raw ? normalizeLocation(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function saveLocation(next) {
  const normalized = normalizeLocation(next)
  localStorage.setItem(STORAGE.LOCATION, JSON.stringify(normalized))
  window.dispatchEvent(
    new CustomEvent(LOCATION_EVENT, { detail: normalized })
  )
  return normalized
}

function emitAddresses(list) {
  window.dispatchEvent(new CustomEvent(ADDRESSES_EVENT, { detail: list }))
}

function writeAddresses(list) {
  localStorage.setItem(STORAGE.ADDRESSES, JSON.stringify(list))
  emitAddresses(list)
  return list
}

/** Migrate legacy single location / checkout address into the book */
function migrateAddressesIfNeeded(list) {
  if (list.length) return list

  const legacy = []
  const loc = readLocation()
  if (loc?.line1 || loc?.city || loc?.pin) {
    legacy.push(
      normalizeLocation({
        ...loc,
        id: makeId(),
        tag: 'Home',
        source: loc.source || 'migrated',
      })
    )
  }

  try {
    const raw = localStorage.getItem(STORAGE.CHECKOUT_ADDRESS)
    const checkout = raw ? JSON.parse(raw) : null
    if (checkout?.address || checkout?.city) {
      const candidate = normalizeLocation({
        id: makeId(),
        tag: 'Home',
        name: checkout.name || '',
        phone: checkout.phone || '',
        line1: checkout.address || '',
        landmark: checkout.landmark || '',
        city: checkout.city || '',
        state: checkout.state || '',
        pin: checkout.pincode || '',
        source: 'checkout',
      })
      const dup = legacy.some(
        (a) =>
          a.line1 === candidate.line1 &&
          a.city === candidate.city &&
          a.pin === candidate.pin
      )
      if (!dup) legacy.push(candidate)
    }
  } catch {
    /* ignore */
  }

  if (legacy.length) writeAddresses(legacy)
  return legacy
}

export function listAddresses() {
  try {
    const raw = localStorage.getItem(STORAGE.ADDRESSES)
    const parsed = raw ? JSON.parse(raw) : []
    const list = Array.isArray(parsed)
      ? parsed.map((item) => normalizeLocation(item)).filter((a) => a.line1 || a.city)
      : []
    return migrateAddressesIfNeeded(list)
  } catch {
    return migrateAddressesIfNeeded([])
  }
}

/** Active pin/location, else first saved address — for checkout autofill */
export function getPreferredDeliveryAddress() {
  const active = readLocation()
  if (active && (active.line1 || active.city || active.pin)) {
    return active
  }
  const list = listAddresses()
  return list[0] || null
}

/** True when delivery location has street, city, state, and 6-digit pin (phone at checkout). */
export function hasCompleteShippingAddress(loc = getPreferredDeliveryAddress()) {
  if (isCompleteDeliveryLocation(loc)) return true

  try {
    const raw = localStorage.getItem(STORAGE.CHECKOUT_ADDRESS)
    if (!raw) return false
    return isCompleteDeliveryLocation(JSON.parse(raw))
  } catch {
    return false
  }
}

const RESUME_CHECKOUT_KEY = 'pahadlink_resume_checkout'

/** Remember that checkout should continue after location/address is saved */
export function markResumeCheckout() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(RESUME_CHECKOUT_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function clearResumeCheckout() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(RESUME_CHECKOUT_KEY)
  } catch {
    /* ignore */
  }
}

export function shouldResumeCheckout() {
  if (typeof window === 'undefined') return false
  try {
    return sessionStorage.getItem(RESUME_CHECKOUT_KEY) === '1'
  } catch {
    return false
  }
}

export function requestOpenAddressPicker(detail = {}) {
  if (typeof window === 'undefined') return
  if (detail.resumeCheckout) markResumeCheckout()
  window.dispatchEvent(
    new CustomEvent(OPEN_ADDRESS_EVENT, {
      detail: {
        message:
          detail.message ||
          'Add your current location and delivery address to continue checkout.',
        ...detail,
      },
    })
  )
}

export function getAddressById(id) {
  if (!id) return null
  return listAddresses().find((a) => a.id === id) || null
}

/**
 * Create or update a saved delivery address, then select it as active.
 * @returns {object} saved address
 */
export function upsertAddress(input, { select = true } = {}) {
  const list = listAddresses()
  const base = normalizeLocation(input)
  const id = base.id || makeId()
  const next = {
    ...base,
    id,
    updatedAt: new Date().toISOString(),
  }

  const idx = list.findIndex((a) => a.id === id)
  const updated =
    idx >= 0
      ? list.map((a, i) => (i === idx ? next : a))
      : [next, ...list].slice(0, 12)

  writeAddresses(updated)
  if (select) saveLocation(next)
  return next
}

export function deleteAddress(id) {
  const list = listAddresses().filter((a) => a.id !== id)
  writeAddresses(list)

  const active = readLocation()
  if (active?.id === id) {
    if (list[0]) saveLocation(list[0])
    else {
      localStorage.removeItem(STORAGE.LOCATION)
      window.dispatchEvent(new CustomEvent(LOCATION_EVENT, { detail: null }))
    }
  }
  return list
}

/** Select a saved address as the active delivery location */
export function selectAddress(idOrAddress) {
  const address =
    typeof idOrAddress === 'string'
      ? getAddressById(idOrAddress)
      : normalizeLocation(idOrAddress)

  if (!address) return null

  // Ensure it exists in the book
  if (address.id && !getAddressById(address.id)) {
    return upsertAddress(address, { select: true })
  }

  return saveLocation(address)
}

/** Map saved location → checkout form fields */
export function locationToCheckoutFields(location) {
  if (!location) {
    return {
      address: '',
      city: '',
      state: '',
      pincode: '',
      name: '',
      phone: '',
      landmark: '',
      addressId: '',
      tag: 'Home',
    }
  }
  const loc = normalizeLocation(location)
  const street = [loc.line1, loc.floor ? `Floor ${loc.floor}` : '', loc.area]
    .filter(Boolean)
    .join(', ')
  return {
    address: street || loc.fullAddress || loc.label || '',
    city: loc.city || '',
    state: loc.state || '',
    pincode: loc.pin || '',
    name: loc.name || '',
    phone: loc.phone || '',
    landmark: loc.landmark || '',
    addressId: loc.id || '',
    tag: loc.tag || 'Home',
  }
}
