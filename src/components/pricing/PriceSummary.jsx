import { pluralize } from '../../lib/dates.js'
import { formatKobo } from '../../lib/money.js'
import { Card, Divider } from '../ui/Card.jsx'
import styles from './PriceSummary.module.css'

/**
 * The all-in price exactly as the API calculated it (the `Price` object):
 * room, add-ons, each tax, total. The app never recomputes it, so the total
 * shown is the amount Paystack will charge.
 */
export function PriceSummary({ price, note }) {
  if (!price) return null

  return (
    <Card aria-label="Price summary">
      <dl className={styles.list}>
        <div className={styles.row}>
          <dt>
            Room{' '}
            <span className={styles.basis}>
              ({pluralize(price.nights, 'night')} × {formatKobo(price.pricePerNight)})
            </span>
          </dt>
          <dd>{formatKobo(price.roomTotal)}</dd>
        </div>
        {price.addOns?.map((addOn) => (
          <div key={addOn.code} className={styles.row}>
            <dt>
              {addOn.name} {addOn.quantity > 1 && <span className={styles.basis}>(× {addOn.quantity})</span>}
            </dt>
            <dd>{formatKobo(addOn.amount)}</dd>
          </div>
        ))}
        {price.taxes?.map((tax) => (
          <div key={tax.name} className={styles.row}>
            <dt>
              {tax.name} <span className={styles.basis}>({tax.percent}%)</span>
            </dt>
            <dd>{formatKobo(tax.amount)}</dd>
          </div>
        ))}
      </dl>
      <Divider />
      <div className={`${styles.row} ${styles.total}`}>
        <span>Total</span>
        <span>{formatKobo(price.total)}</span>
      </div>
      <p className={styles.note}>{note ?? 'Includes all taxes and mandatory fees. No charges at the hotel.'}</p>
    </Card>
  )
}
