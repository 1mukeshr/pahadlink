import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Breadcrumb from '../../components/layout/Breadcrumb'
import FaqSection from '../../components/layout/FaqSection'
import Footer from '../../components/layout/Footer'
import ProductCard from '../../components/products/ProductCard'
import { CloseIcon, SearchIcon, ArrowLeftIcon } from '../../components/icons'
import { ROUTES } from '../../config'
import {
  categoryGroups,
  getAllSizes,
  getPriceBounds,
  getProductMaxPrice,
  getProductMinPrice,
  getProductVariants,
  productMatchesPrice,
  productTabs,
  products,
  scoreProductMatch,
} from '../../data/siteData'

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to high' },
  { value: 'price-desc', label: 'Price: High to low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'discount', label: 'Best discount' },
]

const PRICE_PRESETS = [
  { id: 'under-250', label: 'Under ₹250', min: '', max: '249' },
  { id: '250-499', label: '₹250 - ₹499', min: '250', max: '499' },
  { id: '500-899', label: '₹500 - ₹899', min: '500', max: '899' },
  { id: '900-plus', label: '₹900 & above', min: '900', max: '' },
]

const TAG_LABELS = Object.fromEntries(productTabs.map((t) => [t.id, t.label]))

const discountPct = (p) => {
  const variants = getProductVariants(p)
  return variants.reduce((best, v) => {
    if (v.compareAt <= v.price) return best
    const off = Math.round(((v.compareAt - v.price) / v.compareAt) * 100)
    return Math.max(best, off)
  }, 0)
}

const parseList = (raw) =>
  raw
    ? raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : []

const toggleInList = (list, value) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value]

const FilterCheck = ({
  checked,
  onChange,
  label,
  count,
  name,
  value,
  type = 'checkbox',
}) => (
  <label className={`shop-check${checked ? ' is-checked' : ''}`}>
    <input
      type={type}
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
    />
    <span className="shop-check__box" aria-hidden="true" />
    <span className="shop-check__label">{label}</span>
    {count != null && <span className="shop-check__count">{count}</span>}
  </label>
)

