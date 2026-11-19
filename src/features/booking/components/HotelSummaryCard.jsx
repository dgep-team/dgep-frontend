import { MapPin, Star } from 'lucide-react'
import { Card } from '../../../components/ui/Card.jsx'
import styles from './BookingCards.module.css'

const reviewCount = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

export function HotelSummaryCard({ hotel }) {
  return (
    <Card className={styles.hotel} aria-label="Hotel">
      <img className={styles.hotelImage} src={hotel.imageUrl} alt={`${hotel.name} exterior`} />
      <div className={styles.hotelInfo}>
        <h2 className={styles.hotelName}>{hotel.name}</h2>
        <p className={styles.meta}>
          <Star size={16} className={styles.star} aria-hidden="true" />
          <span>
            {hotel.rating} <span className={styles.muted}>({reviewCount.format(hotel.reviewCount).toLowerCase()} reviews)</span>
          </span>
        </p>
        <p className={styles.meta}>
          <MapPin size={16} aria-hidden="true" />
          <span>{hotel.location}</span>
        </p>
      </div>
    </Card>
  )
}
