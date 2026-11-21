import { useEffect, useId, useRef, useState } from 'react'
import styles from './Dashboard.module.css'

// The SVG is drawn at its container's real pixel width (so 12px labels stay
// 12px on a phone); only the height is fixed.
const HEIGHT = 200
const PAD = { top: 16, right: 14, bottom: 28, left: 30 }
const PLOT_H = HEIGHT - PAD.top - PAD.bottom

/** Tracks an element's content width. */
function useWidth(fallback) {
  const ref = useRef(null)
  const [width, setWidth] = useState(fallback)
  useEffect(() => {
    const element = ref.current
    if (!element) return undefined
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, Math.round(entry.contentRect.width))))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return [ref, width]
}

/** A rounded-up axis maximum and evenly spaced ticks (always at least 0..4). */
function niceScale(max) {
  const top = Math.max(4, max)
  const step = Math.ceil(top / 4)
  return { max: step * 4, ticks: [0, step, step * 2, step * 3, step * 4] }
}

/**
 * Single-series line: new bookings per day over the last 7 days. One series,
 * so the card title names it and there is no legend. Hovering (or focusing)
 * a day shows its value; a visually hidden table carries the same numbers.
 */
export function WeeklyBookingsChart({ days }) {
  const titleId = useId()
  const [active, setActive] = useState(null)
  const [bodyRef, WIDTH] = useWidth(640)
  const PLOT_W = WIDTH - PAD.left - PAD.right
  const { max, ticks } = niceScale(Math.max(...days.map((d) => d.count)))
  const total = days.reduce((sum, d) => sum + d.count, 0)

  const x = (index) => PAD.left + (PLOT_W * index) / (days.length - 1)
  const y = (value) => PAD.top + PLOT_H - (PLOT_H * value) / max
  const line = days.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(d.count)}`).join(' ')
  const area = `${line} L${x(days.length - 1)},${y(0)} L${x(0)},${y(0)} Z`
  const point = active === null ? null : days[active]

  return (
    <figure className={styles.chartCard} aria-labelledby={titleId}>
      <figcaption className={styles.chartHead}>
        <h2 id={titleId} className={styles.chartTitle}>
          Weekly bookings
        </h2>
        <p className={styles.chartMeta}>{total} new in the last 7 days</p>
      </figcaption>

      <div ref={bodyRef} className={styles.chartBody} onMouseLeave={() => setActive(null)}>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width={WIDTH} height={HEIGHT} className={styles.chartSvg} role="img" aria-label={`New bookings per day, last 7 days: ${total} in total`}>
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} className={tick === 0 ? styles.baseline : styles.grid} />
              <text x={PAD.left - 8} y={y(tick)} className={styles.axisLabel} textAnchor="end" dominantBaseline="middle">
                {tick}
              </text>
            </g>
          ))}

          <path d={area} className={styles.area} />
          <path d={line} className={styles.line} />

          {point && <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={y(0)} className={styles.crosshair} />}

          {days.map((d, i) => (
            <g key={d.day}>
              <text x={x(i)} y={HEIGHT - 8} className={`${styles.axisLabel} ${i === active ? styles.axisActive : ''}`} textAnchor="middle">
                {d.short}
              </text>
              <circle cx={x(i)} cy={y(d.count)} r={i === active ? 6 : 4} className={styles.dot} />
              {/* Hit target: the whole column for this day, much larger than the dot. */}
              <rect
                x={x(i) - PLOT_W / (days.length - 1) / 2}
                y={PAD.top}
                width={PLOT_W / (days.length - 1)}
                height={PLOT_H}
                className={styles.hit}
                tabIndex={0}
                aria-label={`${d.long}: ${d.count} ${d.count === 1 ? 'booking' : 'bookings'}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              />
            </g>
          ))}
        </svg>

        {point && (
          <div
            className={styles.tooltip}
            style={{
              left: `${(x(active) / WIDTH) * 100}%`,
              top: `${(y(point.count) / HEIGHT) * 100}%`,
            }}
            data-edge={active === 0 ? 'start' : active === days.length - 1 ? 'end' : undefined}
            aria-hidden="true"
          >
            <span className={styles.tooltipDay}>{point.long}</span>
            <span className={styles.tooltipValue}>
              {point.count} {point.count === 1 ? 'booking' : 'bookings'}
            </span>
          </div>
        )}
      </div>

      <table className="visually-hidden">
        <caption>New bookings per day, last 7 days</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Bookings</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.day}>
              <th scope="row">{d.long}</th>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
