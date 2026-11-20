import { CalendarCheck, ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { ErrorView, LoadingView } from '../../components/feedback/StatusView.jsx'
import { Screen } from '../../components/layout/AppShell.jsx'
import { ScreenHeader } from '../../components/layout/ScreenHeader.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { roomImage } from '../../data/images.js'
import { useAsync } from '../../hooks/useAsync.js'
import { formatDateRange } from '../../lib/dates.js'
import { formatKobo } from '../../lib/money.js'
import { errorMessage } from '../../services/api/errors.js'
import { listBookings } from '../../services/bookingService.js'
import { describeBooking } from './bookingStatus.js'
import styles from './BookingsPage.module.css'

const TONE_CLASS = { todo: styles.statusTodo, done: styles.statusDone, muted: styles.statusMuted }

/** GET /bookings: the guest's bookings, newest first. */
export function BookingsPage() {
  const bookings = useAsync((signal) => listBookings({ signal }), 'all')
  const header = <ScreenHeader title="My Bookings" backTo="/home" />

  if (bookings.status === 'loading') return <Screen header={header}><LoadingView /></Screen>
  if (bookings.status === 'error') {
    return (
      <Screen header={header}>
        <ErrorView message={errorMessage(bookings.error)} actionLabel="Try again" onAction={bookings.reload} />
      </Screen>
    )
  }

  return (
    <Screen header={header}>
      {bookings.data.length === 0 ? (
        <div className={styles.empty}>
          <CalendarCheck size={40} aria-hidden="true" />
          <p>No bookings yet.</p>
          <Button to="/search">Find a room</Button>
        </div>
      ) : (
        <ul className={styles.list}>
          {bookings.data.map((booking) => {
            const { hotel, roomType } = booking.room ?? {}
            const status = describeBooking(booking)
            return (
              <li key={booking.id}>
                <Card as="div" className={styles.item}>
                  <Link to={`/bookings/${booking.id}`} className={styles.link}>
                    <img src={roomImage(roomType)} alt="" className={styles.image} />
                    <span className={styles.text}>
                      <span className={styles.name}>{hotel?.name}</span>
                      <span className={styles.meta}>
                        {roomType?.name} · {formatDateRange(booking.checkIn, booking.checkOut)} · {formatKobo(booking.totalAmount)}
                      </span>
                      <span className={TONE_CLASS[status.tone]}>{status.label}</span>
                    </span>
                    <ChevronRight size={20} aria-hidden="true" />
                  </Link>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </Screen>
  )
}
