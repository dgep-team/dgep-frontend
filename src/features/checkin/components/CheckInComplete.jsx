import { Button } from '../../../components/ui/Button.jsx'
import { Card } from '../../../components/ui/Card.jsx'
import { formatClock, formatDateRange } from '../../../lib/dates.js'
import { CheckInHero } from './CheckInHero.jsx'
import styles from './CheckIn.module.css'

export function CheckInComplete({ booking, arrival }) {
  const hotel = booking.room?.hotel

  return (
    <>
      <CheckInHero title="You’re checked in!" subtitle="Give your booking reference at the front desk to collect your room key." />
      <Card aria-label="Check-in summary">
        <dl className={styles.summaryList}>
          <div>
            <dt>Booking reference</dt>
            <dd className={styles.reference}>{booking.id}</dd>
          </div>
          <div>
            <dt>Hotel</dt>
            <dd>{hotel?.name}</dd>
          </div>
          <div>
            <dt>Stay</dt>
            <dd>{formatDateRange(booking.checkIn, booking.checkOut)}</dd>
          </div>
          <div>
            <dt>Arrival</dt>
            <dd>{booking.arrivalTime ? formatClock(booking.arrivalTime) : 'Not specified'}</dd>
          </div>
          {arrival?.roomNumber && (
            <div>
              <dt>Room</dt>
              <dd>{arrival.roomNumber}</dd>
            </div>
          )}
          {booking.specialRequests && (
            <div>
              <dt>Requests</dt>
              <dd>{booking.specialRequests}</dd>
            </div>
          )}
          <div>
            <dt>ID</dt>
            <dd>Show a valid government ID at the front desk</dd>
          </div>
        </dl>
      </Card>
      <Button fullWidth to={`/bookings/${booking.id}`}>
        View booking
      </Button>
    </>
  )
}
