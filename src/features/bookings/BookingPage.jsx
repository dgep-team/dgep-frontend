import { Car, Clock, MapPin, Phone, Signpost } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router'
import { Alert } from '../../components/feedback/Alert.jsx'
import { ErrorView, LoadingView } from '../../components/feedback/StatusView.jsx'
import { Screen, SplitLayout } from '../../components/layout/AppShell.jsx'
import { ScreenHeader } from '../../components/layout/ScreenHeader.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { formatClock, formatDateRange, formatTimestamp, nightsBetween, pluralize } from '../../lib/dates.js'
import { formatKobo } from '../../lib/money.js'
import { ERROR_CODES, errorMessage } from '../../services/api/errors.js'
import { BOOKING_STATUS, cancelBooking, getArrivalInfo } from '../../services/bookingService.js'
import { loadPayableBooking } from '../payment/loadPayableBooking.js'
import { canCancel, canCheckInOnline, canMakeRequests, describeBooking, isPaid } from './bookingStatus.js'
import styles from './BookingPage.module.css'

/** One booking: GET /bookings/:id + /arrival. (After payment, guests land on PaymentSuccessPage first.) */
export function BookingPage() {
  const { bookingId } = useParams()

  const booking = useAsync(async (signal) => {
    const data = await loadPayableBooking(bookingId, signal)
    // Arrival details are for paid stays; a failure here shouldn't hide the booking.
    const arrival = isPaid(data) ? await getArrivalInfo(bookingId, { signal }).catch(() => null) : null
    return { ...data, arrival }
  }, bookingId)

  const [cancel, setCancel] = useState({ status: 'idle' })
  const header = <ScreenHeader title="Your booking" backTo="/bookings" />

  if (booking.status === 'loading') return <Screen header={header}><LoadingView label="Loading your booking…" /></Screen>
  if (booking.status === 'error') {
    return (
      <Screen header={header}>
        <ErrorView message={errorMessage(booking.error)} actionLabel="View my bookings" actionTo="/bookings" />
      </Screen>
    )
  }

  const data = booking.data
  const { hotel, roomType } = data.room ?? {}
  const { arrival } = data
  const status = describeBooking(data)
  const paidWith = data.payments?.find((payment) => payment.status === 'SUCCESS')

  const confirmCancel = async () => {
    setCancel({ status: 'cancelling' })
    try {
      const updated = await cancelBooking(data.id)
      booking.setData({ ...data, ...updated, arrival: null })
      setCancel({ status: 'done' })
    } catch (error) {
      setCancel({ status: 'error', error })
    }
  }

  return (
    <Screen header={header}>
      {cancel.status === 'done' && <Alert tone="success" title="Your booking is cancelled" />}

      <SplitLayout
        asideLabel="Booking actions"
        aside={
          <div className={styles.actions}>
            {data.status === BOOKING_STATUS.pending && (
              <Button fullWidth to={`/bookings/${data.id}/pay`}>
                Pay {formatKobo(data.totalAmount)}
              </Button>
            )}
            {canCheckInOnline(data) && (
              <Button fullWidth to={`/bookings/${data.id}/check-in`}>
                Check in online
              </Button>
            )}
            {data.onlineCheckInAt && data.status === BOOKING_STATUS.confirmed && (
              <Button fullWidth variant="secondary" to={`/bookings/${data.id}/check-in`}>
                View check-in
              </Button>
            )}
            {canMakeRequests(data) && (
              <Button fullWidth variant="secondary" to={`/bookings/${data.id}/requests`}>
                Requests to the hotel
              </Button>
            )}

            {canCancel(data) && cancel.status !== 'confirming' && cancel.status !== 'cancelling' && (
              <Button fullWidth variant="ghost" onClick={() => setCancel({ status: 'confirming' })}>
                Cancel booking
              </Button>
            )}
            {(cancel.status === 'confirming' || cancel.status === 'cancelling') && (
              <Alert
                tone="warning"
                title="Cancel this booking?"
                actions={
                  <>
                    <Button variant="secondary" onClick={confirmCancel} loading={cancel.status === 'cancelling'} loadingLabel="Cancelling…">
                      Yes, cancel
                    </Button>
                    <Button variant="ghost" onClick={() => setCancel({ status: 'idle' })} disabled={cancel.status === 'cancelling'}>
                      Keep it
                    </Button>
                  </>
                }
              >
                {roomType?.cancellationPolicy ?? 'The hotel’s cancellation policy applies.'}
              </Alert>
            )}
            {cancel.status === 'error' && (
              <Alert tone="error" title="We couldn’t cancel this booking">
                {cancel.error.code === ERROR_CODES.TOO_LATE_TO_CANCEL
                  ? 'It’s too late to cancel online. Please call the hotel.'
                  : errorMessage(cancel.error)}
              </Alert>
            )}
          </div>
        }
      >
        <Card aria-labelledby="booking-heading">
          <h2 id="booking-heading" className={styles.cardTitle}>
            {hotel?.name}
          </h2>
          <dl className={styles.summaryList}>
            <div>
              <dt>Status</dt>
              <dd>{status.label}</dd>
            </div>
            <div>
              <dt>Booking reference</dt>
              <dd className={styles.reference}>{data.id}</dd>
            </div>
            <div>
              <dt>Room</dt>
              <dd>
                {roomType?.name}
                {arrival?.roomNumber && ` · No. ${arrival.roomNumber}`}
              </dd>
            </div>
            <div>
              <dt>Stay</dt>
              <dd>
                {formatDateRange(data.checkIn, data.checkOut)} ({pluralize(nightsBetween(data.checkIn, data.checkOut), 'night')})
              </dd>
            </div>
            <div>
              <dt>Guests</dt>
              <dd>{data.guests}</dd>
            </div>
            {data.addOns?.length > 0 && (
              <div>
                <dt>Extras</dt>
                <dd>{data.addOns.map((addOn) => addOn.name ?? addOn.code).join(', ')}</dd>
              </div>
            )}
            <div>
              <dt>Total</dt>
              <dd>{formatKobo(data.totalAmount)}</dd>
            </div>
            {paidWith && (
              <div>
                <dt>Paid</dt>
                <dd>
                  {formatTimestamp(paidWith.paidAt)}
                  {paidWith.channel && ` · ${paidWith.channel}`}
                </dd>
              </div>
            )}
          </dl>
        </Card>

        {arrival && <ArrivalCard arrival={arrival} />}
      </SplitLayout>
    </Screen>
  )
}

