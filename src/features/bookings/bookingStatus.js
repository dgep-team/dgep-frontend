import { BOOKING_STATUS } from '../../services/bookingService.js'
import { toIsoDate, stayDate } from '../../lib/dates.js'

/** Guest-facing label and tone for a booking. tone: 'todo' | 'done' | 'muted'. */
export function describeBooking(booking) {
  switch (booking.status) {
    case BOOKING_STATUS.pending:
      return { label: 'Awaiting payment', tone: 'todo' }
    case BOOKING_STATUS.confirmed:
      return booking.onlineCheckInAt
        ? { label: 'Confirmed · checked in online', tone: 'done' }
        : { label: 'Confirmed · check in online', tone: 'todo' }
    case BOOKING_STATUS.checkedIn:
      return { label: 'Checked in', tone: 'done' }
    case BOOKING_STATUS.checkedOut:
      return { label: 'Stay completed', tone: 'muted' }
    case BOOKING_STATUS.cancelled:
      return { label: 'Cancelled', tone: 'muted' }
    default:
      return { label: booking.status, tone: 'muted' }
  }
}

export const isPaid = (booking) =>
  [BOOKING_STATUS.confirmed, BOOKING_STATUS.checkedIn, BOOKING_STATUS.checkedOut].includes(booking.status)

/** Cancelling is allowed before the check-in day (the API has the final say: TOO_LATE_TO_CANCEL). */
export const canCancel = (booking) =>
  [BOOKING_STATUS.pending, BOOKING_STATUS.confirmed].includes(booking.status) &&
  stayDate(booking.checkIn) > toIsoDate(new Date())

/** Online check-in: paid, not yet done, not after the stay. */
export const canCheckInOnline = (booking) =>
  booking.status === BOOKING_STATUS.confirmed && !booking.onlineCheckInAt

/** Service requests need a paid booking that hasn't ended. */
export const canMakeRequests = (booking) =>
  [BOOKING_STATUS.confirmed, BOOKING_STATUS.checkedIn].includes(booking.status)

/** The next stay first, then the rest newest first (as the API returns them). */
export function upcomingBooking(bookings) {
  const today = toIsoDate(new Date())
  return bookings
    .filter((b) => [BOOKING_STATUS.confirmed, BOOKING_STATUS.checkedIn, BOOKING_STATUS.pending].includes(b.status))
    .filter((b) => stayDate(b.checkOut) >= today)
    .sort((a, b) => stayDate(a.checkIn).localeCompare(stayDate(b.checkIn)))[0]
}
