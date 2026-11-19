import { nightsBetween } from './dates.js'

/**
 * Builds the all-in price for a stay (PRD BR-06). Every screen that shows a
 * price renders the result of this function, so the total never drifts
 * between booking and payment.
 */
export function buildQuote({ room, checkIn, checkOut, rooms }) {
  const nights = nightsBetween(checkIn, checkOut)
  const roomNights = nights * rooms
  const subtotal = room.nightlyRate * roomNights
  const taxesAndFees = room.taxesAndFeesPerRoomNight * roomNights

  return {
    currency: 'NGN',
    nights,
    rooms,
    nightlyRate: room.nightlyRate,
    subtotal,
    taxesAndFees,
    total: subtotal + taxesAndFees,
  }
}
