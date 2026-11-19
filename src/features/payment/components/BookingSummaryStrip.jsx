import { Card } from '../../../components/ui/Card.jsx'
import { formatDateRange } from '../../../lib/dates.js'
import { formatNaira } from '../../../lib/money.js'
import styles from './Payment.module.css'

export function BookingSummaryStrip({ hotel, draft, total }) {
  return (
    <Card className={styles.summary} aria-label="Booking summary">
      <img className={styles.summaryImage} src={hotel.imageUrl} alt="" />
      <div className={styles.summaryText}>
        <p className={styles.summaryName}>{hotel.name}</p>
        <p className={styles.muted}>{formatDateRange(draft.checkIn, draft.checkOut)}</p>
      </div>
      <p className={styles.summaryTotal}>
        <span className="visually-hidden">Total </span>
        {formatNaira(total)}
      </p>
    </Card>
  )
}
