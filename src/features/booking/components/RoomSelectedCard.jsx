import { ChevronRight } from 'lucide-react'
import { useId, useState } from 'react'
import { Card } from '../../../components/ui/Card.jsx'
import { formatNaira } from '../../../lib/money.js'
import styles from './BookingCards.module.css'

/** The chosen room. Tapping it reveals the room facts from BR-05. */
export function RoomSelectedCard({ room }) {
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
        <img className={styles.roomImage} src={room.imageUrl} alt="" />
        <span className={styles.grow}>
          <span className={styles.roomName}>{room.name}</span>
          <span className={styles.roomPrice}>
            <strong>{formatNaira(room.nightlyRate)}</strong> <span className={styles.muted}>/ night</span>
          </span>
        </span>
        <ChevronRight
          size={22}
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
          aria-hidden="true"
        />
        <span className="visually-hidden">{open ? 'Hide room details' : 'Show room details'}</span>
      </button>

      {open && (
        <dl id={detailsId} className={styles.roomFacts}>
          <Fact term="Bed" value={room.bedType} />
          <Fact term="Occupancy" value={`Up to ${room.maxGuestsPerRoom} guests`} />
          <Fact term="Size" value={`${room.sizeSqm} m²`} />
          <Fact term="View" value={room.view} />
          <Fact term="Bathroom" value={room.bathroom} />
          <Fact term="Amenities" value={room.amenities.join(', ')} />
          <Fact term="Accessibility" value={room.accessibility} />
          <Fact term="Cancellation" value={room.cancellationPolicy} />
        </dl>
      )}
    </Card>
  )
}

function Fact({ term, value }) {
  return (
    <div className={styles.fact}>
      <dt>{term}</dt>
      <dd>{value}</dd>
    </div>
  )
}
