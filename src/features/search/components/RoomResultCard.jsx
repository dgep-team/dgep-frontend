import { BedDouble, MapPin, Maximize2, Star, Users } from 'lucide-react'
import { Button } from '../../../components/ui/Button.jsx'
import { pluralize } from '../../../lib/dates.js'
import { formatNaira } from '../../../lib/money.js'
import { buildQuote } from '../../../lib/pricing.js'
import styles from './Search.module.css'

/** One room in the results. Shows the all-in total for the current dates (BR-02, BR-06). */
export function RoomResultCard({ entry, stay, selected, onSelect }) {
  const { hotel, room, tier } = entry
  const quote = buildQuote({ room, checkIn: stay.checkIn, checkOut: stay.checkOut, rooms: 1 })

  return (
    <article className={`${styles.card} ${selected ? styles.cardSelected : ''}`} aria-labelledby={`room-${hotel.id}-${room.id}`}>
      <div className={styles.media}>
        <img src={room.imageUrl} alt={`${room.name} at ${hotel.name}`} loading="lazy" className={styles.image} />
        <span className={`${styles.tierTag} ${styles[`tier_${tier.id}`]}`}>{tier.label}</span>
        {selected && <span className={styles.selectedTag}>Your selection</span>}
      </div>

      <div className={styles.body}>
        <div className={styles.titleRow}>
          <h2 id={`room-${hotel.id}-${room.id}`} className={styles.roomName}>
            {room.name}
          </h2>
          <span className={styles.rating}>
            <Star size={14} className={styles.star} aria-hidden="true" />
            {hotel.rating}
            <span className="visually-hidden"> out of 5</span>
          </span>
        </div>
        <p className={styles.hotelLine}>
          <MapPin size={14} aria-hidden="true" />
          {hotel.name} · {hotel.location}
        </p>
        <p className={styles.description}>{room.description}</p>

        <ul className={styles.facts}>
          <li>
            <BedDouble size={16} aria-hidden="true" />
            {room.bedType}
          </li>
          <li>
            <Maximize2 size={16} aria-hidden="true" />
            {room.sizeSqm} m²
          </li>
          <li>
            <Users size={16} aria-hidden="true" />
            Up to {room.maxGuestsPerRoom}
          </li>
        </ul>

        <div className={styles.priceRow}>
          <div>
            <p className={styles.rate}>
              <strong>{formatNaira(room.nightlyRate)}</strong> <span className={styles.muted}>/ night</span>
            </p>
            <p className={styles.allIn}>
              {formatNaira(quote.total)} total · {pluralize(quote.nights, 'night')}, incl. taxes &amp; fees
            </p>
          </div>
          <Button
            variant={selected ? 'secondary' : 'primary'}
            onClick={() => onSelect(entry)}
            aria-label={`Select ${room.name} at ${hotel.name}`}
          >
            {selected ? 'Continue' : 'Select'}
          </Button>
        </div>
      </div>
    </article>
  )
}
