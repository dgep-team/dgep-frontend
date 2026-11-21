import { BedDouble, CalendarDays, Hotel } from 'lucide-react'
import { Card } from '../../../components/ui/Card.jsx'
import { formatDateRange, nightsBetween, pluralize } from '../../../lib/dates.js'
import styles from './CheckIn.module.css'

/** Hotel name, room type and dates: the top card of the check-in screens. */
export function StaySummaryCard({ booking }) {
  const { hotel, roomType } = booking.room ?? {}
  const nights = nightsBetween(booking.checkIn, booking.checkOut)

  return (
    <Card tone="muted" aria-label="Your stay">
      <ul className={styles.stayList}>
        <li className={styles.stayHotel}>
          <Hotel size={20} className={styles.icon} aria-hidden="true" />
          {hotel?.name ?? 'Your hotel'}
        </li>
        {roomType?.name && (
          <li>
            <BedDouble size={20} className={styles.icon} aria-hidden="true" />
            {roomType.name}
          </li>
        )}
        <li>
          <CalendarDays size={20} className={styles.icon} aria-hidden="true" />
          {formatDateRange(booking.checkIn, booking.checkOut)} · {pluralize(nights, 'night')}
        </li>
      </ul>
    </Card>
  )
}