const ShopFilters = ({
  filters,
  bounds,
  allSizes,
  counts,
  onToggleCategory,
  onToggleTag,
  onToggleSize,
  onClearAll,
  onApplyPrice,
  onSelectPricePreset,
  draftMin,
  draftMax,
  setDraftMin,
  setDraftMax,
}) => {
  const activePreset = PRICE_PRESETS.find(
    (p) =>
      String(filters.min || '') === String(p.min) &&
      String(filters.max || '') === String(p.max)
  )

  return (
    <div className="shop-filters">
      <div className="shop-filters__head">
        <div>
          <h2>Filters</h2>
        </div>
        <button type="button" className="shop-filters__clear" onClick={onClearAll}>
          Clear all
        </button>
      </div>

      <section className="shop-filter-block">
        <h3>Category</h3>
        <ul className="shop-filter-checks">
          {categoryGroups.map((group) => {
            const checked = filters.categories.includes(group.id)
            return (
              <li key={group.id}>
                <FilterCheck
                  checked={checked}
                  label={group.name}
                  count={counts.category[group.id] || 0}
                  onChange={() => onToggleCategory(group.id)}
                />
              </li>
            )
          })}
        </ul>
      </section>

      <section className="shop-filter-block">
        <h3>Collection</h3>
        <ul className="shop-filter-checks">
          {productTabs.map((tab) => {
            const checked = filters.tags.includes(tab.id)
            return (
              <li key={tab.id}>
                <FilterCheck
                  checked={checked}
                  label={tab.label}
                  count={counts.tag[tab.id] || 0}
                  onChange={() => onToggleTag(tab.id)}
                />
              </li>
            )
          })}
        </ul>
      </section>

      <section className="shop-filter-block">
        <h3>Size</h3>
        <ul className="shop-filter-checks shop-filter-checks--scroll">
          {allSizes.map((size) => (
            <li key={size}>
              <FilterCheck
                checked={filters.sizes.includes(size)}
                label={size}
                count={counts.size[size] || 0}
                onChange={() => onToggleSize(size)}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="shop-filter-block">
        <h3>Price</h3>
        <ul className="shop-filter-checks">
          {PRICE_PRESETS.map((preset) => {
            const checked = activePreset?.id === preset.id
            return (
              <li key={preset.id}>
                <FilterCheck
                  checked={checked}
                  label={preset.label}
                  onChange={() =>
                    onSelectPricePreset(checked ? null : preset)
                  }
                />
              </li>
            )
          })}
        </ul>

        <div className="shop-price-custom">
          <p className="shop-filter-hint">
            Custom range · ₹{bounds.min} to ₹{bounds.max}
          </p>
          <div className="shop-price-row">
            <label>
              <span>Min</span>
              <input
                type="number"
                min={bounds.min}
                max={bounds.max}
                value={draftMin}
                onChange={(e) => setDraftMin(e.target.value)}
                placeholder={String(bounds.min)}
              />
            </label>
            <span className="shop-price-dash" aria-hidden="true">
              -
            </span>
            <label>
              <span>Max</span>
              <input
                type="number"
                min={bounds.min}
                max={bounds.max}
                value={draftMax}
                onChange={(e) => setDraftMax(e.target.value)}
                placeholder={String(bounds.max)}
              />
            </label>
          </div>
          <button type="button" className="shop-price-apply" onClick={onApplyPrice}>
            Apply
          </button>
        </div>
      </section>
    </div>
  )
}

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [filtering, setFiltering] = useState(false)
  const skipFilterLoader = useRef(true)
  const filterLoaderTimer = useRef(null)
  const bounds = useMemo(() => getPriceBounds(), [])
  const allSizes = useMemo(() => getAllSizes(), [])

  const filters = useMemo(
    () => ({
      q: searchParams.get('q') || '',
      categories: parseList(searchParams.get('category')),
      sub: searchParams.get('sub') || '',
      sizes: parseList(searchParams.get('size')),
      min: searchParams.get('min') || '',
      max: searchParams.get('max') || '',
      tags: parseList(searchParams.get('tag')),
      sort: searchParams.get('sort') || 'featured',
    }),
    [searchParams]
  )

  const [draftMin, setDraftMin] = useState(filters.min)
  const [draftMax, setDraftMax] = useState(filters.max)

  const beginFilterLoading = () => {
    setFiltering(true)
    if (filterLoaderTimer.current) clearTimeout(filterLoaderTimer.current)
    filterLoaderTimer.current = setTimeout(() => {
      setFiltering(false)
      filterLoaderTimer.current = null
    }, 420)
  }

  useEffect(() => {
    setDraftMin(filters.min)
    setDraftMax(filters.max)
  }, [filters.min, filters.max])

  useEffect(() => {
    if (skipFilterLoader.current) {
      skipFilterLoader.current = false
      return undefined
    }
    beginFilterLoading()
    return () => {
      if (filterLoaderTimer.current) clearTimeout(filterLoaderTimer.current)
    }
  }, [searchParams])

  useEffect(
    () => () => {
      if (filterLoaderTimer.current) clearTimeout(filterLoaderTimer.current)
    },
    []
  )

  const activeCategories = useMemo(
    () =>
      filters.categories
        .map((id) => categoryGroups.find((g) => g.id === id))
        .filter(Boolean),
    [filters.categories]
  )

  const setParam = (key, value) => {
    beginFilterLoading()
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value === '' || value == null) next.delete(key)
      else next.set(key, value)
      return next
    }, { replace: true })
  }

  const setParams = (entries) => {
    beginFilterLoading()
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      entries.forEach(([key, value]) => {
        if (value === '' || value == null) next.delete(key)
        else next.set(key, value)
      })
      return next
    }, { replace: true })
  }

  const toggleCategory = (categoryId) => {
    const next = toggleInList(filters.categories, categoryId)
    setParams([
      ['category', next.join(',')],
      ['sub', ''],
    ])
  }

  const toggleTag = (tagId) => {
    const next = toggleInList(filters.tags, tagId)
    setParam('tag', next.join(','))
  }

  const toggleSize = (size) => {
    const next = toggleInList(filters.sizes, size)
    setParam('size', next.join(','))
  }

  const clearAll = () => {
    beginFilterLoading()
    setSearchParams({}, { replace: true })
    setDraftMin('')
    setDraftMax('')
    setMobileOpen(false)
  }

  const applyPrice = () => {
    setParams([
      ['min', draftMin],
      ['max', draftMax],
    ])
  }

  const selectPricePreset = (preset) => {
    if (!preset) {
      setParams([
        ['min', ''],
        ['max', ''],
      ])
      setDraftMin('')
      setDraftMax('')
      return
    }
    setDraftMin(preset.min)
    setDraftMax(preset.max)
    setParams([
      ['min', preset.min],
      ['max', preset.max],
    ])
  }

  const counts = useMemo(() => {
    const category = {}
    const sub = {}
    const tag = {}
    const size = {}

    categoryGroups.forEach((g) => {
      category[g.id] = products.filter((p) => p.categoryId === g.id).length
    })

    products.forEach((p) => {
      sub[p.subcategory] = (sub[p.subcategory] || 0) + 1
      p.tags.forEach((t) => {
        tag[t] = (tag[t] || 0) + 1
      })
      p.sizes.forEach((s) => {
        size[s] = (size[s] || 0) + 1
      })
    })

    return { category, sub, tag, size }
  }, [])

  const list = useMemo(() => {
    let result = [...products]

    if (filters.q) {
      const q = filters.q
      result = result
        .map((p) => ({ p, score: scoreProductMatch(p, q) }))
        .filter((row) => row.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((row) => row.p)
    }

    if (filters.categories.length) {
      result = result.filter((p) => filters.categories.includes(p.categoryId))
    }

    if (filters.sub) {
      result = result.filter((p) => p.subcategory === filters.sub)
    }

    if (filters.sizes.length) {
      result = result.filter((p) =>
        filters.sizes.some((size) => p.sizes.includes(size))
      )
    }

    const min =
      filters.min !== '' && !Number.isNaN(Number(filters.min))
        ? Number(filters.min)
        : null
    const max =
      filters.max !== '' && !Number.isNaN(Number(filters.max))
        ? Number(filters.max)
        : null

    if (min != null || max != null) {
      result = result.filter((p) =>
        productMatchesPrice(p, min, max, filters.sizes)
      )
    }

    if (filters.tags.length) {
      result = result.filter((p) =>
        filters.tags.some((tag) => p.tags.includes(tag))
      )
    }

    switch (filters.sort) {
      case 'price-asc':
        result.sort((a, b) => getProductMinPrice(a) - getProductMinPrice(b))
        break
      case 'price-desc':
        result.sort((a, b) => getProductMaxPrice(b) - getProductMaxPrice(a))
        break
      case 'rating':
        result.sort((a, b) => b.rating - a.rating)
        break
      case 'discount':
        result.sort((a, b) => discountPct(b) - discountPct(a))
        break
      default:
        break
    }

    return result
  }, [filters])

  const chips = useMemo(() => {
    const items = []
    if (filters.q) items.push({ key: 'q', label: `“${filters.q}”` })
    filters.categories.forEach((id) => {
      const group = categoryGroups.find((g) => g.id === id)
      items.push({
        key: `category:${id}`,
        label: group?.name || id,
      })
    })
    if (filters.sub) items.push({ key: 'sub', label: filters.sub })
    filters.tags.forEach((tag) => {
      items.push({ key: `tag:${tag}`, label: TAG_LABELS[tag] || tag })
    })
    filters.sizes.forEach((size) => {
      items.push({ key: `size:${size}`, label: size })
    })
    if (filters.min !== '' || filters.max !== '') {
      const minLabel = filters.min !== '' ? `₹${filters.min}` : `₹${bounds.min}`
      const maxLabel = filters.max !== '' ? `₹${filters.max}` : `₹${bounds.max}`
      items.push({ key: 'price', label: `${minLabel} - ${maxLabel}` })
    }
    return items
  }, [filters, bounds])

  const removeChip = (key) => {
    if (key.startsWith('size:')) {
      const size = key.slice(5)
      setParam('size', toggleInList(filters.sizes, size).join(','))
      return
    }
    if (key.startsWith('category:')) {
      const id = key.slice(9)
      setParams([
        ['category', toggleInList(filters.categories, id).join(',')],
        ['sub', ''],
      ])
      return
    }
    if (key.startsWith('tag:')) {
      const tag = key.slice(4)
      setParam('tag', toggleInList(filters.tags, tag).join(','))
      return
    }
    if (key === 'price') {
      setParams([
        ['min', ''],
        ['max', ''],
      ])
      setDraftMin('')
      setDraftMax('')
      return
    }
    setParam(key, '')
  }

  const pageTitle =
    activeCategories.length === 1
      ? activeCategories[0].name
      : filters.tags.length === 1
        ? TAG_LABELS[filters.tags[0]] || 'Shop'
        : 'Shop'

  const breadcrumbItems = useMemo(() => {
    const items = []
    const hasDepth = Boolean(
      filters.categories.length || filters.tags.length || filters.sub
    )

    if (hasDepth) {
      items.push({ label: 'Shop', to: ROUTES.SHOP })
    } else {
      items.push({ label: 'Shop' })
      return items
    }

    if (activeCategories.length === 1) {
      items.push({ label: activeCategories[0].name })
      return items
    }

    if (activeCategories.length > 1) {
      items.push({ label: `${activeCategories.length} categories` })
      return items
    }

    if (filters.tags.length === 1) {
      items.push({ label: TAG_LABELS[filters.tags[0]] || filters.tags[0] })
      return items
    }

    if (filters.tags.length > 1) {
      items.push({ label: `${filters.tags.length} collections` })
    }

    return items
  }, [filters.categories, filters.tags, filters.sub, activeCategories])

  const filterPanel = (
    <ShopFilters
      filters={filters}
      bounds={bounds}
      allSizes={allSizes}
      counts={counts}
      onToggleCategory={toggleCategory}
      onToggleTag={toggleTag}
      onToggleSize={toggleSize}
      onClearAll={clearAll}
      onApplyPrice={applyPrice}
      onSelectPricePreset={selectPricePreset}
      draftMin={draftMin}
      draftMax={draftMax}
      setDraftMin={setDraftMin}
      setDraftMax={setDraftMax}
    />
  )

  return (
    <>
      <main className="home-page shop-catalog">
        <div className="breadcrumb-bar">
          <div className="container">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        </div>

        <section className="shop-catalog__section">
          <div className="container">
            <h1 className="sr-only">{pageTitle}</h1>
            <div className="shop-catalog__layout">
              <aside
                className="shop-catalog__sidebar"
                aria-label="Product filters"
              >
                {filterPanel}
              </aside>

              <div
                className={`shop-catalog__main${
                  filtering ? ' is-filtering' : ''
                }`}
              >
                <div className="shop-toolbar">
                  <div className="shop-toolbar__left">
                    {chips.length > 0 && (
                      <span className="shop-toolbar__active">
                        {chips.length} filter{chips.length === 1 ? '' : 's'} on
                      </span>
                    )}
                  </div>

                  <div className="shop-toolbar__actions">
                    <button
                      type="button"
                      className="shop-toolbar__filters-btn"
                      onClick={() => setMobileOpen(true)}
                    >
                      Filters
                      {chips.length > 0 && <span>{chips.length}</span>}
                    </button>

                    <label className="shop-toolbar__sort">
                      <span>Sort by</span>
                      <select
                        value={filters.sort}
                        onChange={(e) => setParam('sort', e.target.value)}
                        aria-label="Sort products"
                      >
                        {SORT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                {chips.length > 0 && (
                  <div className="shop-chips" aria-label="Active filters">
                    {chips.map((chip) => (
                      <button
                        key={chip.key}
                        type="button"
                        className="shop-chip"
                        onClick={() => removeChip(chip.key)}
                      >
                        {chip.label}
                        <CloseIcon size={12} />
                      </button>
                    ))}
                    <button
                      type="button"
                      className="shop-chips__clear"
                      onClick={clearAll}
                    >
                      Clear all
                    </button>
                  </div>
                )}

                <div
                  className={`shop-results${filtering ? ' is-loading' : ''}`}
                  aria-busy={filtering}
                >
                  {filtering && (
                    <div className="shop-filter-loader" role="status">
                      <span className="shop-filter-loader__spinner" aria-hidden="true" />
                      <span>Applying filters…</span>
                    </div>
                  )}

                  {list.length === 0 ? (
                    <div className="shop-empty shop-empty--catalog">
                      <span className="shop-empty__icon">
                        <SearchIcon size={28} />
                      </span>
                      <h2>No products match</h2>
                      <p>
                        Try clearing filters or searching with a different word.
                      </p>
                      <button
                        type="button"
                        className="btn-hero-primary"
                        onClick={clearAll}
                      >
                        Clear filters
                      </button>
                      <Link to={ROUTES.HOME} className="shop-empty__link">
                        <ArrowLeftIcon size={14} />
                        Back to home
                      </Link>
                    </div>
                  ) : (
                    <div className="product-grid shop-catalog__grid">
                      {list.map((product) => {
                        const preferredSize = filters.sizes.find((s) =>
                          product.sizes.includes(s)
                        )
                        return (
                          <ProductCard
                            key={product.id}
                            product={product}
                            preferredSize={preferredSize}
                          />
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <FaqSection page="shop" title="Shopping help" />
      </main>

      <div
        className={`shop-filter-drawer${mobileOpen ? ' is-open' : ''}`}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          className="shop-filter-drawer__backdrop"
          aria-label="Close filters"
          tabIndex={mobileOpen ? 0 : -1}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className="shop-filter-drawer__panel"
          role="dialog"
          aria-modal="true"
          aria-label="Product filters"
        >
          <div className="shop-filter-drawer__bar">
            <strong>Filters</strong>
            <button
              type="button"
              className="shop-filter-drawer__close"
              aria-label="Close filters"
              onClick={() => setMobileOpen(false)}
            >
              <CloseIcon size={18} />
            </button>
          </div>
          <div className="shop-filter-drawer__body">{filterPanel}</div>
          <div className="shop-filter-drawer__foot">
            <button
              type="button"
              className="shop-filter-drawer__done"
              onClick={() => setMobileOpen(false)}
            >
              Show {list.length} products
            </button>
          </div>
        </aside>
      </div>

      <Footer />
    </>
  )
}

export default Shop
