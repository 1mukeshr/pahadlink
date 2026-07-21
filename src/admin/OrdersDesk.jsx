import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchInventory,
  fetchOrders,
  fetchOrderStats,
  STATUS_LABELS,
  updateOrder,
} from '../services/orderService'
import { getProductById } from '../data/siteData'
import { CopyIcon, CheckIcon, SearchIcon } from '../components/icons'
import AdminLayout from './AdminLayout'
import {
  StatusDonut,
  OrdersBarChart,
  RevenueSparkline,
  KpiSpark,
  buildPeriodSeries,
  PERIOD_OPTIONS,
  periodChartTitle,
  periodRevenueTitle,
  periodRangeHint,
} from './AdminCharts'

const formatPrice = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const formatDate = (iso) => {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return '-'
  }
}

const stockLevel = (qty) => {
  const n = Number(qty) || 0
  if (n <= 0) return 'out'
  if (n <= 5) return 'low'
  return 'ok'
}

const productTitle = (productId) => {
  const p = getProductById(productId)
  if (!p?.name) return productId
  return p.name.split('|')[0].trim()
}

const productImage = (productId) => getProductById(productId)?.image || ''

const productCategory = (productId) =>
  getProductById(productId)?.categoryName || 'Product'


const ADMIN_NEXT = {
  pending: [
    { status: 'confirmed', label: 'Confirm' },
    { status: 'cancelled', label: 'Cancel' },
  ],
  confirmed: [
    { status: 'processing', label: 'Mark packed' },
    { status: 'shipped', label: 'Ship' },
    { status: 'cancelled', label: 'Cancel' },
  ],
  processing: [
    { status: 'shipped', label: 'Ship' },
    { status: 'cancelled', label: 'Cancel' },
  ],
  shipped: [
    { status: 'out_for_delivery', label: 'Out for delivery' },
    { status: 'delivered', label: 'Mark delivered' },
  ],
  out_for_delivery: [{ status: 'delivered', label: 'Mark delivered' }],
  delivered: [],
  return_requested: [
    { status: 'returned', label: 'Accept return' },
    { status: 'delivered', label: 'Reject return' },
  ],
  returned: [],
  cancelled: [],
}

const SELLER_NEXT = {
  pending: [{ status: 'confirmed', label: 'Confirm' }],
  confirmed: [
    { status: 'processing', label: 'Mark packed' },
    { status: 'shipped', label: 'Ship' },
  ],
  processing: [{ status: 'shipped', label: 'Ship' }],
  shipped: [
    { status: 'out_for_delivery', label: 'Out for delivery' },
    { status: 'delivered', label: 'Mark delivered' },
  ],
  out_for_delivery: [{ status: 'delivered', label: 'Mark delivered' }],
  return_requested: [{ status: 'returned', label: 'Accept return' }],
}

const STATUS_COLORS = {
  pending: '#b86a12',
  confirmed: '#2f6fa8',
  processing: '#5b6fd4',
  shipped: '#127048',
  out_for_delivery: '#0d8a5a',
  delivered: '#0a4f33',
  cancelled: '#c0394f',
  return_requested: '#c45c3a',
  returned: '#6b8075',
}

const DANGER_STATUSES = new Set(['cancelled'])

