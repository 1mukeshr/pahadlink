import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronRightIcon,
  CloseIcon,
  DropdownIcon,
  LocateIcon,
  MapPinIcon,
  SearchIcon,
} from '../icons'
import { STORAGE } from '../../config'

const SUGGESTED = [
  { label: 'Dehradun, Uttarakhand', pin: '248001', area: 'Uttarakhand' },
  { label: 'Mussoorie, Uttarakhand', pin: '248179', area: 'Uttarakhand' },
  { label: 'Nainital, Uttarakhand', pin: '263001', area: 'Uttarakhand' },
  { label: 'Shimla, Himachal Pradesh', pin: '171001', area: 'Himachal Pradesh' },
  { label: 'Delhi', pin: '110001', area: 'Delhi NCR' },
  { label: 'Noida, Uttar Pradesh', pin: '201301', area: 'Delhi NCR' },
  { label: 'Gurgaon, Haryana', pin: '122001', area: 'Delhi NCR' },
  { label: 'Chandigarh', pin: '160017', area: 'Chandigarh' },
  { label: 'Jaipur, Rajasthan', pin: '302001', area: 'Rajasthan' },
  { label: 'Mumbai, Maharashtra', pin: '400001', area: 'Maharashtra' },
  { label: 'Bengaluru, Karnataka', pin: '560001', area: 'Karnataka' },
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

const placeTitle = (label = '') => label.split(',')[0].trim() || label

const placeSubtitle = (item) => {
  const parts = []
  if (item.area) parts.push(item.area)
  if (item.pin) parts.push(item.pin)
  if (!parts.length && item.label?.includes(',')) {
    return item.label.split(',').slice(1).join(',').trim()
  }
  return parts.join(' · ')
}

const clearPanelTop = (el) => {
  if (!el) return
  el.style.top = ''
  el.style.maxHeight = ''
}

const PincodeBox = () => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState(readSaved)
  const [geoState, setGeoState] = useState('idle') // idle | loading | error | denied
  const [geoError, setGeoError] = useState('')
  const boxRef = useRef(null)
  const panelRef = useRef(null)
  const inputRef = useRef(null)

  const closePanel = () => {
    setOpen(false)
    setQuery('')
    setGeoState('idle')
    setGeoError('')
  }

  // Keep mobile panel under the trigger and inside the viewport
  useLayoutEffect(() => {
    if (!open) {
      clearPanelTop(panelRef.current)
      return undefined
    }

    const placePanel = () => {
      const box = boxRef.current
      const panel = panelRef.current
      if (!box || !panel) return

      if (!window.matchMedia(MOBILE_MQ).matches) {
        clearPanelTop(panel)
        return
      }

      const rect = box.getBoundingClientRect()
      const pad = 10
      const top = Math.round(rect.bottom + 8)
      const maxHeight = Math.max(200, Math.round(window.innerHeight - top - pad))

      panel.style.top = `${top}px`
      panel.style.maxHeight = `${maxHeight}px`
    }

    placePanel()
    window.addEventListener('resize', placePanel)
    window.addEventListener('scroll', placePanel, true)
    return () => {
      window.removeEventListener('resize', placePanel)
      window.removeEventListener('scroll', placePanel, true)
      clearPanelTop(panelRef.current)
    }
  }, [open])

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
    window.setTimeout(() => inputRef.current?.focus(), 60)

    const prev = document.body.style.overflow
    const mobile = window.matchMedia(MOBILE_MQ).matches
    if (mobile) {
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
  }, [open])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return SUGGESTED.filter(
      (item) =>
        item.label.toLowerCase().includes(q) || item.pin.includes(q)
    ).slice(0, 8)
  }, [query])

  const saveLocation = (next) => {
    setLocation(next)
    localStorage.setItem(STORAGE.LOCATION, JSON.stringify(next))
    closePanel()
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

  const showSearchResults = query.trim().length > 0
  const listItems = showSearchResults ? results : SUGGESTED.slice(0, 6)

  return (
    <div className={`pincode-box${open ? ' is-open' : ''}`} ref={boxRef}>
      <button
        type="button"
        className="pincode-trigger"
        onClick={() => (open ? closePanel() : setOpen(true))}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <MapPinIcon size={18} className="pincode-trigger-icon" />
        <span className="pincode-trigger-text">
          <span className="pincode-label">
            <span className="pincode-label__full">Delivery in 2-3 days</span>
            <span className="pincode-label__short">Delivery</span>
          </span>
          <span className="pincode-value-row">
            <span className="pincode-value">{displayLabel}</span>
            <DropdownIcon
              size={16}
              className={`pincode-trigger-chevron${open ? ' pincode-trigger-chevron--open' : ''}`}
            />
          </span>
        </span>
      </button>

      {open && (
        <div
          className="pincode-panel"
          ref={panelRef}
          role="dialog"
          aria-label="Select your location"
        >
          <header className="pincode-panel__head">
            <h2>Select your location</h2>
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
            <form className="pincode-search" onSubmit={onSearchSubmit}>
              <SearchIcon size={16} className="pincode-search__icon" />
              <input
                ref={inputRef}
                type="search"
                inputMode="search"
                enterKeyHint="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search area or pincode"
                aria-label="Search for area or pincode"
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
              className="pincode-gps"
              onClick={useCurrentLocation}
              disabled={geoState === 'loading'}
            >
              <span className="pincode-gps__icon" aria-hidden="true">
                <LocateIcon size={18} />
              </span>
              <span className="pincode-gps__text">
                <strong>
                  {geoState === 'loading' ? 'Detecting location...' : 'Use current location'}
                </strong>
                <span>Using GPS</span>
              </span>
              <ChevronRightIcon size={16} className="pincode-gps__chevron" />
            </button>

            {geoError && <p className="pincode-gps__error">{geoError}</p>}

            {location && !showSearchResults && (
              <section className="pincode-section">
                <p className="pincode-section__label">Saved address</p>
                <ul className="pincode-results" role="listbox">
                  <li>
                    <button
                      type="button"
                      className="pincode-results__item is-active"
                      onClick={() =>
                        saveLocation({
                          ...location,
                          source: location.source || 'saved',
                        })
                      }
                    >
                      <MapPinIcon size={16} />
                      <span>
                        <strong>{placeTitle(location.label)}</strong>
                        <em>
                          {[location.label, location.pin].filter(Boolean).join(' · ')}
                        </em>
                      </span>
                    </button>
                  </li>
                </ul>
              </section>
            )}

            <section className="pincode-section">
              <p className="pincode-section__label">
                {showSearchResults
                  ? results.length
                    ? 'Search results'
                    : 'No results found'
                  : 'Popular places'}
              </p>

              {listItems.length > 0 ? (
                <ul className="pincode-results" role="listbox">
                  {listItems.map((item) => (
                    <li key={`${item.pin}-${item.label}`}>
                      <button
                        type="button"
                        className="pincode-results__item"
                        onClick={() => selectSuggestion(item)}
                      >
                        <MapPinIcon size={16} />
                        <span>
                          <strong>{placeTitle(item.label)}</strong>
                          <em>{placeSubtitle(item) || item.label}</em>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                showSearchResults && (
                  <p className="pincode-empty">
                    Try a city name or 6-digit pincode
                  </p>
                )
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  )
}

export default PincodeBox