function ArrivalCard({ arrival }) {
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${arrival.hotelName}, ${arrival.address}`)}`
  return (
    <Card tone="muted" aria-labelledby="arrival-heading">
      <h2 id="arrival-heading" className={styles.cardTitle}>
        Getting there
      </h2>
      <ul className={styles.infoList}>
        <li>
          <MapPin size={18} aria-hidden="true" />
          <a href={mapUrl} target="_blank" rel="noreferrer">
            {arrival.address}
          </a>
        </li>
        {arrival.phone && (
          <li>
            <Phone size={18} aria-hidden="true" />
            <a href={`tel:${arrival.phone.replace(/\s/g, '')}`}>{arrival.phone}</a>
          </li>
        )}
        <li>
          <Clock size={18} aria-hidden="true" />
          <span>
            Check-in from {formatClock(arrival.checkInTime)} · check-out by {formatClock(arrival.checkOutTime)}
          </span>
        </li>
        {arrival.arrivalInstructions && (
          <li>
            <Signpost size={18} aria-hidden="true" />
            <span>{arrival.arrivalInstructions}</span>
          </li>
        )}
        {arrival.parkingInfo && (
          <li>
            <Car size={18} aria-hidden="true" />
            <span>{arrival.parkingInfo}</span>
          </li>
        )}
      </ul>
    </Card>
  )
}
