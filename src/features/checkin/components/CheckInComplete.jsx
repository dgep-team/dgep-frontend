import { Card } from '../../../components/ui/Card.jsx'
import { Button } from '../../../components/ui/Button.jsx'
import { formatDateRange } from '../../../lib/dates.js'
import { ARRIVAL_WINDOWS } from '../arrivalWindows.js'
import { CheckInHero } from './CheckInHero.jsx'
import styles from './CheckIn.module.css'

export function CheckInComplete({ booking }) {
  const { preCheckIn, hotel } = booking
  const arrival = ARRIVAL_WINDOWS.find((option) => option.value === preCheckIn.arrivalTime)

  return (
    <>
      <CheckInHero
        title="You’re checked in!"
        subtitle="Give your booking reference at the front desk to collect your room key."
      />
      <Card aria-label="Check-in summary">
        <dl className={styles.summaryList}>
          <div>
            <dt>Booking reference</dt>
            <dd className={styles.reference}>{booking.id}</dd>
          </div>
          <div>
            <dt>Hotel</dt>
            <dd>{hotel.name}</dd>
          </div>
          <div>
            <dt>Stay</dt>
            <dd>{formatDateRange(booking.checkIn, booking.checkOut)}</dd>
          </div>
          <div>
            <dt>Arrival</dt>
            <dd>{arrival?.value ? arrival.label : 'Not specified'}</dd>
          </div>
          <div>
            <dt>ID</dt>
            <dd>{preCheckIn.idDocumentProvided ? 'Uploaded' : 'Show a valid government ID at the front desk'}</dd>
          </div>
        </dl>
      </Card>
      <Button fullWidth to="/bookings">
        View my bookings
      </Button>
    </>
  )
}
