import { BedDouble, MapPin, Maximize2, Users } from 'lucide-react'
import { SaveButton } from '../../../components/saved/SaveButton.jsx'
import { Button } from '../../../components/ui/Button.jsx'
import { roomImage } from '../../../data/images.js'
import { pluralize } from '../../../lib/dates.js'
import { formatKobo } from '../../../lib/money.js'
import styles from './Search.module.css'

/** One room type in the results, with the server's all-in total for the dates (taxes included). */
export function RoomResultCard({ entry, selected, onSelect }) {
  const { hotel, roomType, tier } = entry
  const headingId = `room-${roomType.id}`
  const { price } = roomType

  return (
    <article className={`${styles.card} ${selected ? styles.cardSelected : ''}`} aria-labelledby={headingId}>
      <div className={styles.media}>
        <img src={roomImage(roomType)} alt={`${roomType.name} at ${hotel.name}`} loading="lazy" className={styles.image} />
        <span className={`${styles.tierTag} ${styles[`tier_${tier.id}`] ?? ''}`}>{tier.label}</span>
        {selected && <span className={styles.selectedTag}>Your selection</span>}
        <SaveButton kind="room" hotel={hotel} roomType={roomType} className={styles.saveSlot} />
      </div>

      <div className={styles.body}>
        <div className={styles.titleRow}>
          <h2 id={headingId} className={styles.roomName}>
            {roomType.name}
          </h2>
          {roomType.availableRooms <= 2 && (
            <span className={styles.scarce}>{pluralize(roomType.availableRooms, 'room')} left</span>
          )}
        </div>
        <p className={styles.hotelLine}>
          <MapPin size={14} aria-hidden="true" />
          {hotel.name} · {hotel.city}
        </p>
        {roomType.description && <p className={styles.description}>{roomType.description}</p>}

        <ul className={styles.facts}>
          {roomType.bedType && (
            <li>
              <BedDouble size={16} aria-hidden="true" />
              {roomType.bedType}
            </li>
          )}
          {roomType.sizeSqm && (
            <li>
              <Maximize2 size={16} aria-hidden="true" />
              {roomType.sizeSqm} m²
            </li>
          )}
          <li>
            <Users size={16} aria-hidden="true" />
            Up to {roomType.maxGuests}
          </li>
        </ul>

        <div className={styles.priceRow}>
          <div>
            <p className={styles.rate}>
              <strong>{formatKobo(roomType.pricePerNight)}</strong> <span className={styles.muted}>/ night</span>
            </p>
            {price && (
              <p className={styles.allIn}>
                {formatKobo(price.total)} total · {pluralize(price.nights, 'night')}, incl. taxes
              </p>
            )}
          </div>
          <Button
            variant={selected ? 'secondary' : 'primary'}
            onClick={() => onSelect(entry)}
            aria-label={`Select ${roomType.name} at ${hotel.name}`}
          >
            {selected ? 'Continue' : 'Select'}
          </Button>
        </div>
      </div>
    </article>
  )
}
