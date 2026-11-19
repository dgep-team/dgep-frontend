import { CalendarCheck, ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { ErrorView, LoadingView } from '../../components/feedback/StatusView.jsx'
import { Screen } from '../../components/layout/AppShell.jsx'
import { ScreenHeader } from '../../components/layout/ScreenHeader.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { formatDateRange } from '../../lib/dates.js'
import { formatNaira } from '../../lib/money.js'
import { listBookings } from '../../services/bookingService.js'
import styles from './BookingsPage.module.css'

export function BookingsPage() {
  const bookings = useAsync(listBookings, 'all')
  const header = <ScreenHeader title="My Bookings" backTo="/home" />

  if (bookings.status === 'loading') return <Screen header={header}><LoadingView /></Screen>
  if (bookings.status === 'error') return <Screen header={header}><ErrorView message={bookings.error.message} /></Screen>

  return (
    <Screen header={header}>
      {bookings.data.length === 0 ? (
        <div className={styles.empty}>
          <CalendarCheck size={40} aria-hidden="true" />
          <p>No bookings yet.</p>
          <Button to="/booking">Continue your booking</Button>
        </div>
      ) : (
        <ul className={styles.list}>
          {bookings.data.map((booking) => (
            <li key={booking.id}>
              <Card as="div" className={styles.item}>
                <Link to={`/bookings/${booking.id}/check-in`} className={styles.link}>
                  <img src={booking.hotel.imageUrl} alt="" className={styles.image} />
                  <span className={styles.text}>
                    <span className={styles.name}>{booking.hotel.name}</span>
                    <span className={styles.meta}>
                      {formatDateRange(booking.checkIn, booking.checkOut)} · {formatNaira(booking.quote.total)}
                    </span>
                    <span className={booking.preCheckIn ? styles.statusDone : styles.statusTodo}>
                      {booking.preCheckIn ? 'Checked in' : 'Check-in available'}
                    </span>
                  </span>
                  <ChevronRight size={20} aria-hidden="true" />
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  )
}
