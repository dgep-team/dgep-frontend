import { useId } from 'react'
import styles from './Charts.module.css'

/**
 * Ranked horizontal bars for a breakdown (one measure, one hue). Every row
 * prints its value, so nothing depends on reading bar length alone.
 * `items`: [{ label, value }].
 */
export function BarList({ title, items, format = String, empty = 'Nothing yet.' }) {
  const titleId = useId()
  const max = Math.max(0, ...items.map((item) => item.value))

  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <h3 id={titleId} className={styles.title}>
        {title}
      </h3>
      {items.length === 0 || max === 0 ? (
        <p className={styles.meta}>{empty}</p>
      ) : (
        <ul className={styles.bars}>
          {items.map((item) => (
            <li key={item.label} className={styles.barRow}>
              <span className={styles.barLabel}>{item.label}</span>
              <span className={styles.barValue}>{format(item.value)}</span>
              <span className={styles.barTrack} aria-hidden="true">
                <span className={styles.barFill} style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
