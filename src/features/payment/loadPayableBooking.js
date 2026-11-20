import { BOOKING_STATUS, cancelBooking, getBooking } from '../../services/bookingService.js'
import { VERIFY_STATUS, verifyPayment } from '../../services/paymentService.js'

/**
 * GET /bookings/:id. If it is still PENDING but has a payment attempt that
 * never came back from Paystack (tab closed, callback missed), ask the API
 * to verify that attempt first: verify is safe to repeat and confirms the
 * booking if the guest actually paid.
 */
export async function loadPayableBooking(bookingId, signal) {
  const booking = await getBooking(bookingId, { signal })
  if (booking.status !== BOOKING_STATUS.pending) return booking

  const lastAttempt = booking.payments?.at(-1)
  if (lastAttempt?.status !== 'INITIATED' || !lastAttempt.reference) return booking

  try {
    const result = await verifyPayment(lastAttempt.reference, { signal })
    return result.status === VERIFY_STATUS.success && result.booking ? { ...booking, ...result.booking } : booking
  } catch {
    return booking
  }
}

/**
 * Releases the room held by an unpaid booking the guest has moved on from.
 * Cancels only if the booking is still PENDING after checking its last
 * payment attempt with Paystack: a guest whose return from Paystack went
 * astray may have paid already, and a paid stay must never be cancelled.
 */
export async function releaseAbandonedHold(bookingId) {
  const booking = await loadPayableBooking(bookingId)
  if (booking.status === BOOKING_STATUS.pending) await cancelBooking(bookingId)
}
