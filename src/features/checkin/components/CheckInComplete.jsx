import { KeyRound } from 'lucide-react'
import { Button } from '../../../components/ui/Button.jsx'
import { Card } from '../../../components/ui/Card.jsx'
import { formatClock, formatDateRange } from '../../../lib/dates.js'
import { getIdDocument, idTypeLabel } from '../../../services/mock/idDocumentService.js'
import { CheckInHero } from './CheckInHero.jsx'
import { CheckInQr } from './CheckInQr.jsx'
import styles from './CheckIn.module.css'

export function CheckInComplete({ booking, arrival }) {
  const hotel = booking.room?.hotel
  const idDocument = getIdDocument(booking.id)

  return (
    <>
      <CheckInHero title="You’re checked in!" subtitle="Show your QR code at the front desk to collect your room key." />
      <CheckInQr bookingId={booking.id} />
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
            <dd>
              {idDocument
                ? `${idTypeLabel(idDocument.idType)} added. Bring the original with you.`
                : 'Show a valid government ID at the front desk'}
            </dd>
          </div>
        </dl>
      </Card>
      <div className={styles.completeActions}>
        <Button fullWidth to={`/bookings/${booking.id}/key`} iconRight={<KeyRound size={18} aria-hidden="true" />}>
          Your digital key
        </Button>
        <Button fullWidth variant="secondary" to={`/bookings/${booking.id}`}>
          View booking
        </Button>
      </div>
    </>
  )
}
