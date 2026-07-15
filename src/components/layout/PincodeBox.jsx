import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ChevronDownIcon,
  CloseIcon,
  LocateIcon,
  MapPinIcon,
  SearchIcon,
} from '../icons'
import { STORAGE } from '../../config'

const SUGGESTED = [
  { label: 'Dehradun, Uttarakhand', pin: '248001' },
  { label: 'Mussoorie, Uttarakhand', pin: '248179' },
  { label: 'Nainital, Uttarakhand', pin: '263001' },
  { label: 'Shimla, Himachal Pradesh', pin: '171001' },
  { label: 'Delhi', pin: '110001' },
  { label: 'Noida, Uttar Pradesh', pin: '201301' },
  { label: 'Gurgaon, Haryana', pin: '122001' },
  { label: 'Chandigarh', pin: '160017' },
  { label: 'Jaipur, Rajasthan', pin: '302001' },
  { label: 'Mumbai, Maharashtra', pin: '400001' },
  { label: 'Bengaluru, Karnataka', pin: '560001' },
]

const MOBILE_MQ = '(max-width: 749px)'

const readSaved = () => {
  try {
    const raw = localStorage.getItem(STORAGE.LOCATION)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const PincodeBox = () => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState(readSaved)
  const [geoState, setGeoState] = useState('idle') // idle | loading | error | denied
  const [geoError, setGeoError] = useState('')
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_MQ).matches : false
  )
  const boxRef = useRef(null)
  const panelRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ)
    const onChange = () => setIsMobile(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const onDocClick = (e) => {
      const inTrigger = boxRef.current?.contains(e.target)
      const inPanel = panelRef.current?.contains(e.target)
      if (!inTrigger && !inPanel) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', onDocClick)
      document.addEventListener('keydown', onKey)
      window.setTimeout(() => inputRef.current?.focus(), 60)
    }
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.body.classList.add('pincode-sheet-open')
    return () => {
      document.body.style.overflow = prev
      document.body.classList.remove('pincode-sheet-open')
    }
  }, [open])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return SUGGESTED.filter(
      (item) =>
        item.label.toLowerCase().includes(q) || item.pin.includes(q)
    ).slice(0, 6)
  }, [query])

  const saveLocation = (next) => {
    setLocation(next)
    localStorage.setItem(STORAGE.LOCATION, JSON.stringify(next))
    setOpen(false)
    setQuery('')
    setGeoState('idle')
    setGeoError('')
  }

  const selectSuggestion = (item) => {
    saveLocation({
      label: item.label,
      pin: item.pin,
      source: 'search',
    })
  }

  const onSearchSubmit = (e) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return

    if (/^\d{6}$/.test(q)) {
      saveLocation({
        label: `Pincode ${q}`,
        pin: q,
        source: 'pincode',
      })
      return
    }

    if (results[0]) {
      selectSuggestion(results[0])
      return
    }

    saveLocation({
      label: q,
      pin: '',
      source: 'custom',
    })
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoState('error')
      setGeoError('Location is not supported on this device.')
      return
    }

    setGeoState('loading')
    setGeoError('')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        let label = 'Current location'
        let pin = ''

        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          const res = await fetch(url, {
            headers: { Accept: 'application/json' },
          })
          if (res.ok) {
            const data = await res.json()
            const a = data.address || {}
            const city =
              a.city || a.town || a.village || a.suburb || a.county || ''
            const state = a.state || ''
            pin = a.postcode || ''
            label = [city, state].filter(Boolean).join(', ') || data.display_name || label
          }
        } catch {
          // keep fallback label
        }

        saveLocation({
          label,
          pin,
          source: 'gps',
          lat: latitude,
          lng: longitude,
        })
        setGeoState('idle')
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoState('denied')
          setGeoError('Location permission denied. Search an address instead.')
        } else {
          setGeoState('error')
          setGeoError('Could not fetch location. Try searching instead.')
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    )
  }

  const displayLabel = location?.label
    || (location?.pin ? `Pincode ${location.pin}` : 'Select location')

  const panel = (
    <div
      className="pincode-panel"
      ref={panelRef}
      role="dialog"
      aria-modal={isMobile ? true : undefined}
      aria-label="Your location"
    >
      <header className="pincode-panel__head">
        <div className="pincode-panel__handle" aria-hidden="true" />
        <h2>Your Location</h2>
        <button
          type="button"
          className="pincode-panel__close"
          aria-label="Close"
          onClick={() => setOpen(false)}
        >
          <CloseIcon size={16} />
        </button>
      </header>

      <div className="pincode-panel__body">
        <form className="pincode-search" onSubmit={onSearchSubmit}>
          <SearchIcon size={16} className="pincode-search__icon" />
          <input
            ref={inputRef}
            type="search"
            inputMode="search"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city or 6-digit pincode"
            aria-label="Search a new address"
            autoComplete="off"
          />
        </form>

        {results.length > 0 && (
          <ul className="pincode-results" role="listbox">
            {results.map((item) => (
              <li key={`${item.pin}-${item.label}`}>
                <button
                  type="button"
                  onClick={() => selectSuggestion(item)}
                >
                  <MapPinIcon size={15} />
                  <span>
                    <strong>{item.label}</strong>
                    <em>PIN {item.pin}</em>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="pincode-gps">
          <span className="pincode-gps__icon" aria-hidden="true">
            <LocateIcon size={18} />
          </span>
          <div className="pincode-gps__text">
            <strong>Use current location</strong>
            <span>Faster delivery estimates near you</span>
          </div>
          <button
            type="button"
            className="pincode-gps__enable"
            onClick={useCurrentLocation}
            disabled={geoState === 'loading'}
          >
            {geoState === 'loading' ? 'Locating…' : 'Enable'}
          </button>
        </div>

        {geoError && <p className="pincode-gps__error">{geoError}</p>}

        {location && (
          <p className="pincode-selected">
            Delivering to <strong>{location.label}</strong>
            {location.pin ? ` · ${location.pin}` : ''}
          </p>
        )}

        <div className="pincode-map" aria-hidden="true">
          <div className="pincode-map__clouds" />
          <div className="pincode-map__land">
            <span className="pincode-map__pin">
              <MapPinIcon size={28} />
            </span>
          </div>
          <span className="pincode-map__scan" />
        </div>
      </div>
    </div>
  )

  return (
    <div className={`pincode-box${open ? ' is-open' : ''}`} ref={boxRef}>
      <button
        type="button"
        className="pincode-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <MapPinIcon size={20} className="pincode-trigger-icon" />
        <span className="pincode-trigger-text">
          <span className="pincode-label">Delivery in 2-3 days</span>
          <span className="pincode-value">{displayLabel}</span>
        </span>
        <ChevronDownIcon
          size={14}
          className={`pincode-trigger-chevron${open ? ' pincode-trigger-chevron--open' : ''}`}
        />
      </button>

      {open &&
        (isMobile
          ? createPortal(
              <div className="pincode-overlay">
                <button
                  type="button"
                  className="pincode-backdrop"
                  aria-label="Close location picker"
                  onClick={() => setOpen(false)}
                />
                {panel}
              </div>,
              document.body
            )
          : panel)}
    </div>
  )
}

export default PincodeBox
