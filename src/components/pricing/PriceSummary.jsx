import { pluralize } from '../../lib/dates.js'
import { formatNaira } from '../../lib/money.js'
import { Card, Divider } from '../ui/Card.jsx'
import styles from './PriceSummary.module.css'

/**
 * The all-in price breakdown (PRD BR-06). Always fed by buildQuote(), so the
 * total shown here is the exact amount charged at payment.
 */
export function PriceSummary({ quote }) {
  const basis = `${pluralize(quote.nights, 'night')} × ${pluralize(quote.rooms, 'room')}`

  return (
    <Card aria-label="Price summary">
      <dl className={styles.list}>
        <div className={styles.row}>
          <dt>
            Subtotal <span className={styles.basis}>({basis})</span>
          </dt>
          <dd>{formatNaira(quote.subtotal)}</dd>
        </div>
        <div className={styles.row}>
          <dt>Taxes &amp; fees</dt>
          <dd>{formatNaira(quote.taxesAndFees)}</dd>
        </div>
      </dl>
      <Divider />
      <div className={`${styles.row} ${styles.total}`}>
        <span>Total</span>
        <span>{formatNaira(quote.total)}</span>
      </div>
      <p className={styles.note}>Includes all taxes and mandatory fees. No charges at the hotel.</p>
    </Card>
  )
}
