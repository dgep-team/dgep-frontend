import { Card } from '../../../components/ui/Card.jsx'
import { roomImage } from '../../../data/images.js'
import { formatDateRange } from '../../../lib/dates.js'
import { formatKobo } from '../../../lib/money.js'
import styles from './Payment.module.css'

/** Compact booking line: hotel, room, dates and the total in kobo. */
export function BookingSummaryStrip({ booking }) {
  const { hotel, roomType } = booking.room ?? {}

  return (
    <Card className={styles.summary} aria-label="Booking summary">
      <img className={styles.summaryImage} src={roomImage(roomType)} alt="" />
      <div className={styles.summaryText}>
        <p className={styles.summaryName}>{hotel?.name}</p>
        <p className={styles.muted}>
          {roomType?.name} · {formatDateRange(booking.checkIn, booking.checkOut)}
        </p>
      </div>
      <p className={styles.summaryTotal}>
        <span className="visually-hidden">Total </span>
        {formatKobo(booking.totalAmount)}
      </p>
    </Card>
  )
}