export default function OrdersDesk({ mode = 'admin' }) {
  const isAdmin = mode === 'admin'
  const title = isAdmin ? 'Operations dashboard' : 'Sellers'
  const nextMap = isAdmin ? ADMIN_NEXT : SELLER_NEXT

  const [orders, setOrders] = useState([])
  const [allOrders, setAllOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [inventory, setInventory] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [trackDrafts, setTrackDrafts] = useState({})
  const [message, setMessage] = useState('')
  const [copiedId, setCopiedId] = useState('')
  const [invQuery, setInvQuery] = useState('')
  const [invFilter, setInvFilter] = useState('all') // all | low | out
  const [orderPage, setOrderPage] = useState(1)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [period, setPeriod] = useState('week')
  const ORDER_PAGE_SIZE = 8

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 320)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    setOrderPage(1)
  }, [statusFilter, debouncedQuery, period])

  useEffect(() => {
    if (!message) return undefined
    const t = setTimeout(() => setMessage(''), 2800)
    return () => clearTimeout(t)
  }, [message])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { period }
      if (statusFilter) params.status = statusFilter
      if (debouncedQuery) params.q = debouncedQuery

      const [list, st, analytics] = await Promise.all([
        fetchOrders(params),
        fetchOrderStats({ period }),
        fetchOrders({ period }),
      ])
      setOrders(list)
      setAllOrders(analytics)
      setStats(st)
      setUpdatedAt(new Date())

      if (isAdmin) {
        try {
          setInventory(await fetchInventory())
        } catch {
          setInventory([])
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load operations data')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, debouncedQuery, isAdmin, period])

  useEffect(() => {
    load()
  }, [load])

  const statusOptions = useMemo(() => {
    if (isAdmin) {
      return [
        '',
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'out_for_delivery',
        'delivered',
        'return_requested',
        'returned',
        'cancelled',
      ]
    }
    return [
      '',
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'out_for_delivery',
      'delivered',
      'return_requested',
    ]
  }, [isAdmin])

  const chipOptions = useMemo(() => {
    const s = stats || {}
    return statusOptions.map((key) => ({
      key,
      label: key ? STATUS_LABELS[key] || key : 'All',
      count: key ? s[key] || 0 : s.total || 0,
    }))
  }, [statusOptions, stats])

  const daily = useMemo(
    () => buildPeriodSeries(allOrders, period),
    [allOrders, period]
  )
  const rangeHint = periodRangeHint(period)
  const chartTitle = periodChartTitle(period)
  const revenueTitle = periodRevenueTitle(period)

  const donutSegments = useMemo(() => {
    const s = stats || {}
    const rows = isAdmin
      ? [
          { key: 'pending', label: 'Pending', value: s.pending || 0, color: STATUS_COLORS.pending },
          { key: 'confirmed', label: 'Confirmed', value: s.confirmed || 0, color: STATUS_COLORS.confirmed },
          { key: 'processing', label: 'Packed', value: s.processing || 0, color: STATUS_COLORS.processing },
          { key: 'shipped', label: 'Shipped', value: s.shipped || 0, color: STATUS_COLORS.shipped },
          {
            key: 'out_for_delivery',
            label: 'Out for delivery',
            value: s.out_for_delivery || 0,
            color: STATUS_COLORS.out_for_delivery,
          },
          { key: 'delivered', label: 'Delivered', value: s.delivered || 0, color: STATUS_COLORS.delivered },
          { key: 'cancelled', label: 'Cancelled', value: s.cancelled || 0, color: STATUS_COLORS.cancelled },
        ]
      : [
          { key: 'confirmed', label: 'Confirmed', value: s.confirmed || 0, color: STATUS_COLORS.confirmed },
          { key: 'processing', label: 'Packed', value: s.processing || 0, color: STATUS_COLORS.processing },
          { key: 'shipped', label: 'Shipped', value: s.shipped || 0, color: STATUS_COLORS.shipped },
          {
            key: 'out_for_delivery',
            label: 'Out for delivery',
            value: s.out_for_delivery || 0,
            color: STATUS_COLORS.out_for_delivery,
          },
          { key: 'delivered', label: 'Delivered', value: s.delivered || 0, color: STATUS_COLORS.delivered },
        ]
    return rows
  }, [stats, isAdmin])

  const inventoryRows = useMemo(() => {
    const q = invQuery.trim().toLowerCase()
    return inventory
      .map((item) => {
        const sizes = item.stockBySize
          ? Object.entries(item.stockBySize).map(([size, qty]) => ({
              size,
              qty: Number(qty) || 0,
              level: stockLevel(qty),
            }))
          : null
        const total = sizes
          ? sizes.reduce((s, r) => s + r.qty, 0)
          : Number(item.stock) || 0
        const level = sizes
          ? sizes.some((r) => r.level === 'out')
            ? sizes.every((r) => r.level === 'out')
              ? 'out'
              : 'low'
            : sizes.some((r) => r.level === 'low')
              ? 'low'
              : 'ok'
          : stockLevel(total)
        const name = productTitle(item.productId)
        return {
          ...item,
          name,
          image: productImage(item.productId),
          category: productCategory(item.productId),
          sizes,
          total,
          level,
        }
      })
      .filter((row) => {
        if (invFilter === 'low' && row.level !== 'low') return false
        if (invFilter === 'out' && row.level !== 'out') return false
        if (!q) return true
        return (
          row.productId.toLowerCase().includes(q) ||
          row.name.toLowerCase().includes(q) ||
          row.category.toLowerCase().includes(q)
        )
      })
  }, [inventory, invQuery, invFilter])

  const invStats = useMemo(() => {
    let low = 0
    let out = 0
    for (const item of inventory) {
      if (item.stockBySize) {
        const vals = Object.values(item.stockBySize).map((n) => Number(n) || 0)
        if (vals.length && vals.every((n) => n <= 0)) out += 1
        else if (vals.some((n) => n <= 5)) low += 1
      } else {
        const n = Number(item.stock) || 0
        if (n <= 0) out += 1
        else if (n <= 5) low += 1
      }
    }
    return { total: inventory.length, low, out }
  }, [inventory])

  const lowStock = useMemo(() => {
    const rows = []
    for (const item of inventory) {
      if (item.stockBySize) {
        for (const [size, qty] of Object.entries(item.stockBySize)) {
          if (Number(qty) <= 5) {
            rows.push({
              id: `${item.productId}-${size}`,
              label: `${productTitle(item.productId)} · ${size}`,
              qty: Number(qty),
            })
          }
        }
      } else if (typeof item.stock === 'number' && item.stock <= 5) {
        rows.push({
          id: item.productId,
          label: productTitle(item.productId),
          qty: item.stock,
        })
      }
    }
    return rows.slice(0, 8)
  }, [inventory])

  const applyUpdate = async (orderId, payload) => {
    if (DANGER_STATUSES.has(payload.status)) {
      const ok = window.confirm('Cancel this order? This cannot be undone.')
      if (!ok) return
    }
    setBusyId(orderId)
    setMessage('')
    try {
      await updateOrder(orderId, payload)
      setMessage('Order updated')
      await load()
    } catch (err) {
      setMessage(err.message || 'Update failed')
    } finally {
      setBusyId('')
    }
  }

  const copyOrderNumber = async (orderNumber) => {
    try {
      await navigator.clipboard.writeText(orderNumber)
      setCopiedId(orderNumber)
      setTimeout(() => setCopiedId(''), 1600)
    } catch {
      setMessage('Could not copy order number')
    }
  }

  const setFilter = (value) => {
    setStatusFilter((prev) => (prev === value ? '' : value))
  }

  const weekOrders = daily.reduce((s, d) => s + d.value, 0)
  const weekRevenue = daily.reduce((s, d) => s + d.revenue, 0)
  const needsAction = isAdmin
    ? (stats?.pending || 0) + (stats?.return_requested || stats?.returns || 0)
    : (stats?.pending || 0) + (stats?.confirmed || 0) + (stats?.processing || 0)

  const orderPageCount = Math.max(1, Math.ceil(orders.length / ORDER_PAGE_SIZE))
  const safeOrderPage = Math.min(orderPage, orderPageCount)
  const orderPageStart = (safeOrderPage - 1) * ORDER_PAGE_SIZE
  const pagedOrders = orders.slice(orderPageStart, orderPageStart + ORDER_PAGE_SIZE)
  const orderRangeEnd = Math.min(orderPageStart + ORDER_PAGE_SIZE, orders.length)

  return (
    <AdminLayout mode={mode}>
      <div className="admin-desk">
      <header className="admin-head">
        <div className="admin-head__copy">
          <h1>{title}</h1>
        </div>
        <div className="admin-head__actions">
          <div className="admin-period" role="group" aria-label="Time range">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={`admin-period__btn${period === opt.key ? ' is-active' : ''}`}
                onClick={() => setPeriod(opt.key)}
                aria-pressed={period === opt.key}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {updatedAt && (
            <span className="admin-head__meta" title={updatedAt.toLocaleString('en-IN')}>
              Updated {updatedAt.toLocaleTimeString('en-IN', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          )}
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={load}
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </header>

      {stats && (
        <div className="admin-kpi" aria-label="Key metrics">
          <button
            type="button"
            className={`admin-kpi__card admin-kpi__card--click${
              !statusFilter ? ' admin-kpi__card--active' : ''
            }`}
            onClick={() => setStatusFilter('')}
          >
            <div className="admin-kpi__top">
              <span>Total orders</span>
              <KpiSpark
                values={daily.map((d) => d.value)}
                labels={daily.map((d) => d.label)}
              />
            </div>
            <strong>{stats.total}</strong>
            <em>
              {weekOrders} in {rangeHint.toLowerCase()}
            </em>
          </button>
          {isAdmin && (
            <article className="admin-kpi__card admin-kpi__card--accent">
              <div className="admin-kpi__top">
                <span>Paid revenue</span>
                <KpiSpark
                  values={daily.map((d) => d.revenue)}
                  labels={daily.map((d) => d.label)}
                  tone="light"
                />
              </div>
              <strong>{formatPrice(stats.revenue)}</strong>
              <em>
                {formatPrice(weekRevenue)} · {rangeHint.toLowerCase()}
              </em>
            </article>
          )}
          <button
            type="button"
            className={`admin-kpi__card admin-kpi__card--click admin-kpi__card--warn${
              statusFilter === 'pending' ? ' admin-kpi__card--active' : ''
            }`}
            onClick={() => setFilter('pending')}
          >
            <div className="admin-kpi__top">
              <span>Needs action</span>
              <KpiSpark
                values={daily.map((d) => d.value)}
                labels={daily.map((d) => d.label)}
                tone="warn"
              />
            </div>
            <strong>{needsAction}</strong>
            <em>
              {isAdmin
                ? 'Pending + returns'
                : 'Pending + confirmed + processing'}
            </em>
          </button>
          <button
            type="button"
            className={`admin-kpi__card admin-kpi__card--click admin-kpi__card--ship${
              statusFilter === 'shipped' || statusFilter === 'out_for_delivery'
                ? ' admin-kpi__card--active'
                : ''
            }`}
            onClick={() => setFilter('shipped')}
          >
            <div className="admin-kpi__top">
              <span>In transit</span>
              <KpiSpark
                values={daily.map((d) => d.value)}
                labels={daily.map((d) => d.label)}
                tone="info"
              />
            </div>
            <strong>
              {(stats.shipped || 0) + (stats.out_for_delivery || 0)}
            </strong>
            <em>
              {stats.out_for_delivery || 0} out for delivery ·{' '}
              {stats.delivered || 0} delivered
            </em>
          </button>
        </div>
      )}

      <div className="admin-dash">
        <section className="admin-panel-card">
          <header className="admin-panel-card__head">
            <h2>Status mix</h2>
            <p>{rangeHint} · tap a status to filter</p>
          </header>
          <StatusDonut
            segments={donutSegments}
            onSelect={(key) => setFilter(key)}
          />
        </section>

        <section className="admin-panel-card">
          <header className="admin-panel-card__head">
            <h2>{chartTitle}</h2>
            <p>{rangeHint}</p>
          </header>
          <OrdersBarChart series={daily} period={period} />
        </section>

        {isAdmin && (
          <section className="admin-panel-card">
            <header className="admin-panel-card__head">
              <h2>{revenueTitle}</h2>
              <p>{rangeHint}</p>
            </header>
            <RevenueSparkline
              period={period}
              series={daily.map((d) => ({ label: d.label, value: d.revenue }))}
            />
            <p className="admin-panel-card__foot">
              Period total <strong>{formatPrice(weekRevenue)}</strong>
            </p>
          </section>
        )}

        {isAdmin && (
          <section className="admin-panel-card">
            <header className="admin-panel-card__head">
              <h2>Low stock</h2>
              <p>≤ 5 units</p>
            </header>
            {lowStock.length === 0 ? (
              <p className="admin-chart__empty">Stock looks healthy</p>
            ) : (
              <ul className="admin-stock-list">
                {lowStock.map((row) => (
                  <li key={row.id}>
                    <span>{row.label}</span>
                    <strong className={row.qty === 0 ? 'is-out' : ''}>{row.qty}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      <section className="admin-orders-section">
        <header className="admin-orders-section__head">
          <div>
            <h2>{isAdmin ? 'Orders' : 'Your orders'}</h2>
            <p>
              {isAdmin
                ? 'Search, filter, and update order status'
                : 'Confirm, pack, and ship customer orders'}
            </p>
          </div>
          <span className="admin-orders-section__count">
            {loading
              ? '…'
              : orders.length === 0
                ? '0 shown'
                : `${orderPageStart + 1}–${orderRangeEnd} of ${orders.length}`}
          </span>
        </header>

        <div className="admin-chips" role="tablist" aria-label="Filter by status">
          {chipOptions.map((chip) => (
            <button
              key={chip.key || 'all'}
              type="button"
              role="tab"
              aria-selected={statusFilter === chip.key}
              className={`admin-chip${statusFilter === chip.key ? ' is-active' : ''}`}
              onClick={() => setStatusFilter(chip.key)}
            >
              {chip.label}
              {stats ? ` · ${chip.count}` : ''}
            </button>
          ))}
        </div>

        <form
          className="admin-toolbar"
          onSubmit={(e) => {
            e.preventDefault()
            setDebouncedQuery(query.trim())
          }}
        >
          <label className="admin-toolbar__search">
            <span className="admin-toolbar__search-ico" aria-hidden="true">
              <SearchIcon size={16} />
            </span>
            <input
              type="search"
              placeholder="Search order #, name, email, tracking"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search orders"
            />
            {(query || statusFilter) && (
              <button
                type="button"
                className="admin-toolbar__clear"
                onClick={() => {
                  setQuery('')
                  setDebouncedQuery('')
                  setStatusFilter('')
                }}
                aria-label="Clear search and filters"
                title="Clear"
              >
                ×
              </button>
            )}
          </label>
        </form>

        {error && <p className="admin-alert">{error}</p>}
        {message && (
          <p
            className={`admin-alert${
              /fail|error|could not/i.test(message) ? '' : ' admin-alert--ok'
            }`}
            role="status"
          >
            {message}
          </p>
        )}

        {loading ? (
          <p className="admin-loading">Loading orders…</p>
        ) : orders.length === 0 ? (
          <p className="admin-empty">No orders match this filter.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Items</th>
                  <th scope="col">Payment</th>
                  <th scope="col">Status</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedOrders.map((order) => {
                  const actions = nextMap[order.status] || []
                  const draft = trackDrafts[order.id] || {
                    trackingNumber: order.trackingNumber || '',
                    courier: order.courier || '',
                  }
                  const showTracking =
                    order.status === 'processing' ||
                    order.status === 'shipped' ||
                    order.status === 'out_for_delivery' ||
                    order.status === 'confirmed'
                  const itemSummary = (order.items || []).slice(0, 2)
                  const extraItems = Math.max(0, (order.items || []).length - 2)
                  const addr = order.shippingAddress || {}
                  const shipParts = []
                  const pushShip = (value) => {
                    const s = String(value || '').trim()
                    if (!s) return
                    const joined = shipParts.join(' ').toLowerCase()
                    if (joined.includes(s.toLowerCase())) return
                    shipParts.push(s)
                  }
                  pushShip(addr.line1)
                  pushShip(addr.city)
                  pushShip(addr.state)
                  pushShip(addr.pincode)
                  const shipLine = shipParts.join(', ')
                  const showDetail =
                    showTracking ||
                    Boolean(order.returnReason) ||
                    Boolean(shipLine)

                  return (
                    <Fragment key={order.id}>
                      <tr className="admin-table__row">
                        <td>
                          <div className="admin-card__id">
                            <strong>{order.orderNumber}</strong>
                            <button
                              type="button"
                              className={`admin-card__copy${
                                copiedId === order.orderNumber ? ' is-copied' : ''
                              }`}
                              onClick={() => copyOrderNumber(order.orderNumber)}
                              aria-label={
                                copiedId === order.orderNumber
                                  ? 'Order number copied'
                                  : 'Copy order number'
                              }
                              title={
                                copiedId === order.orderNumber
                                  ? 'Copied'
                                  : 'Copy order number'
                              }
                            >
                              {copiedId === order.orderNumber ? (
                                <CheckIcon size={13} />
                              ) : (
                                <CopyIcon size={13} />
                              )}
                            </button>
                          </div>
                          <span className="admin-table__sub">
                            {formatDate(order.createdAt)}
                          </span>
                        </td>
                        <td>
                          <strong className="admin-table__name">
                            {order.customerName}
                          </strong>
                          <span className="admin-table__sub">
                            {order.customerEmail}
                            {order.customerPhone ? ` · ${order.customerPhone}` : ''}
                          </span>
                        </td>
                        <td>
                          <ul className="admin-card__items">
                            {itemSummary.map((item, idx) => (
                              <li key={`${order.id}-i-${idx}`}>
                                {item.name}
                                {item.size ? ` · ${item.size}` : ''} ×
                                {item.quantity}
                              </li>
                            ))}
                            {extraItems > 0 && <li>+{extraItems} more</li>}
                          </ul>
                        </td>
                        <td>
                          <span className="admin-table__pay">
                            {order.paymentMethod?.toUpperCase() || '—'}
                          </span>
                          <span className="admin-table__sub">
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td>
                          <span className={`admin-badge admin-badge--${order.status}`}>
                            {STATUS_LABELS[order.status] || order.status}
                          </span>
                        </td>
                        <td className="admin-table__amount">
                          {formatPrice(order.totalAmount)}
                        </td>
                        <td>
                          <div className="admin-card__actions">
                            {isAdmin && order.paymentStatus === 'pending' && (
                              <button
                                type="button"
                                className="admin-btn admin-btn--brand"
                                disabled={busyId === order.id}
                                onClick={() =>
                                  applyUpdate(order.id, { paymentStatus: 'paid' })
                                }
                              >
                                Mark paid
                              </button>
                            )}
                            {actions.map((action) => (
                              <button
                                key={action.status}
                                type="button"
                                className={`admin-btn${
                                  action.status === 'cancelled'
                                    ? ' admin-btn--danger'
                                    : ''
                                }`}
                                disabled={busyId === order.id}
                                onClick={() =>
                                  applyUpdate(order.id, {
                                    status: action.status,
                                    courier: draft.courier || order.courier,
                                    trackingNumber:
                                      draft.trackingNumber || order.trackingNumber,
                                  })
                                }
                              >
                                {action.label}
                              </button>
                            ))}
                            {!actions.length &&
                              !(isAdmin && order.paymentStatus === 'pending') && (
                                <span className="admin-table__muted">—</span>
                              )}
                          </div>
                        </td>
                      </tr>
                      {showDetail && (
                        <tr className="admin-table__detail">
                          <td colSpan={7}>
                            {shipLine && (
                              <p className="admin-card__ship">
                                <span className="admin-card__ship-label">Ship to</span>
                                <span className="admin-card__ship-text">{shipLine}</span>
                              </p>
                            )}
                            {order.returnReason && (
                              <p className="admin-card__return">
                                Return: {order.returnReason}
                              </p>
                            )}
                            {showTracking && (
                              <div className="admin-track">
                                <input
                                  type="text"
                                  placeholder="Courier"
                                  value={draft.courier}
                                  onChange={(e) =>
                                    setTrackDrafts((prev) => ({
                                      ...prev,
                                      [order.id]: {
                                        ...draft,
                                        courier: e.target.value,
                                      },
                                    }))
                                  }
                                />
                                <input
                                  type="text"
                                  placeholder="Tracking #"
                                  value={draft.trackingNumber}
                                  onChange={(e) =>
                                    setTrackDrafts((prev) => ({
                                      ...prev,
                                      [order.id]: {
                                        ...draft,
                                        trackingNumber: e.target.value,
                                      },
                                    }))
                                  }
                                />
                                <button
                                  type="button"
                                  className="admin-btn admin-btn--ghost"
                                  disabled={busyId === order.id}
                                  onClick={() =>
                                    applyUpdate(order.id, {
                                      courier: draft.courier,
                                      trackingNumber: draft.trackingNumber,
                                    })
                                  }
                                >
                                  Save tracking
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
            {orders.length > ORDER_PAGE_SIZE && (
              <div className="admin-pager">
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  disabled={safeOrderPage <= 1}
                  onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span className="admin-pager__label">
                  Page {safeOrderPage} of {orderPageCount}
                </span>
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  disabled={safeOrderPage >= orderPageCount}
                  onClick={() =>
                    setOrderPage((p) => Math.min(orderPageCount, p + 1))
                  }
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {isAdmin && inventory.length > 0 && (
        <section className="admin-inventory" aria-labelledby="admin-inv-title">
          <header className="admin-inventory__head">
            <div>
              <h2 id="admin-inv-title">Full inventory</h2>
              <p>
                {invStats.total} products · {invStats.low} low · {invStats.out}{' '}
                out of stock
              </p>
            </div>
            <div className="admin-inventory__filters">
              <button
                type="button"
                className={`admin-chip${invFilter === 'all' ? ' is-active' : ''}`}
                onClick={() => setInvFilter('all')}
              >
                All · {invStats.total}
              </button>
              <button
                type="button"
                className={`admin-chip${invFilter === 'low' ? ' is-active' : ''}`}
                onClick={() => setInvFilter('low')}
              >
                Low · {invStats.low}
              </button>
              <button
                type="button"
                className={`admin-chip${invFilter === 'out' ? ' is-active' : ''}`}
                onClick={() => setInvFilter('out')}
              >
                Out · {invStats.out}
              </button>
            </div>
          </header>

          <div className="admin-inventory__toolbar">
            <input
              type="search"
              placeholder="Search product name, id, category"
              value={invQuery}
              onChange={(e) => setInvQuery(e.target.value)}
              aria-label="Search inventory"
            />
            {invQuery && (
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                onClick={() => setInvQuery('')}
              >
                Clear
              </button>
            )}
          </div>

          {inventoryRows.length === 0 ? (
            <p className="admin-empty">No products match this inventory filter.</p>
          ) : (
            <ul className="admin-inventory__list">
              {inventoryRows.map((row) => (
                <li key={row.productId} className="admin-inv-row">
                  <div className="admin-inv-row__product">
                    <div className="admin-inv-row__thumb" aria-hidden="true">
                      {row.image ? (
                        <img src={row.image} alt="" />
                      ) : (
                        <span>{row.name.slice(0, 1)}</span>
                      )}
                    </div>
                    <div className="admin-inv-row__meta">
                      <strong>{row.name}</strong>
                      <span>
                        {row.category} · <code>{row.productId}</code>
                      </span>
                    </div>
                  </div>

                  <div className="admin-inv-row__stock">
                    {row.sizes ? (
                      <div className="admin-inv-sizes">
                        {row.sizes.map((s) => (
                          <span
                            key={s.size}
                            className={`admin-inv-size admin-inv-size--${s.level}`}
                            title={`${s.size}: ${s.qty}`}
                          >
                            <em>{s.size}</em>
                            <strong>{s.qty}</strong>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span
                        className={`admin-inv-total admin-inv-total--${row.level}`}
                      >
                        {row.total} units
                      </span>
                    )}
                  </div>

                  <div className="admin-inv-row__side">
                    <span className={`admin-badge admin-badge--inv-${row.level}`}>
                      {row.level === 'out'
                        ? 'Out of stock'
                        : row.level === 'low'
                          ? 'Low stock'
                          : 'In stock'}
                    </span>
                    <strong>{row.total}</strong>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      </div>
    </AdminLayout>
  )
}
