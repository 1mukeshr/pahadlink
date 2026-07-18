/**
 * Lightweight SVG charts for admin/seller — no chart library dependency.
 */

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

export function StatusDonut({ segments, size = 168 }) {
  const total = segments.reduce((s, x) => s + (x.value || 0), 0) || 1
  const stroke = 18
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  let offset = 0

  return (
    <div className="admin-chart admin-chart--donut">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(10,79,51,0.08)"
          strokeWidth={stroke}
        />
        {segments.map((seg) => {
          const len = (seg.value / total) * c
          const el = (
            <circle
              key={seg.key}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )
          offset += len
          return el
        })}
        <text
          x="50%"
          y="48%"
          textAnchor="middle"
          className="admin-chart__center-value"
        >
          {total === 1 && segments.every((s) => !s.value) ? 0 : segments.reduce((s, x) => s + x.value, 0)}
        </text>
        <text
          x="50%"
          y="60%"
          textAnchor="middle"
          className="admin-chart__center-label"
        >
          Orders
        </text>
      </svg>
      <ul className="admin-chart__legend">
        {segments.map((seg) => (
          <li key={seg.key}>
            <i style={{ background: seg.color }} />
            <span>{seg.label}</span>
            <strong>{seg.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function OrdersBarChart({ series, height = 160 }) {
  const max = Math.max(1, ...series.map((d) => d.value))
  const barW = 28
  const gap = 14
  const width = series.length * (barW + gap) + gap
  const padTop = 16
  const padBottom = 28
  const chartH = height - padTop - padBottom

  return (
    <div className="admin-chart admin-chart--bars">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Orders over recent days"
      >
        {[0.25, 0.5, 0.75, 1].map((t) => {
          const y = padTop + chartH * (1 - t)
          return (
            <line
              key={t}
              x1={0}
              x2={width}
              y1={y}
              y2={y}
              stroke="rgba(10,79,51,0.08)"
              strokeWidth="1"
            />
          )
        })}
        {series.map((d, i) => {
          const h = (d.value / max) * chartH
          const x = gap + i * (barW + gap)
          const y = padTop + chartH - h
          return (
            <g key={d.label}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(2, h)}
                rx="6"
                fill="url(#adminBarGrad)"
              />
              <text
                x={x + barW / 2}
                y={height - 10}
                textAnchor="middle"
                className="admin-chart__axis"
              >
                {d.label}
              </text>
              {d.value > 0 && (
                <text
                  x={x + barW / 2}
                  y={clamp(y - 6, 12, height)}
                  textAnchor="middle"
                  className="admin-chart__bar-val"
                >
                  {d.value}
                </text>
              )}
            </g>
          )
        })}
        <defs>
          <linearGradient id="adminBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1f8a55" />
            <stop offset="100%" stopColor="#0a4f33" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

export function RevenueSparkline({ points, width = 280, height = 72 }) {
  if (!points.length) {
    return <p className="admin-chart__empty">No paid orders yet</p>
  }
  const max = Math.max(1, ...points.map((p) => p.value))
  const step = width / Math.max(1, points.length - 1)
  const coords = points.map((p, i) => {
    const x = i * step
    const y = height - 8 - (p.value / max) * (height - 20)
    return `${x},${y}`
  })
  const area = `0,${height} ${coords.join(' ')} ${width},${height}`

  return (
    <div className="admin-chart admin-chart--spark">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <polygon points={area} fill="rgba(10, 79, 51, 0.12)" />
        <polyline
          points={coords.join(' ')}
          fill="none"
          stroke="#0a4f33"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

/** Build last N days order counts from order list */
export function buildDailySeries(orders, days = 7) {
  const map = new Map()
  const now = new Date()
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    map.set(key, {
      key,
      label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      value: 0,
      revenue: 0,
    })
  }
  for (const order of orders || []) {
    const key = String(order.createdAt || '').slice(0, 10)
    if (!map.has(key)) continue
    const row = map.get(key)
    row.value += 1
    if (order.paymentStatus === 'paid') {
      row.revenue += Number(order.totalAmount || 0)
    }
  }
  return [...map.values()]
}
