import { useState } from "react"
import { Link } from "react-router-dom"

const STATUS_COLORS = {
  Applied: "#2563eb",
  Shortlisted: "#f97316",
  Selected: "#10b981",
  Rejected: "#ef4444",
  Withdrawn: "#6b7280",
}

export function StatusPieChart({
  title = "Applications Overview",
  subtitle = "Status distribution",
  data = [],
  totalCount,
  link,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  // Normalize data items
  const items = data.map((item) => {
    const val = item.value !== undefined ? item.value : (item.count !== undefined ? item.count : 0)
    return {
      status: item.status || "Unknown",
      value: Number(val) || 0,
      color: item.color || STATUS_COLORS[item.status] || "#64748b",
    }
  })

  const calculatedTotal = items.reduce((acc, curr) => acc + curr.value, 0)
  const total = totalCount !== undefined ? totalCount : calculatedTotal

  // Filter items with value > 0 for rendering slices
  const activeItems = items.filter((item) => item.value > 0)
  const hasMultiple = activeItems.length > 1
  const gapAngle = hasMultiple ? 0.04 : 0

  // SVG Geometry
  const size = 220
  const cx = size / 2
  const cy = size / 2
  const baseR = 86
  const baseInnerR = 60

  let currentAngle = -Math.PI / 2

  const slices = items.map((item, index) => {
    if (item.value <= 0 || total === 0) {
      return { ...item, path: null, index, percent: 0 }
    }

    const angleSpan = (item.value / total) * 2 * Math.PI
    const startAngle = currentAngle + (hasMultiple ? gapAngle / 2 : 0)
    const endAngle = currentAngle + angleSpan - (hasMultiple ? gapAngle / 2 : 0)
    currentAngle += angleSpan

    const isHovered = hoveredIndex === index
    const R = isHovered ? baseR + 4 : baseR
    const r = isHovered ? baseInnerR - 2 : baseInnerR

    const x1 = cx + R * Math.cos(startAngle)
    const y1 = cy + R * Math.sin(startAngle)
    const x2 = cx + R * Math.cos(endAngle)
    const y2 = cy + R * Math.sin(endAngle)

    const x3 = cx + r * Math.cos(endAngle)
    const y3 = cy + r * Math.sin(endAngle)
    const x4 = cx + r * Math.cos(startAngle)
    const y4 = cy + r * Math.sin(startAngle)

    const largeArc = angleSpan > Math.PI ? 1 : 0

    const path = `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 ${largeArc} 0 ${x4} ${y4} Z`
    const percent = Math.round((item.value / total) * 100)

    return {
      ...item,
      path,
      index,
      percent,
    }
  })

  const currentHovered = hoveredIndex !== null ? items[hoveredIndex] : null
  const hoveredPercent =
    currentHovered && total > 0 ? Math.round((currentHovered.value / total) * 100) : null

  return (
    <article className="panel pie-chart-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">APPLICATION ACTIVITY</p>
          <h2>{title}</h2>
          {subtitle && <p className="panel-subtitle">{subtitle}</p>}
        </div>
        {link && (
          <Link to={link} className="chart-arrow-link" aria-label={`View details for ${title}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7"></line>
              <polyline points="7 7 17 7 17 17"></polyline>
            </svg>
          </Link>
        )}
      </div>

      <div className="pie-chart-content">
        <div className="pie-svg-container">
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="pie-svg"
            role="img"
            aria-label="Applications status donut chart"
          >
            {total === 0 ? (
              <circle
                cx={cx}
                cy={cy}
                r={(baseR + baseInnerR) / 2}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth={baseR - baseInnerR}
                className="pie-empty-ring"
              />
            ) : (
              slices.map((slice) =>
                slice.path ? (
                  <path
                    key={slice.status}
                    d={slice.path}
                    fill={slice.color}
                    className={`pie-slice ${hoveredIndex === slice.index ? "pie-slice--hovered" : ""}`}
                    onMouseEnter={() => setHoveredIndex(slice.index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                ) : null
              )
            )}
          </svg>

          <div className="pie-center-content" aria-live="polite">
            <span className="pie-center-value">
              {currentHovered ? currentHovered.value : total}
            </span>
            <span className="pie-center-label">
              {currentHovered
                ? `${currentHovered.status} (${hoveredPercent}%)`
                : total === 1 ? "Application" : "Applications"}
            </span>
          </div>
        </div>

        <div className="pie-legend-grid">
          {items.map((item, index) => {
            const isHovered = hoveredIndex === index
            const percent = total > 0 ? Math.round((item.value / total) * 100) : 0

            return (
              <div
                key={item.status}
                className={`pie-legend-item ${isHovered ? "pie-legend-item--hovered" : ""}`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="pie-legend-label-group">
                  <span
                    className="pie-legend-dot"
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                  <span className="pie-legend-status">{item.status}</span>
                </div>
                <div className="pie-legend-val-group">
                  <span className="pie-legend-count">{item.value}</span>
                  {total > 0 && <span className="pie-legend-percent">{percent}%</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </article>
  )
}

export default StatusPieChart
