import { ChevronRight } from 'lucide-react'
import { useId, useState } from 'react'
import { Card } from '../../../components/ui/Card.jsx'
import { roomImage } from '../../../data/images.js'
import { formatKobo } from '../../../lib/money.js'
import styles from './BookingCards.module.css'

/** The chosen room type. Tapping it reveals the room facts. Missing facts are left out. */
export function RoomSelectedCard({ roomType }) {
  const [open, setOpen] = useState(false)
  const detailsId = useId()

  return (
    <Card className={styles.roomCard}>
      <button
        type="button"
        className={styles.roomToggle}
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={() => setOpen((value) => !value)}
      >
        <img className={styles.roomImage} src={roomImage(roomType)} alt="" />
        <span className={styles.grow}>
          <span className={styles.roomName}>{roomType.name}</span>
          <span className={styles.roomPrice}>
            <strong>{formatKobo(roomType.pricePerNight)}</strong> <span className={styles.muted}>/ night</span>
          </span>
        </span>
        <ChevronRight size={22} className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} aria-hidden="true" />
        <span className="visually-hidden">{open ? 'Hide room details' : 'Show room details'}</span>
      </button>

      {open && (
        <dl id={detailsId} className={styles.roomFacts}>
          {roomType.description && <Fact term="About" value={roomType.description} />}
          <Fact term="Bed" value={roomType.bedType} />
          <Fact term="Occupancy" value={`Up to ${roomType.maxGuests} guests`} />
          <Fact term="Size" value={roomType.sizeSqm && `${roomType.sizeSqm} m²`} />
          <Fact term="View" value={roomType.view} />
          <Fact term="Amenities" value={roomType.amenities?.join(', ')} />
          <Fact term="Accessibility" value={roomType.accessibility?.join(', ')} />
          <Fact term="Cancellation" value={roomType.cancellationPolicy} />
        </dl>
      )}
    </Card>
  )
}

function Fact({ term, value }) {
  if (!value) return null
  return (
    <div className={styles.fact}>
      <dt>{term}</dt>
      <dd>{value}</dd>
    </div>
  )
}
