import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { SearchIcon } from '../components/icons'
import {
  CRM_SOURCES,
  CRM_STATUSES,
  createLead,
  deleteLead,
  fetchCrmStats,
  fetchLeads,
  updateLead,
} from '../services/crmService'
import AdminLayout from './AdminLayout'
import {
  StatusDonut,
  OrdersBarChart,
  HorizontalBars,
  FunnelChart,
  KpiSpark,
  buildLeadPeriodSeries,
  buildSourceSeries,
  PERIOD_OPTIONS,
  periodRangeHint,
} from './AdminCharts'

const STATUS_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  interested: 'Interested',
  converted: 'Converted',
  lost: 'Lost',
}

const STATUS_COLORS = {
  new: '#2f6fa8',
  contacted: '#5b6fd4',
  interested: '#b86a12',
  converted: '#0a4f33',
  lost: '#c0394f',
}

const SOURCE_LABELS = {
  website: 'Website',
  phone: 'Phone',
  whatsapp: 'WhatsApp',
  referral: 'Referral',
  social: 'Social',
  other: 'Other',
}

const SOURCE_COLORS = {
  website: '#0a4f33',
  phone: '#2f6fa8',
  whatsapp: '#127048',
  referral: '#b86a12',
  social: '#5b6fd4',
  other: '#6b8075',
}

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  source: 'website',
  status: 'new',
  interest: '',
  notes: '',
}

const formatDate = (iso) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

