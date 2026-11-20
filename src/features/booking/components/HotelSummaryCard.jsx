import { Clock, MapPin } from 'lucide-react'
import { Card } from '../../../components/ui/Card.jsx'
import { hotelImage } from '../../../data/images.js'
import { formatClock } from '../../../lib/dates.js'
import styles from './BookingCards.module.css'

export function HotelSummaryCard({ hotel }) {
  return (
    <Card className={styles.hotel} aria-label="Hotel">
      <img className={styles.hotelImage} src={hotelImage(hotel)} alt={`${hotel.name}`} />
      <div className={styles.hotelInfo}>
        <h2 className={styles.hotelName}>{hotel.name}</h2>
        <p className={styles.meta}>
          <MapPin size={16} aria-hidden="true" />
          <span>{[hotel.address, hotel.city].filter(Boolean).join(', ')}</span>
        </p>
        {hotel.checkInTime && (
          <p className={styles.meta}>
            <Clock size={16} aria-hidden="true" />
            <span>
              Check-in from {formatClock(hotel.checkInTime)}
              {hotel.checkOutTime && ` · check-out by ${formatClock(hotel.checkOutTime)}`}
            </span>
          </p>
        )}
      </div>
    </Card>
  )
}
