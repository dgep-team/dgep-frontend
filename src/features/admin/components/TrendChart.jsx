import { useEffect, useId, useRef, useState } from 'react'
import styles from './Charts.module.css'

// Drawn at the container's real pixel width so 12px labels stay 12px on a
// phone; only the height is fixed.
const HEIGHT = 200
const PAD = { top: 16, right: 14, bottom: 28, left: 44 }
const PLOT_H = HEIGHT - PAD.top - PAD.bottom

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

/** A rounded axis top and 5 evenly spaced ticks (1, 2, 2.5 or 5 x 10^n steps). */
function niceScale(max) {
  const raw = Math.max(max, 4) / 4
  const power = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= raw)
  return { max: step * 4, ticks: [0, 1, 2, 3, 4].map((i) => i * step) }
}

/**
 * Single-series line over days. `points`: [{ key, short, long, value }].
 * One series, so the title names it and there is no legend. Hover or focus a
 * day for its value; a visually hidden table carries the same numbers.
 */
export function TrendChart({ title, meta, points, format = String, formatAxis = format, unit }) {
  const titleId = useId()
  const [active, setActive] = useState(null)
  const [bodyRef, width] = useWidth(640)
  const plotW = width - PAD.left - PAD.right
  const { max, ticks } = niceScale(Math.max(0, ...points.map((p) => p.value)))
  const n = points.length
  const labelEvery = Math.ceil(n / 7)
  const showDots = n <= 14
  const step = plotW / Math.max(1, n - 1)

  const x = (index) => PAD.left + step * index
  const y = (value) => PAD.top + PLOT_H - (PLOT_H * value) / max
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.value)}`).join(' ')
  const area = `${line} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z`
  const point = active === null ? null : points[active]

  return (
    <figure className={styles.card} aria-labelledby={titleId}>
      <figcaption className={styles.head}>
        <h3 id={titleId} className={styles.title}>
          {title}
        </h3>
        {meta && <p className={styles.meta}>{meta}</p>}
      </figcaption>

      <div ref={bodyRef} className={styles.body} onMouseLeave={() => setActive(null)}>
        <svg width={width} height={HEIGHT} className={styles.svg} role="img" aria-label={`${title}${meta ? `: ${meta}` : ''}`}>
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} className={tick === 0 ? styles.baseline : styles.grid} />
              <text x={PAD.left - 8} y={y(tick)} className={styles.axisLabel} textAnchor="end" dominantBaseline="middle">
                {formatAxis(tick)}
              </text>
            </g>
          ))}

          <path d={area} className={styles.area} />
          <path d={line} className={styles.line} />
          {point && <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={y(0)} className={styles.crosshair} />}

          {points.map((p, i) => (
            <g key={p.key}>
              {(n - 1 - i) % labelEvery === 0 && (
                <text x={x(i)} y={HEIGHT - 8} className={`${styles.axisLabel} ${i === active ? styles.axisActive : ''}`} textAnchor="middle">
                  {p.short}
                </text>
              )}
              {(showDots || i === active) && <circle cx={x(i)} cy={y(p.value)} r={i === active ? 6 : 4} className={styles.dot} />}
              {/* Hit target: the whole column for this day, much larger than the dot. */}
              <rect
                x={x(i) - step / 2}
                y={PAD.top}
                width={step}
                height={PLOT_H}
                className={styles.hit}
                tabIndex={0}
                aria-label={`${p.long}: ${format(p.value)}${unit ? ` ${unit}` : ''}`}
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
            style={{ left: `${x(active)}px`, top: `${y(point.value)}px` }}
            data-edge={x(active) < 90 ? 'start' : x(active) > width - 90 ? 'end' : undefined}
            aria-hidden="true"
          >
            <span className={styles.tooltipDay}>{point.long}</span>
            <span className={styles.tooltipValue}>
              {format(point.value)}
              {unit ? ` ${unit}` : ''}
            </span>
          </div>
        )}
      </div>

      <table className="visually-hidden">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">{unit ?? 'Value'}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.key}>
              <th scope="row">{p.long}</th>
              <td>{format(p.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
