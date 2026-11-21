import { useState } from 'react'
import { useParams } from 'react-router'
import { Alert } from '../../../components/feedback/Alert.jsx'
import { ErrorView, LoadingView } from '../../../components/feedback/StatusView.jsx'
import { Button } from '../../../components/ui/Button.jsx'
import { Card } from '../../../components/ui/Card.jsx'
import { useAsync } from '../../../hooks/useAsync.js'
import { formatClock, formatTimestamp, nightsBetween, pluralize } from '../../../lib/dates.js'
import { formatKobo } from '../../../lib/money.js'
import { frontDeskCheckIn, getHotelBooking } from '../../../services/adminService.js'
import { ERROR_CODES, errorMessage } from '../../../services/api/errors.js'
import { BOOKING_STATUS } from '../../../services/bookingService.js'
import { describeHotelBooking, guestName, roomLabel, stayLabel } from '../adminData.js'
import { AdminScreen } from '../components/AdminShell.jsx'
import styles from '../components/AdminList.module.css'

/** One booking at the hotel: GET /admin/bookings/:id, with front-desk check-in. */
export function AdminBookingPage() {
  const { bookingId } = useParams()
  const page = useAsync((signal) => getHotelBooking(bookingId, { signal }), bookingId)
  const [checkIn, setCheckIn] = useState({ status: 'idle' })

  const title = page.status === 'success' ? roomLabel(page.data) : 'Booking'

  return (
    <AdminScreen title={title} backTo="/admin/bookings">
      {page.status === 'loading' && <LoadingView label="Loading booking…" />}
      {page.status === 'error' && (
        <ErrorView message={errorMessage(page.error)} actionLabel="Back to bookings" actionTo="/admin/bookings" />
      )}
      {page.status === 'success' && (
        <BookingDetails
          booking={page.data}
          checkIn={checkIn}
          onCheckIn={async () => {
            setCheckIn({ status: 'working' })
            try {
              await frontDeskCheckIn(bookingId)
              setCheckIn({ status: 'done' })
              page.refresh()
            } catch (error) {
              setCheckIn({ status: 'error', error })
            }
          }}
        />
      )}
    </AdminScreen>
  )
}

function BookingDetails({ booking, checkIn, onCheckIn }) {
  const status = describeHotelBooking(booking)
  const guest = booking.guest ?? {}
  const canCheckIn = booking.status === BOOKING_STATUS.confirmed

  return (
    <>
      {checkIn.status === 'done' && <Alert tone="success" title={`${guestName(booking)} is checked in`} />}

      <Card aria-labelledby="stay-heading">
        <h2 id="stay-heading" className={styles.cardTitle}>
          Stay
        </h2>
        <dl className={styles.details}>
          <div>
            <dt>Status</dt>
            <dd>
              <span className={`${styles.pill} ${styles[status.tone]}`}>{status.label}</span>
            </dd>
          </div>
          <div>
            <dt>Room</dt>
            <dd>
              {roomLabel(booking)}
              {booking.room?.roomType?.name && roomLabel(booking) !== booking.room.roomType.name && ` · ${booking.room.roomType.name}`}
            </dd>
          </div>
          <div>
            <dt>Dates</dt>
            <dd>
              {stayLabel(booking)} ({pluralize(nightsBetween(booking.checkIn, booking.checkOut), 'night')})
            </dd>
          </div>
          <div>
            <dt>Guests</dt>
            <dd>{booking.guests}</dd>
          </div>
          <div>
            <dt>Arrival</dt>
            <dd>{booking.arrivalTime ? formatClock(booking.arrivalTime) : 'Not given'}</dd>
          </div>
          {booking.onlineCheckInAt && (
            <div>
              <dt>Online check-in</dt>
              <dd>{formatTimestamp(booking.onlineCheckInAt)}</dd>
            </div>
          )}
          {booking.specialRequests && (
            <div>
              <dt>Requests</dt>
              <dd>{booking.specialRequests}</dd>
            </div>
          )}
          <div>
            <dt>Total</dt>
            <dd>{formatKobo(booking.totalAmount)}</dd>
          </div>
          <div>
            <dt>Reference</dt>
            <dd>{booking.id}</dd>
          </div>
        </dl>
      </Card>

      <Card aria-labelledby="guest-heading">
        <h2 id="guest-heading" className={styles.cardTitle}>
          Guest
        </h2>
        <dl className={styles.details}>
          <div>
            <dt>Name</dt>
            <dd>{guestName(booking)}</dd>
          </div>
          {guest.email && (
            <div>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${guest.email}`}>{guest.email}</a>
              </dd>
            </div>
          )}
          {guest.phone && (
            <div>
              <dt>Phone</dt>
              <dd>
                <a href={`tel:${guest.phone}`}>{guest.phone}</a>
              </dd>
            </div>
          )}
        </dl>
      </Card>

      {canCheckIn && (
        <div className={styles.actions}>
          {checkIn.status === 'error' && (
            <Alert tone="error" title="Couldn’t check this guest in">
              {checkIn.error.code === ERROR_CODES.BOOKING_NOT_PAID
                ? 'This booking isn’t paid yet.'
                : checkIn.error.code === ERROR_CODES.BOOKING_CLOSED
                  ? 'This booking is cancelled or the stay has ended.'
                  : errorMessage(checkIn.error)}
            </Alert>
          )}
          <Button fullWidth onClick={onCheckIn} loading={checkIn.status === 'working'} loadingLabel="Checking in…">
            Check in at front desk
          </Button>
        </div>
      )}
    </>
  )
}