export default function LeadsDesk({ bare = false }) {
  const [leads, setLeads] = useState([])
  const [allLeads, setAllLeads] = useState([])
  const [stats, setStats] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState('')
  const [noteDrafts, setNoteDrafts] = useState({})
  const [period, setPeriod] = useState('week')
  const [updatedAt, setUpdatedAt] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 320)
    return () => clearTimeout(t)
  }, [query])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [nextLeads, analytics, nextStats] = await Promise.all([
        fetchLeads({
          status: statusFilter || undefined,
          q: debouncedQuery || undefined,
        }),
        fetchLeads({}),
        fetchCrmStats(),
      ])
      setLeads(nextLeads)
      setAllLeads(analytics)
      setStats(nextStats)
      setUpdatedAt(new Date())
    } catch (err) {
      setError(err.message || 'Could not load leads')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, debouncedQuery])

  useEffect(() => {
    load()
  }, [load])

  const statusCounts = useMemo(() => stats?.byStatus || {}, [stats])

  const leadTrend = useMemo(
    () => buildLeadPeriodSeries(allLeads, period),
    [allLeads, period]
  )
  const rangeHint = periodRangeHint(period)
  const periodLeads = leadTrend.reduce((s, d) => s + d.value, 0)

  const donutSegments = useMemo(
    () =>
      CRM_STATUSES.map((key) => ({
        key,
        label: STATUS_LABELS[key],
        value: statusCounts[key] || 0,
        color: STATUS_COLORS[key],
      })),
    [statusCounts]
  )

  const funnelStages = useMemo(
    () =>
      ['new', 'contacted', 'interested', 'converted'].map((key) => ({
        key,
        label: STATUS_LABELS[key],
        value: statusCounts[key] || 0,
        color: STATUS_COLORS[key],
      })),
    [statusCounts]
  )

  const sourceRows = useMemo(() => {
    if (stats?.bySource) {
      return CRM_SOURCES.map((key) => ({
        key,
        label: SOURCE_LABELS[key],
        value: stats.bySource[key] || 0,
        color: SOURCE_COLORS[key],
      }))
        .filter((r) => r.value > 0)
        .sort((a, b) => b.value - a.value)
    }
    return buildSourceSeries(allLeads, SOURCE_LABELS).map((row) => ({
      ...row,
      color: SOURCE_COLORS[row.key] || SOURCE_COLORS.other,
    }))
  }, [stats, allLeads])

  const conversionRate = useMemo(() => {
    const total = stats?.leads || 0
    const converted = statusCounts.converted || 0
    if (!total) return 0
    return Math.round((converted / total) * 100)
  }, [stats, statusCounts])

  const onCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setMessage('Name is required')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      await createLead(form)
      setForm(emptyForm)
      setShowForm(false)
      setMessage('Lead added')
      await load()
    } catch (err) {
      setMessage(err.message || 'Could not create lead')
    } finally {
      setSaving(false)
    }
  }

  const onStatusChange = async (id, status) => {
    setBusyId(id)
    setMessage('')
    try {
      const lead = await updateLead(id, { status })
      setLeads((prev) => prev.map((row) => (row.id === id ? lead : row)))
      setAllLeads((prev) => prev.map((row) => (row.id === id ? lead : row)))
      const nextStats = await fetchCrmStats()
      setStats(nextStats)
    } catch (err) {
      setMessage(err.message || 'Could not update status')
    } finally {
      setBusyId('')
    }
  }

  const onSaveNotes = async (id) => {
    const notes = noteDrafts[id]
    if (typeof notes !== 'string') return
    setBusyId(id)
    setMessage('')
    try {
      const lead = await updateLead(id, { notes })
      setLeads((prev) => prev.map((row) => (row.id === id ? lead : row)))
      setMessage('Notes saved')
    } catch (err) {
      setMessage(err.message || 'Could not save notes')
    } finally {
      setBusyId('')
    }
  }

  const onDelete = async (id) => {
    if (!window.confirm('Delete this lead?')) return
    setBusyId(id)
    setMessage('')
    try {
      await deleteLead(id)
      setLeads((prev) => prev.filter((row) => row.id !== id))
      setAllLeads((prev) => prev.filter((row) => row.id !== id))
      if (expandedId === id) setExpandedId('')
      setMessage('Lead deleted')
      const nextStats = await fetchCrmStats()
      setStats(nextStats)
    } catch (err) {
      setMessage(err.message || 'Could not delete lead')
    } finally {
      setBusyId('')
    }
  }

  const desk = (
      <div className="admin-desk">
        <header className="admin-head">
          <div className="admin-head__copy">
            <h1>Leads</h1>
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
                Updated{' '}
                {updatedAt.toLocaleTimeString('en-IN', {
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
            <button
              type="button"
              className="admin-btn"
              onClick={() => setShowForm((open) => !open)}
            >
              {showForm ? 'Close form' : 'Add lead'}
            </button>
          </div>
        </header>

        {stats && (
          <div className="admin-kpi admin-kpi--leads" aria-label="Lead metrics">
            <button
              type="button"
              className={`admin-kpi__card admin-kpi__card--click${
                !statusFilter ? ' admin-kpi__card--active' : ''
              }`}
              onClick={() => setStatusFilter('')}
            >
              <div className="admin-kpi__top">
                <span>Total leads</span>
                <KpiSpark
                  values={leadTrend.map((d) => d.value)}
                  labels={leadTrend.map((d) => d.label)}
                />
              </div>
              <strong>{stats.leads}</strong>
              <em>
                {periodLeads} in {rangeHint.toLowerCase()}
              </em>
            </button>
            <article className="admin-kpi__card admin-kpi__card--accent">
              <div className="admin-kpi__top">
                <span>Conversion</span>
                <KpiSpark
                  values={leadTrend.map((d) => d.value)}
                  labels={leadTrend.map((d) => d.label)}
                  tone="light"
                />
              </div>
              <strong>{conversionRate}%</strong>
              <em>
                {statusCounts.converted || 0} of {stats.leads} leads
              </em>
            </article>
            <button
              type="button"
              className={`admin-kpi__card admin-kpi__card--click admin-kpi__card--warn${
                statusFilter === 'new' ? ' admin-kpi__card--active' : ''
              }`}
              onClick={() =>
                setStatusFilter((cur) => (cur === 'new' ? '' : 'new'))
              }
            >
              <div className="admin-kpi__top">
                <span>New</span>
              </div>
              <strong>{statusCounts.new || 0}</strong>
              <em>Awaiting first contact</em>
            </button>
            <button
              type="button"
              className={`admin-kpi__card admin-kpi__card--click admin-kpi__card--ship${
                statusFilter === 'interested' ? ' admin-kpi__card--active' : ''
              }`}
              onClick={() =>
                setStatusFilter((cur) =>
                  cur === 'interested' ? '' : 'interested'
                )
              }
            >
              <div className="admin-kpi__top">
                <span>Interested</span>
              </div>
              <strong>{statusCounts.interested || 0}</strong>
              <em>Warm pipeline</em>
            </button>
          </div>
        )}

        <div className="admin-dash admin-dash--graphs">
          <section className="admin-panel-card admin-panel-card--wide">
            <header className="admin-panel-card__head">
              <h2>Lead volume</h2>
              <p>{rangeHint}</p>
            </header>
            <OrdersBarChart series={leadTrend} period={period} />
          </section>

          <section className="admin-panel-card admin-panel-card--side">
            <header className="admin-panel-card__head">
              <h2>Sources</h2>
              <p>Where leads come from</p>
            </header>
            <HorizontalBars
              rows={sourceRows}
              valueFormat={(n) => `${n}`}
              emptyLabel="No source data yet"
              maxItems={5}
            />
          </section>

          <section className="admin-panel-card admin-panel-card--half">
            <header className="admin-panel-card__head">
              <h2>Status</h2>
              <p>Tap to filter</p>
            </header>
            <StatusDonut
              segments={donutSegments}
              size={152}
              onSelect={(key) =>
                setStatusFilter((cur) => (cur === key ? '' : key))
              }
            />
          </section>

          <section className="admin-panel-card admin-panel-card--half">
            <header className="admin-panel-card__head">
              <h2>Funnel</h2>
              <p>New → converted</p>
            </header>
            <FunnelChart
              stages={funnelStages}
              onSelect={(key) =>
                setStatusFilter((cur) => (cur === key ? '' : key))
              }
            />
          </section>
        </div>

        {showForm && (
          <form className="admin-lead-form admin-panel-card" onSubmit={onCreate}>
            <header className="admin-panel-card__head">
              <h2>New lead</h2>
              <p>Manual entry for phone, WhatsApp, or referral contacts.</p>
            </header>
            <div className="admin-lead-form__grid">
              <label>
                Name
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </label>
              <label>
                Phone
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </label>
              <label>
                Source
                <select
                  value={form.source}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, source: e.target.value }))
                  }
                >
                  {CRM_SOURCES.map((src) => (
                    <option key={src} value={src}>
                      {SOURCE_LABELS[src]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value }))
                  }
                >
                  {CRM_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Interest
                <input
                  value={form.interest}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, interest: e.target.value }))
                  }
                  placeholder="Product or enquiry topic"
                />
              </label>
              <label className="admin-lead-form__full">
                Notes
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                />
              </label>
            </div>
            <div className="admin-lead-form__actions">
              <button type="submit" className="admin-btn" disabled={saving}>
                {saving ? 'Saving…' : 'Save lead'}
              </button>
            </div>
          </form>
        )}

        <section className="admin-orders-section">
          <header className="admin-orders-section__head">
            <div>
              <h2>All leads</h2>
              <p>Contact form and manual CRM entries.</p>
            </div>
            <span className="admin-orders-section__count">
              {leads.length} shown
            </span>
          </header>

          <div className="admin-chips" role="tablist" aria-label="Filter by status">
            <button
              type="button"
              className={`admin-chip${!statusFilter ? ' is-active' : ''}`}
              onClick={() => setStatusFilter('')}
            >
              All
            </button>
            {CRM_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                className={`admin-chip${
                  statusFilter === status ? ' is-active' : ''
                }`}
                onClick={() => setStatusFilter(status)}
              >
                {STATUS_LABELS[status]}
                <em>{statusCounts[status] || 0}</em>
              </button>
            ))}
          </div>

          <div className="admin-toolbar">
            <label className="admin-toolbar__search">
              <span className="admin-toolbar__search-ico" aria-hidden="true">
                <SearchIcon size={16} />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, email, phone, interest"
              />
              {query ? (
                <button
                  type="button"
                  className="admin-toolbar__clear"
                  onClick={() => setQuery('')}
                >
                  Clear
                </button>
              ) : null}
            </label>
          </div>

          {error && <p className="admin-alert">{error}</p>}
          {message && (
            <p className="admin-alert admin-alert--ok" role="status">
              {message}
            </p>
          )}

          {loading ? (
            <p className="admin-loading">Loading leads…</p>
          ) : leads.length === 0 ? (
            <p className="admin-empty">No leads match this filter.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Lead</th>
                    <th>Source</th>
                    <th>Interest</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => {
                    const open = expandedId === lead.id
                    return (
                      <Fragment key={lead.id}>
                        <tr className="admin-table__row">
                          <td>
                            <strong className="admin-table__name">
                              {lead.name}
                            </strong>
                            <span className="admin-table__sub">
                              {[lead.email, lead.phone].filter(Boolean).join(' · ') ||
                                'No contact'}
                            </span>
                          </td>
                          <td>{SOURCE_LABELS[lead.source] || lead.source}</td>
                          <td className="admin-table__muted">
                            {lead.interest || '—'}
                          </td>
                          <td>
                            <select
                              className="admin-select"
                              value={lead.status}
                              disabled={busyId === lead.id}
                              onChange={(e) =>
                                onStatusChange(lead.id, e.target.value)
                              }
                            >
                              {CRM_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {STATUS_LABELS[status]}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="admin-table__muted">
                            {formatDate(lead.createdAt)}
                          </td>
                          <td>
                            <div className="admin-lead-actions">
                              <button
                                type="button"
                                className="admin-btn admin-btn--ghost"
                                onClick={() => {
                                  setExpandedId(open ? '' : lead.id)
                                  setNoteDrafts((prev) => ({
                                    ...prev,
                                    [lead.id]:
                                      prev[lead.id] ?? lead.notes ?? '',
                                  }))
                                }}
                              >
                                {open ? 'Hide' : 'Notes'}
                              </button>
                              <button
                                type="button"
                                className="admin-btn admin-btn--ghost admin-btn--danger"
                                disabled={busyId === lead.id}
                                onClick={() => onDelete(lead.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                        {open && (
                          <tr className="admin-table__detail">
                            <td colSpan={6}>
                              <label className="admin-lead-notes">
                                Notes
                                <textarea
                                  rows={3}
                                  value={noteDrafts[lead.id] ?? lead.notes ?? ''}
                                  onChange={(e) =>
                                    setNoteDrafts((prev) => ({
                                      ...prev,
                                      [lead.id]: e.target.value,
                                    }))
                                  }
                                />
                              </label>
                              <div className="admin-lead-actions">
                                <button
                                  type="button"
                                  className="admin-btn"
                                  disabled={busyId === lead.id}
                                  onClick={() => onSaveNotes(lead.id)}
                                >
                                  Save notes
                                </button>
                                {lead.lastContactAt ? (
                                  <span className="admin-table__muted">
                                    Last contact{' '}
                                    {formatDate(lead.lastContactAt)}
                                  </span>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
  )

  if (bare) return desk
  return <AdminLayout mode="admin">{desk}</AdminLayout>
}
