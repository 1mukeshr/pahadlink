import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { SearchIcon, CloseIcon } from '../icons'
import { ROUTES, productPath, categoryPath } from '../../config'
import {
  getSearchSuggestions,
  searchCategories,
  searchProducts,
} from '../../data/siteData'
import { capitalizeWords } from '../../utils/text'

const SEARCH_PHRASES = [
  'honey, rajma, shawls and more',
  'pahadi rajma from the hills',
  'raw forest honey',
  'bal mithai',
  'woolen shawls & topi',
  'organic millets & dals',
]

const shortName = (name = '') =>
  capitalizeWords(name.split('|')[0].trim() || name)

/**
 * Header search with live product / category suggestions.
 */
const HeaderSearch = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const listId = useId()
  const rootRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [typedPlaceholder, setTypedPlaceholder] = useState('')
  const typingRef = useRef({ phraseIndex: 0, charIndex: 0, deleting: false })
  const deferredQuery = useDeferredValue(query)
  const trimmed = deferredQuery.trim()
  const pauseTyping = open || query.length > 0

  const productHits = useMemo(
    () => (trimmed ? searchProducts(trimmed, { limit: 6 }) : getSearchSuggestions({ limit: 6 })),
    [trimmed]
  )
  const categoryHits = useMemo(
    () => (trimmed ? searchCategories(trimmed, { limit: 3 }) : []),
    [trimmed]
  )

  const flatItems = useMemo(() => {
    const items = []
    categoryHits.forEach((cat) => {
      items.push({
        key: `cat-${cat.id}`,
        type: 'category',
        label: cat.name,
        to: categoryPath(cat.id),
      })
    })
    productHits.forEach((p) => {
      items.push({
        key: `prod-${p.id}`,
        type: 'product',
        label: shortName(p.name),
        product: p,
        to: productPath(p.id),
      })
    })
    if (trimmed) {
      items.push({
        key: `all-${trimmed}`,
        type: 'all',
        label: `Search for “${trimmed}”`,
        to: `${ROUTES.SHOP}?q=${encodeURIComponent(trimmed)}`,
      })
    }
    return items
  }, [categoryHits, productHits, trimmed])

  const showPanel = open && flatItems.length > 0
  const activeOptionId =
    activeIndex >= 0 && flatItems[activeIndex]
      ? `${listId}-opt-${activeIndex}`
      : undefined

  // Reset highlight when results change
  useEffect(() => {
    setActiveIndex(-1)
  }, [trimmed])

  // Close panel on route change
  useEffect(() => {
    setOpen(false)
    setActiveIndex(-1)
  }, [pathname])

  // Keep highlighted option in view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return
    const el = listRef.current.querySelector(`[data-suggest-index="${activeIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  useEffect(() => {
    if (pauseTyping) {
      setTypedPlaceholder('')
      return undefined
    }

    let cancelled = false
    let timer

    const schedule = (fn, delay) => {
      timer = window.setTimeout(() => {
        if (!cancelled) fn()
      }, delay)
    }

    const tick = () => {
      const state = typingRef.current
      const phrase = SEARCH_PHRASES[state.phraseIndex]

      if (!state.deleting) {
        state.charIndex += 1
        setTypedPlaceholder(phrase.slice(0, state.charIndex))

        if (state.charIndex === phrase.length) {
          state.deleting = true
          schedule(tick, 1600)
          return
        }
        schedule(tick, 55)
        return
      }

      state.charIndex -= 1
      setTypedPlaceholder(phrase.slice(0, state.charIndex))

      if (state.charIndex === 0) {
        state.deleting = false
        state.phraseIndex = (state.phraseIndex + 1) % SEARCH_PHRASES.length
        schedule(tick, 320)
        return
      }
      schedule(tick, 28)
    }

    schedule(tick, 400)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [pauseTyping])

  useEffect(() => {
    if (!open) return undefined

    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) {
        setOpen(false)
        setActiveIndex(-1)
      }
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setActiveIndex(-1)
        inputRef.current?.blur()
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const goTo = (to) => {
    setOpen(false)
    setActiveIndex(-1)
    setQuery('')
    navigate(to)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (activeIndex >= 0 && flatItems[activeIndex]) {
      goTo(flatItems[activeIndex].to)
      return
    }
    const q = query.trim()
    goTo(q ? `${ROUTES.SHOP}?q=${encodeURIComponent(q)}` : ROUTES.SHOP)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) {
        setOpen(true)
        setActiveIndex(0)
        return
      }
      if (!flatItems.length) return
      setActiveIndex((i) => (i < flatItems.length - 1 ? i + 1 : 0))
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) {
        setOpen(true)
        setActiveIndex(flatItems.length - 1)
        return
      }
      if (!flatItems.length) return
      setActiveIndex((i) => (i <= 0 ? flatItems.length - 1 : i - 1))
      return
    }

    if (e.key === 'Home' && open && flatItems.length) {
      e.preventDefault()
      setActiveIndex(0)
      return
    }

    if (e.key === 'End' && open && flatItems.length) {
      e.preventDefault()
      setActiveIndex(flatItems.length - 1)
    }
  }

  const firstProductIndex = categoryHits.length
  const showProductLabel = productHits.length > 0
  const showCategoryLabel = trimmed && categoryHits.length > 0

  return (
    <div
      className={`header-search-wrap${open ? ' is-open' : ''}${showPanel ? ' has-panel' : ''}`}
      ref={rootRef}
    >
      <form className="header-search" role="search" onSubmit={handleSubmit}>
        <button type="submit" className="header-search-icon-btn" aria-label="Search">
          <SearchIcon size={18} />
        </button>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={pauseTyping ? 'Search products' : `Search for ${typedPlaceholder}`}
          aria-label="Search products"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          role="combobox"
          className={pauseTyping ? undefined : 'is-typing'}
          autoComplete="off"
          enterKeyHint="search"
        />
        {query && (
          <button
            type="button"
            className="header-search-clear"
            aria-label="Clear search"
            onClick={() => {
              setQuery('')
              setActiveIndex(-1)
              setOpen(true)
              inputRef.current?.focus()
            }}
          >
            <CloseIcon size={14} />
          </button>
        )}
      </form>

      {showPanel && (
        <div
          id={listId}
          className="header-search-suggest"
          role="listbox"
          ref={listRef}
        >
          {showCategoryLabel && (
            <p className="header-search-suggest__label">Categories</p>
          )}

          {flatItems.map((item, index) => {
            const isActive = activeIndex === index
            const common = {
              id: `${listId}-opt-${index}`,
              role: 'option',
              'aria-selected': isActive,
              'data-suggest-index': index,
              className: `header-search-suggest__item header-search-suggest__item--${
                item.type === 'product' ? 'prod' : item.type === 'category' ? 'cat' : 'all'
              }${isActive ? ' is-active' : ''}`,
              onMouseEnter: () => setActiveIndex(index),
              onMouseDown: (e) => e.preventDefault(),
            }

            if (item.type === 'category') {
              return (
                <button
                  key={item.key}
                  type="button"
                  {...common}
                  onClick={() => goTo(item.to)}
                >
                  <SearchIcon size={16} />
                  <span>
                    <strong>{item.label}</strong>
                    <em>Category</em>
                  </span>
                </button>
              )
            }

            if (item.type === 'all') {
              return (
                <button
                  key={item.key}
                  type="button"
                  {...common}
                  onClick={() => goTo(item.to)}
                >
                  <SearchIcon size={16} />
                  <span>
                    <strong>{item.label}</strong>
                    <em>View all results in shop</em>
                  </span>
                </button>
              )
            }

            const p = item.product
            const showLabelBefore =
              showProductLabel && index === firstProductIndex

            return (
              <div key={item.key} className="header-search-suggest__block">
                {showLabelBefore && (
                  <p className="header-search-suggest__label">
                    {trimmed ? 'Products' : 'Popular products'}
                  </p>
                )}
                <Link
                  {...common}
                  to={item.to}
                  onClick={() => {
                    setOpen(false)
                    setActiveIndex(-1)
                    setQuery('')
                  }}
                >
                  <img src={p.image} alt="" width={32} height={32} loading="lazy" />
                  <span>
                    <strong>{item.label}</strong>
                    <em>
                      {p.subcategory}
                      {p.price != null ? ` · ₹${p.price}` : ''}
                    </em>
                  </span>
                </Link>
              </div>
            )
          })}

          {!trimmed && (
            <Link
              className="header-search-suggest__foot"
              to={ROUTES.SHOP}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setOpen(false)
                setActiveIndex(-1)
              }}
            >
              Browse all products
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default HeaderSearch
