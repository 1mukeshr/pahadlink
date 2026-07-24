import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  ChevronRightIcon,
  CloseIcon,
  DropdownIcon,
  HomeIcon,
  HotelIcon,
  LocateIcon,
  MapPinIcon,
  SearchIcon,
  WorkIcon,
} from '../icons'
import { reverseGeocode, searchPlaces, enrichFromPincode } from '../../services/geocode'
import {
  ADDRESS_MIN_LENGTH,
  LOCATION_AREA_MIN,
  LOCATION_LINE_MIN,
  digitsPin,
  isValidIndianMobile,
  isValidPincode,
  streetFromLocation,
} from '../../utils/checkoutValidation'
import {
  ADDRESSES_EVENT,
  ADDRESS_TAGS,
  INDIA_STATES,
  LOCATION_EVENT,
  OPEN_ADDRESS_EVENT,
  deleteAddress,
  listAddresses,
  matchState,
  normalizeLocation,
  readLocation,
  selectAddress,
  splitAddressForForm,
  upsertAddress,
} from '../../utils/locationStorage'

const MOBILE_MQ = '(max-width: 749px)'

const emptyManual = () => ({
  id: null,
  tag: 'Home',
  name: '',
  phone: '',
  line1: '',
  floor: '',
  area: '',
  landmark: '',
  city: '',
  state: 'Uttarakhand',
  pin: '',
  fullAddress: '',
})

const ADDRESS_TAG_META = {
  Home: { Icon: HomeIcon },
  Work: { Icon: WorkIcon },
  Hotel: { Icon: HotelIcon },
  Other: { Icon: MapPinIcon },
}

const placeTitle = (label = '') => label.split(',')[0].trim() || label

const alreadyIn = (haystack, needle) => {
  const h = String(haystack || '').toLowerCase()
  const n = String(needle || '').trim().toLowerCase()
  if (!h || !n) return false
  return h.includes(n)
}

/** City / area / pin line — skips parts already written in line1 */
const addressMetaLine = (item, { omitFrom = '' } = {}) => {
  const skip = omitFrom || item.line1 || ''
  const parts = []
  const push = (value) => {
    const s = String(value || '').trim()
    if (!s) return
    if (alreadyIn(skip, s)) return
    if (parts.some((p) => p.toLowerCase() === s.toLowerCase())) return
    parts.push(s)
  }
  push(item.floor)
  push(item.area)
  push(item.landmark)
  push(item.city)
  push(item.state)
  push(item.pin)
  if (parts.length) return parts.join(', ')
  if (item.fullAddress && !alreadyIn(skip, item.fullAddress)) return item.fullAddress
  if (item.label?.includes(',')) {
    return item.label.split(',').slice(1).join(',').trim()
  }
  return ''
}

const placeSubtitle = (item) => addressMetaLine(item)

const clearPanelTop = (el) => {
  if (!el) return
  el.style.top = ''
  el.style.left = ''
  el.style.right = ''
  el.style.bottom = ''
  el.style.width = ''
  el.style.maxHeight = ''
}

