import { ArrowRight, Heart, MapPin } from 'lucide-react'
import { Link } from 'react-router'
import { Screen } from '../../components/layout/AppShell.jsx'
import { ScreenHeader } from '../../components/layout/ScreenHeader.jsx'
import { SaveButton } from '../../components/saved/SaveButton.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { hotelImage, roomImage } from '../../data/images.js'
import { pluralize } from '../../lib/dates.js'
import { formatKobo } from '../../lib/money.js'
import { useSaved } from '../../state/savedContext.js'
import { useSelectRoom } from '../search/useSelectRoom.js'
import styles from './SavedPage.module.css'

const savedOn = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

/** Rooms and hotels the guest saved to come back to. */
export function SavedPage() {
  const { items, rooms, hotels, scope } = useSaved()
  const header = <ScreenHeader title="Saved" backTo="/home" />

  if (items.length === 0) {
    return (
      <Screen header={header} width="narrow">
        <div className={styles.empty}>
          <span className={styles.emptyIcon} aria-hidden="true">
            <Heart size={32} />
          </span>
          <p className={styles.emptyTitle}>No saves yet</p>
          <p className={styles.emptyText}>Tap the heart on a room or hotel to keep it here for later.</p>
          <Button to="/search">Find a room</Button>
        </div>
      </Screen>
    )
  }

  return (
    <Screen header={header}>
      <p className={styles.summary}>
        {pluralize(items.length, 'save')}
        {scope === 'device' && ' · on this device. Log in to keep them with your account.'}
      </p>

      {rooms.length > 0 && (
        <section className={styles.section} aria-labelledby="saved-rooms">
          <h2 id="saved-rooms" className={styles.sectionTitle}>
            Rooms <span className={styles.count}>{rooms.length}</span>
          </h2>
          <ul className={styles.grid}>
            {rooms.map((item) => (
              <li key={item.id}>
                <SavedRoomCard item={item} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {hotels.length > 0 && (
        <section className={styles.section} aria-labelledby="saved-hotels">
          <h2 id="saved-hotels" className={styles.sectionTitle}>
            Hotels <span className={styles.count}>{hotels.length}</span>
          </h2>
          <ul className={styles.grid}>
            {hotels.map((item) => (
              <li key={item.id}>
                <SavedHotelCard item={item} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </Screen>
  )
}

function SavedRoomCard({ item }) {
  const selectRoom = useSelectRoom()
  const { hotel, roomType } = item

  return (
    <article className={styles.card} aria-labelledby={`${item.id}-name`}>
      <div className={styles.media}>
        <img src={roomImage(roomType)} alt={`${roomType.name} at ${hotel.name}`} loading="lazy" />
        <SaveButton kind="room" hotel={hotel} roomType={roomType} className={styles.save} />
      </div>
      <div className={styles.body}>
        <h3 id={`${item.id}-name`} className={styles.name}>
          {roomType.name}
        </h3>
        <p className={styles.meta}>
          <MapPin size={14} aria-hidden="true" />
          {[hotel.name, hotel.city].filter(Boolean).join(' · ')}
        </p>
        <div className={styles.foot}>
          <div>
            <p>
              <strong>{formatKobo(roomType.pricePerNight)}</strong>
              <span className={styles.muted}> / night</span>
            </p>
            <p className={styles.note}>Price when saved {savedOn.format(new Date(item.savedAt))}</p>
          </div>
          <Button onClick={() => selectRoom({ hotel, roomType })} aria-label={`Book ${roomType.name} at ${hotel.name}`}>
            Book
          </Button>
        </div>
      </div>
    </article>
  )
}

function SavedHotelCard({ item }) {
  const { hotel } = item

  return (
    <article className={styles.card} aria-labelledby={`${item.id}-name`}>
      <div className={styles.media}>
        <img src={hotelImage(hotel)} alt={hotel.name} loading="lazy" />
        <SaveButton kind="hotel" hotel={hotel} className={styles.save} />
      </div>
      <div className={styles.body}>
        <h3 id={`${item.id}-name`} className={styles.name}>
          {hotel.name}
        </h3>
        <p className={styles.meta}>
          <MapPin size={14} aria-hidden="true" />
          {[hotel.address, hotel.city].filter(Boolean).join(', ')}
        </p>
        <div className={styles.foot}>
          <p>
            {hotel.fromPricePerNight ? (
              <>
                <span className={styles.muted}>From </span>
                <strong>{formatKobo(hotel.fromPricePerNight)}</strong>
                <span className={styles.muted}> / night</span>
              </>
            ) : (
              <span className={styles.muted}>Saved {savedOn.format(new Date(item.savedAt))}</span>
            )}
          </p>
          <Link to={`/search?q=${encodeURIComponent(hotel.name)}`} className={styles.viewRooms}>
            View rooms <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  )
}