const PincodeBox = () => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState(readLocation)
  const [addresses, setAddresses] = useState(listAddresses)
  const [geoState, setGeoState] = useState('idle')
  const [geoError, setGeoError] = useState('')
  const [remoteResults, setRemoteResults] = useState([])
  const [searchState, setSearchState] = useState('idle')
  const [manualMode, setManualMode] = useState(false)
  const [manual, setManual] = useState(emptyManual)
  const [manualError, setManualError] = useState('')
  const [pinFetchState, setPinFetchState] = useState('idle')
  const [openHint, setOpenHint] = useState('')
  const boxRef = useRef(null)
  const panelRef = useRef(null)
  const inputRef = useRef(null)
  const searchAbort = useRef(null)
  const pinAbort = useRef(null)

  const closePanel = () => {
    setOpen(false)
    setQuery('')
    setGeoState('idle')
    setGeoError('')
    setRemoteResults([])
    setSearchState('idle')
    setManualMode(false)
    setManualError('')
    setOpenHint('')
    setPinFetchState('idle')
    searchAbort.current?.abort()
    pinAbort.current?.abort()
  }

  const refreshAddresses = () => setAddresses(listAddresses())

  useEffect(() => {
    const onRequestOpen = (event) => {
      const message = event?.detail?.message || ''
      setOpenHint(message)
      setOpen(true)
      if (event?.detail?.manual) {
        setManualMode(true)
        setManual(emptyManual())
      }
    }
    window.addEventListener(OPEN_ADDRESS_EVENT, onRequestOpen)
    return () => window.removeEventListener(OPEN_ADDRESS_EVENT, onRequestOpen)
  }, [])

  const commitSelect = (raw) => {
    const next = selectAddress(raw)
    setLocation(next)
    refreshAddresses()
    closePanel()
  }

  const commitSave = (raw, { close = true } = {}) => {
    const next = upsertAddress(raw, { select: true })
    setLocation(next)
    refreshAddresses()
    setManualMode(false)
    setManual(emptyManual())
    if (close) closePanel()
    return next
  }

  useEffect(() => {
    const syncLoc = (e) => setLocation(e.detail || readLocation())
    const syncAddr = (e) => setAddresses(e.detail || listAddresses())
    window.addEventListener(LOCATION_EVENT, syncLoc)
    window.addEventListener(ADDRESSES_EVENT, syncAddr)
    return () => {
      window.removeEventListener(LOCATION_EVENT, syncLoc)
      window.removeEventListener(ADDRESSES_EVENT, syncAddr)
    }
  }, [])

  // Mobile bottom-sheet (Blinkit-style flow, PahadLink branded)
  useLayoutEffect(() => {
    if (!open) {
      clearPanelTop(panelRef.current)
      return undefined
    }

    const placePanel = () => {
      const panel = panelRef.current
      if (!panel) return

      if (!window.matchMedia(MOBILE_MQ).matches) {
        clearPanelTop(panel)
        panel.style.left = ''
        panel.style.right = ''
        panel.style.bottom = ''
        panel.style.width = ''
        panel.style.maxHeight = ''
        panel.style.top = ''
        return
      }

      panel.style.top = 'auto'
      panel.style.left = '0'
      panel.style.right = '0'
      panel.style.bottom = '0'
      panel.style.width = '100%'
      panel.style.maxHeight = 'min(92vh, 720px)'
    }

    placePanel()
    window.addEventListener('resize', placePanel)
    window.addEventListener('scroll', placePanel, true)
    return () => {
      window.removeEventListener('resize', placePanel)
      window.removeEventListener('scroll', placePanel, true)
      clearPanelTop(panelRef.current)
    }
  }, [open, manualMode, addresses.length])

  useEffect(() => {
    if (!open) return undefined

    const onDocClick = (e) => {
      if (!boxRef.current?.contains(e.target)) closePanel()
    }
    const onKey = (e) => {
      if (e.key === 'Escape') closePanel()
    }

    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('touchstart', onDocClick, { passive: true })
    document.addEventListener('keydown', onKey)
    window.setTimeout(() => {
      if (!manualMode) inputRef.current?.focus()
    }, 60)

    const prev = document.body.style.overflow
    const mobile = window.matchMedia(MOBILE_MQ).matches
    if (mobile) {
      // Lock page scroll while the mobile address sheet is open
      // eslint-disable-next-line react-hooks/immutability -- intentional body scroll lock
      document.body.style.overflow = 'hidden'
      document.body.classList.add('pincode-sheet-open')
    }

    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('touchstart', onDocClick)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      document.body.classList.remove('pincode-sheet-open')
    }
  }, [open, manualMode])

  useEffect(() => {
    if (!open || manualMode) return undefined
    const q = query.trim()
    if (q.length < 2) {
      setRemoteResults([])
      setSearchState('idle')
      return undefined
    }

    setSearchState('loading')
    searchAbort.current?.abort()
    const controller = new AbortController()
    searchAbort.current = controller

    const timer = window.setTimeout(async () => {
      try {
        const hits = await searchPlaces(q, { signal: controller.signal })
        if (!controller.signal.aborted) {
          setRemoteResults(hits)
          setSearchState('idle')
        }
      } catch {
        if (!controller.signal.aborted) {
          setRemoteResults([])
          setSearchState('error')
        }
      }
    }, 320)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query, open, manualMode])

  const showSearchResults = query.trim().length >= 2
  const listItems = showSearchResults ? remoteResults : []

  const fetchManualFromPin = async (rawPin, current = manual) => {
    const pin = String(rawPin || '').replace(/\D/g, '').slice(0, 6)
    if (!/^\d{6}$/.test(pin)) {
      setPinFetchState('idle')
      return
    }

    pinAbort.current?.abort()
    const controller = new AbortController()
    pinAbort.current = controller
    setPinFetchState('loading')
    setManualError('')

    try {
      const filled = await enrichFromPincode(
        {
          pin,
          line1: current.line1,
          area: current.area,
          city: current.city,
          state: current.state,
        },
        { signal: controller.signal }
      )
      if (controller.signal.aborted) return

      if (!filled.city && !filled.state && !filled.area) {
        setPinFetchState('error')
        setManualError('No address found for this pincode')
        return
      }

      setManual((prev) => {
        const merged = splitAddressForForm({
          ...prev,
          pin,
          area: prev.area.trim() || filled.area || '',
          city: filled.city || prev.city,
          state: matchState(filled.state) || prev.state || 'Uttarakhand',
          line1:
            prev.line1.trim().length >= 3
              ? prev.line1
              : filled.line1 || prev.line1,
          fullAddress: filled.fullAddress || prev.fullAddress,
        })
        return {
          ...prev,
          pin,
          line1: merged.line1 || prev.line1,
          area: merged.area || prev.area,
          city: merged.city || prev.city,
          state: merged.state || prev.state,
          fullAddress: merged.fullAddress || prev.fullAddress,
        }
      })
      setPinFetchState('done')
    } catch (err) {
      if (err?.name === 'AbortError') return
      setPinFetchState('error')
      setManualError('Could not fetch address for this pincode')
    }
  }

  const openManual = (seed = {}) => {
    const split = splitAddressForForm(seed)
    const next = {
      ...emptyManual(),
      id: seed.id || null,
      tag: ADDRESS_TAGS.includes(seed.tag || split.tag)
        ? seed.tag || split.tag
        : 'Home',
      name: split.name || seed.name || '',
      phone: split.phone || seed.phone || '',
      line1: split.line1 || '',
      floor: split.floor || '',
      area: split.area || '',
      landmark: split.landmark || '',
      city: split.city || '',
      state: matchState(split.state) || split.state || 'Uttarakhand',
      pin: split.pin || '',
      fullAddress: split.fullAddress || '',
    }
    setManual(next)
    setManualError('')
    setPinFetchState('idle')
    setManualMode(true)
    if (/^\d{6}$/.test(next.pin) && (!next.city || !next.state || !next.area)) {
      void fetchManualFromPin(next.pin, next)
    }
  }

  const selectPlace = async (item) => {
    setSearchState('loading')
    try {
      let place = item
      const thin =
        !item.pin ||
        !item.city ||
        !item.fullAddress ||
        String(item.fullAddress).split(',').length < 3
      if (thin && item.lat != null && item.lng != null) {
        place = await reverseGeocode(item.lat, item.lng)
        // Keep short place name as house prefix only — never dump full search text
        const head = String(item.line1 || item.label || '')
          .split(',')[0]
          .trim()
        if (
          head &&
          head.length <= 48 &&
          place.line1 &&
          !place.line1.toLowerCase().includes(head.toLowerCase())
        ) {
          place = {
            ...place,
            line1: `${head}, ${String(place.line1).split(',')[0].trim()}`,
          }
        }
      } else if (item.pin && (!item.city || !item.state)) {
        place = await enrichFromPincode(item)
      }
      openManual({
        ...place,
        id: null,
        tag: 'Home',
      })
    } catch {
      openManual({
        ...item,
        id: null,
        tag: 'Home',
      })
    } finally {
      setSearchState('idle')
    }
  }

  const onSearchSubmit = (e) => {
    e.preventDefault()
    if (listItems[0]) {
      selectPlace(listItems[0])
      return
    }
    const q = query.trim()
    if (!q) return
    openManual({
      line1: /^\d{6}$/.test(q) ? '' : q,
      pin: /^\d{6}$/.test(q) ? q : '',
    })
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoState('error')
      setGeoError('Location is not supported on this device.')
      return
    }

    if (
      typeof window !== 'undefined' &&
      !window.isSecureContext &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      setGeoState('error')
      setGeoError('Location needs HTTPS. Use search or add address manually.')
      return
    }

    setGeoState('loading')
    setGeoError('')

    const readPosition = (options) =>
      new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options)
      })

    ;(async () => {
      try {
        let pos
        try {
          pos = await readPosition({
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 60000,
          })
        } catch {
          pos = await readPosition({
            enableHighAccuracy: false,
            timeout: 20000,
            maximumAge: 120000,
          })
        }

        const { latitude, longitude } = pos.coords
        const place = await reverseGeocode(latitude, longitude)
        const book = listAddresses()
        const existingGps = book.find((a) => a.source === 'gps')
        const hasHome = book.some(
          (a) => a.tag === 'Home' && a.source !== 'gps'
        )

        const seed = {
          ...place,
          id: existingGps?.id || null,
          tag: existingGps?.tag || (hasHome ? 'Other' : 'Home'),
          name: existingGps?.name || '',
          phone: existingGps?.phone || '',
          state: matchState(place.state) || existingGps?.state || '',
          source: 'gps',
        }
        const split = splitAddressForForm(seed)
        const houseOk =
          String(split.line1 || '').trim().length >= LOCATION_LINE_MIN ||
          String(split.area || '').trim().length >= LOCATION_AREA_MIN
        const usable =
          houseOk &&
          split.city &&
          split.state &&
          isValidPincode(split.pin) &&
          streetFromLocation(split).length >= ADDRESS_MIN_LENGTH &&
          split.line1 !== 'Current location'

        if (usable) {
          commitSave(
            {
              ...split,
              id: existingGps?.id || null,
              tag: seed.tag,
              name: seed.name,
              phone: seed.phone,
              source: 'gps',
              fullAddress:
                split.fullAddress ||
                [split.line1, split.area, split.city, split.state, split.pin]
                  .filter(Boolean)
                  .join(', '),
            },
            { close: false }
          )
          setQuery('')
          setRemoteResults([])
          setGeoState('idle')
          setGeoError('')
          return
        }

        // Incomplete — open form so customer can finish required fields
        openManual({
          ...split,
          id: existingGps?.id || null,
          tag: seed.tag,
          name: seed.name,
          phone: seed.phone,
          source: 'gps',
        })
        setGeoState('idle')
        setGeoError(
          'Location found — add house/area details if needed, then save. Mobile number is asked at checkout.'
        )
      } catch (err) {
        if (err?.code === 1 || err?.code === err?.PERMISSION_DENIED) {
          setGeoState('denied')
          setGeoError(
            'Location permission denied. Allow location or search manually.'
          )
        } else if (err?.code === 3 || err?.code === err?.TIMEOUT) {
          setGeoState('error')
          setGeoError('Location timed out. Try again or search by area/pincode.')
        } else {
          setGeoState('error')
          setGeoError('Could not fetch your location. Try searching instead.')
        }
      }
    })()
  }

  const saveManual = (e) => {
    e.preventDefault()
    const line1 = manual.line1.trim()
    const floor = manual.floor.trim()
    const area = manual.area.trim()
    const landmark = manual.landmark.trim()
    const city = manual.city.trim()
    const pin = digitsPin(manual.pin)
    const phone = String(manual.phone || '')
      .replace(/\D/g, '')
      .slice(0, 10)
    const name = manual.name.trim()
    const state = String(manual.state || '').trim()
    const street = streetFromLocation({ line1, floor, area })

    if (!manual.tag || !ADDRESS_TAGS.includes(manual.tag)) {
      setManualError('Choose how to save this address')
      return
    }
    if (line1.length < LOCATION_LINE_MIN) {
      setManualError('Enter flat / house no / building name')
      return
    }
    if (area.length < LOCATION_AREA_MIN) {
      setManualError('Enter area / sector / locality')
      return
    }
    if (street.length < ADDRESS_MIN_LENGTH) {
      setManualError('Enter a fuller house and area address')
      return
    }
    if (!name) {
      setManualError('Enter your name')
      return
    }
    if (!city) {
      setManualError('City is required')
      return
    }
    if (!state) {
      setManualError('State is required')
      return
    }
    if (!isValidPincode(pin)) {
      setManualError('Enter a valid 6-digit pincode')
      return
    }
    if (phone && !isValidIndianMobile(phone)) {
      setManualError('Enter a valid 10-digit mobile, or leave blank for checkout')
      return
    }

    commitSave({
      id: manual.id,
      tag: manual.tag,
      name,
      phone,
      line1,
      floor,
      area,
      landmark,
      city,
      state,
      pin,
      fullAddress: [line1, floor, area, landmark, city, state, pin]
        .filter(Boolean)
        .join(', '),
      source: manual.id ? 'edit' : 'manual',
    })
  }

  const setManualField = (key) => (e) => {
    const value = e.target.value
    setManual((prev) => ({ ...prev, [key]: value }))
    if (manualError) setManualError('')
  }

  const onEditAddress = (addr, e) => {
    e.stopPropagation()
    const normalized = normalizeLocation(addr)
    openManual(normalized)
  }

  const onDeleteAddress = (addr, e) => {
    e.stopPropagation()
    if (!window.confirm(`Remove ${addr.tag || 'this'} address?`)) return
    deleteAddress(addr.id)
    refreshAddresses()
    setLocation(readLocation())
  }

  const displayLabel =
    location?.label ||
    location?.fullAddress ||
    (location?.pin ? `Pincode ${location.pin}` : 'Select location')

  const displayArea =
    location?.area ||
    location?.city ||
    (location?.pin ? `PIN ${location.pin}` : '')

  const editing = Boolean(manual.id)
  const hasLocation = Boolean(
    location?.line1 || location?.fullAddress || location?.pin
  )

  return (
    <div className={`pincode-box${open ? ' is-open' : ''}`} ref={boxRef}>
      <button
        type="button"
        className="pincode-trigger"
        onClick={() => (open ? closePanel() : setOpen(true))}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <MapPinIcon size={18} className="pincode-trigger-icon" />
        <span className="pincode-trigger-text">
          <span className="pincode-label">
            <span className="pincode-label__full">
              {hasLocation ? 'Delivering to' : 'Where to deliver?'}
            </span>
            <span className="pincode-label__short">
              {hasLocation ? 'Deliver to' : 'Location'}
            </span>
          </span>
          <span className="pincode-value-row">
            <span className="pincode-value">
              {hasLocation
                ? [location?.line1 || location?.label || displayLabel, displayArea]
                    .filter(Boolean)
                    .join(', ')
                : 'Select your location'}
            </span>
            <DropdownIcon
              size={16}
              className={`pincode-trigger-chevron${open ? ' pincode-trigger-chevron--open' : ''}`}
            />
          </span>
        </span>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="pincode-backdrop"
            aria-label="Close location picker"
            onClick={closePanel}
          />
          <div
            className={`pincode-panel${manualMode ? ' pincode-panel--manual' : ''}`}
            ref={panelRef}
            role="dialog"
            aria-label={
              manualMode ? 'Enter complete address' : 'Select your location'
            }
          >
            <div className="pincode-panel__handle" aria-hidden="true" />
            <header className="pincode-panel__head">
              <div className="pincode-panel__head-text">
                <h2>
                  {manualMode
                    ? editing
                      ? 'Edit address details'
                      : 'Complete your address'
                    : 'Select your location'}
                </h2>
                {!manualMode && openHint ? (
                  <p className="pincode-panel__hint" role="status">
                    {openHint}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                className="pincode-panel__close"
                aria-label="Close"
                onClick={closePanel}
              >
                <CloseIcon size={16} />
              </button>
            </header>

            <div className="pincode-panel__body">
              {manualMode ? (
              <form className="pincode-manual" onSubmit={saveManual} noValidate>
                <button
                  type="button"
                  className="pincode-manual__back"
                  onClick={() => setManualMode(false)}
                >
                  ← Change location
                </button>

                <div className="pincode-manual__save-as">
                  <p className="pincode-manual__label">
                    Save address as <em>*</em>
                  </p>
                  <div
                    className="pincode-manual__chips"
                    role="group"
                    aria-label="Save address as"
                  >
                    {ADDRESS_TAGS.map((tag) => {
                      const { Icon } = ADDRESS_TAG_META[tag]
                      const active = manual.tag === tag
                      return (
                        <button
                          key={tag}
                          type="button"
                          className={`pincode-manual__chip${active ? ' is-active' : ''}`}
                          aria-pressed={active}
                          onClick={() =>
                            setManual((p) => ({ ...p, tag }))
                          }
                        >
                          <Icon size={14} className="pincode-manual__chip-icon" />
                          <span>{tag}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="pincode-manual__fields">
                  <div className="pincode-manual__row pincode-manual__row--house">
                    <label className="pincode-float">
                      <input
                        value={manual.line1}
                        onChange={setManualField('line1')}
                        placeholder=" "
                        autoFocus
                        required
                        autoComplete="address-line1"
                      />
                      <span>
                        Flat / House / Building <em>*</em>
                      </span>
                    </label>

                    <label className="pincode-float">
                      <input
                        value={manual.floor}
                        onChange={setManualField('floor')}
                        placeholder=" "
                        autoComplete="off"
                      />
                      <span>Floor</span>
                    </label>
                  </div>

                  <label className="pincode-float">
                    <input
                      value={manual.area}
                      onChange={setManualField('area')}
                      placeholder=" "
                      required
                      autoComplete="address-level2"
                    />
                    <span>
                      Area / Sector / Locality <em>*</em>
                    </span>
                  </label>

                  <label className="pincode-float">
                    <input
                      value={manual.landmark}
                      onChange={setManualField('landmark')}
                      placeholder=" "
                      autoComplete="off"
                    />
                    <span>Nearby landmark</span>
                  </label>

                  <div className="pincode-manual__row">
                    <label className="pincode-float">
                      <input
                        value={manual.city}
                        onChange={setManualField('city')}
                        placeholder=" "
                        required
                        autoComplete="address-level2"
                      />
                      <span>
                        City <em>*</em>
                      </span>
                    </label>

                    <label className="pincode-float">
                      <input
                        value={manual.pin}
                        onChange={(e) => {
                          const pin = e.target.value
                            .replace(/\D/g, '')
                            .slice(0, 6)
                          setManual((p) => ({ ...p, pin }))
                          if (manualError) setManualError('')
                          if (pin.length === 6) {
                            fetchManualFromPin(pin, { ...manual, pin })
                          } else {
                            setPinFetchState('idle')
                          }
                        }}
                        onBlur={() => {
                          if (manual.pin.length === 6) {
                            fetchManualFromPin(manual.pin)
                          }
                        }}
                        placeholder=" "
                        inputMode="numeric"
                        required
                        autoComplete="postal-code"
                      />
                      <span>
                        Pincode <em>*</em>
                        {pinFetchState === 'loading' ? ' · …' : ''}
                      </span>
                    </label>
                  </div>

                  <label className="pincode-float">
                    <select
                      value={manual.state}
                      onChange={setManualField('state')}
                    >
                      {INDIA_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <span>State</span>
                  </label>

                  <p className="pincode-manual__details-lead">Delivery contact</p>

                  <div className="pincode-manual__row">
                    <label className="pincode-float">
                      <input
                        value={manual.name}
                        onChange={setManualField('name')}
                        placeholder=" "
                        required
                        autoComplete="name"
                      />
                      <span>
                        Your name <em>*</em>
                      </span>
                    </label>

                    <label className="pincode-float">
                      <input
                        value={manual.phone}
                        onChange={(e) => {
                          setManual((p) => ({
                            ...p,
                            phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                          }))
                          if (manualError) setManualError('')
                        }}
                        placeholder=" "
                        inputMode="tel"
                        autoComplete="tel"
                        maxLength={10}
                      />
                      <span>Mobile (optional)</span>
                    </label>
                  </div>
                </div>

                {manualError && (
                  <p className="pincode-manual__error" role="alert">
                    {manualError}
                  </p>
                )}

                <button type="submit" className="pincode-manual__save">
                  {editing ? 'Update address' : 'Save address & deliver here'}
                </button>
              </form>
            ) : (
              <>
                <form className="pincode-search" onSubmit={onSearchSubmit}>
                  <SearchIcon size={16} className="pincode-search__icon" />
                  <input
                    ref={inputRef}
                    type="search"
                    inputMode="search"
                    enterKeyHint="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for area, street or apartment"
                    aria-label="Search for area, street or apartment"
                    autoComplete="off"
                  />
                  {query.trim() && (
                    <button
                      type="button"
                      className="pincode-search__clear"
                      aria-label="Clear search"
                      onClick={() => setQuery('')}
                    >
                      <CloseIcon size={14} />
                    </button>
                  )}
                </form>

                <button
                  type="button"
                  className={`pincode-gps${geoState === 'loading' ? ' is-loading' : ''}`}
                  onClick={useCurrentLocation}
                  disabled={geoState === 'loading'}
                >
                  <span className="pincode-gps__icon" aria-hidden="true">
                    <LocateIcon size={18} />
                  </span>
                  <span className="pincode-gps__text">
                    <strong>
                      {geoState === 'loading'
                        ? 'Detecting your location…'
                        : 'Use current location'}
                    </strong>
                    <span className="pincode-gps__details">
                      {geoState === 'loading'
                        ? 'Hang on — finding your address'
                        : 'Using GPS for faster delivery'}
                    </span>
                  </span>
                  <ChevronRightIcon size={16} className="pincode-gps__chevron" />
                </button>

                {geoError && <p className="pincode-gps__error">{geoError}</p>}

                {addresses.length > 0 && !showSearchResults && (
                  <section className="pincode-section">
                    <p className="pincode-section__label">Your saved addresses</p>
                    <ul className="pincode-results pincode-saved" role="listbox">
                      {addresses.map((addr) => {
                        const active = location?.id === addr.id
                        const TagIcon =
                          ADDRESS_TAG_META[addr.tag]?.Icon || MapPinIcon
                        const headline =
                          addr.line1 ||
                          placeTitle(addr.label) ||
                          'Saved address'
                        const detail = [
                          addr.floor ? `Floor ${addr.floor}` : '',
                          addr.area,
                          addr.landmark,
                          [addr.city, addr.pin].filter(Boolean).join(' - '),
                        ]
                          .filter(Boolean)
                          .join(', ')
                        return (
                          <li key={addr.id}>
                            <article
                              className={`pincode-saved__card${active ? ' is-active' : ''}`}
                            >
                              <button
                                type="button"
                                className="pincode-saved__select"
                                onClick={() => commitSelect(addr)}
                                aria-pressed={active}
                              >
                                <span
                                  className="pincode-saved__icon"
                                  aria-hidden="true"
                                >
                                  <TagIcon size={18} />
                                </span>

                                <span className="pincode-saved__copy">
                                  <span className="pincode-saved__name">
                                    {addr.tag || 'Other'}
                                  </span>
                                  <span className="pincode-saved__address">
                                    <span className="pincode-saved__line">
                                      {headline}
                                    </span>
                                    {detail ? (
                                      <span className="pincode-saved__meta">
                                        {`, ${detail}`}
                                      </span>
                                    ) : null}
                                  </span>
                                </span>
                              </button>

                              <div className="pincode-saved__actions">
                                <button
                                  type="button"
                                  onClick={(e) => onEditAddress(addr, e)}
                                >
                                  Edit
                                </button>
                                <span className="pincode-saved__dot" aria-hidden="true">
                                  ·
                                </span>
                                <button
                                  type="button"
                                  className="is-danger"
                                  onClick={(e) => onDeleteAddress(addr, e)}
                                >
                                  Delete
                                </button>
                              </div>
                            </article>
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                )}

                {showSearchResults && (
                  <section className="pincode-section">
                    <p className="pincode-section__label">
                      {searchState === 'loading'
                        ? 'Searching…'
                        : listItems.length
                          ? 'Results'
                          : 'No results'}
                    </p>

                    {listItems.length > 0 ? (
                      <ul className="pincode-results" role="listbox">
                        {listItems.map((item, index) => (
                          <li key={`${item.pin || 'x'}-${item.label}-${index}`}>
                            <button
                              type="button"
                              className="pincode-results__item"
                              onClick={() => selectPlace(item)}
                            >
                              <MapPinIcon size={16} />
                              <span>
                                <strong>
                                  {item.line1 || placeTitle(item.label)}
                                </strong>
                                <em>
                                  {item.fullAddress &&
                                  item.fullAddress !== item.line1
                                    ? addressMetaLine(item, {
                                        omitFrom: item.line1,
                                      }) || item.fullAddress
                                    : placeSubtitle(item) || item.fullAddress}
                                </em>
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      searchState !== 'loading' && (
                        <p className="pincode-empty">
                          No match.{' '}
                          <button
                            type="button"
                            className="pincode-empty__link"
                            onClick={() =>
                              openManual({
                                line1: query.trim(),
                                pin: /^\d{6}$/.test(query.trim())
                                  ? query.trim()
                                  : '',
                              })
                            }
                          >
                            Enter manually
                          </button>
                        </p>
                      )
                    )}
                  </section>
                )}
              </>
            )}
          </div>

          {!manualMode ? (
                <div className="pincode-panel__footer">
              <button
                type="button"
                className="pincode-manual-link"
                onClick={() => openManual()}
              >
                <span aria-hidden="true">+</span>
                Add a new PahadLink address
              </button>
            </div>
          ) : null}
          </div>
        </>
      )}
    </div>
  )
}

export default PincodeBox
