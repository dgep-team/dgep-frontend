import { guestProfile } from '../data/mockDb.js'
import { buildQuote } from '../lib/pricing.js'
import { ApiError, sessionStore, simulateRequest } from './apiClient.js'
import { findHotelAndRoom } from './hotelService.js'

const STORE_KEY = 'stayease.bookings'

const readBookings = () => sessionStore.read(STORE_KEY, {})
const writeBookings = (bookings) => sessionStore.write(STORE_KEY, bookings)

function summarise(booking) {
  const { hotel, room } = findHotelAndRoom(booking.hotelId, booking.roomId)
  return { ...booking, hotel, room }
}

/** Server-side price for a draft. Payment re-runs this to detect price changes (BR-07). */
export function quoteDraft(draft) {
  const { hotel, room } = findHotelAndRoom(draft.hotelId, draft.roomId)
  return { hotel, room, quote: buildQuote({ room, ...draft }) }
}

export function getQuote(draft) {
  return simulateRequest(() => quoteDraft(draft))
}

/** Called by the payment service once a charge succeeds. */
export function createConfirmedBooking({ draft, quote, payment }) {
  const bookings = readBookings()
  const id = `SE-${Date.now().toString(36).toUpperCase()}`
  bookings[id] = {
    id,
    status: 'confirmed',
    ...draft,
    quote,
    payment,
    guest: guestProfile,
    preCheckIn: null,
    createdAt: new Date().toISOString(),
  }
  writeBookings(bookings)
  return bookings[id]
}

export function listBookings() {
  return simulateRequest(() =>
    Object.values(readBookings())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(summarise),
  )
}

export function getBooking(bookingId) {
  return simulateRequest(() => {
    const booking = readBookings()[bookingId]
    if (!booking) throw new ApiError('We couldn’t find that booking.', { status: 404, code: 'booking_not_found' })
    return summarise(booking)
  })
}

/**
 * Pre-check-in (PC-01/PC-02). ID upload is optional (PC-03): the app records
 * only that a document was provided, never the image itself, until a
 * provider with encrypted, time-limited storage is in place.
 */
export function submitPreCheckIn(bookingId, { arrivalTime, specialRequests, idDocument }) {
  return simulateRequest(() => {
    const bookings = readBookings()
    const booking = bookings[bookingId]
    if (!booking) throw new ApiError('We couldn’t find that booking.', { status: 404, code: 'booking_not_found' })

    booking.preCheckIn = {
      arrivalTime,
      specialRequests: specialRequests.trim(),
      idDocumentProvided: Boolean(idDocument),
      completedAt: new Date().toISOString(),
    }
    writeBookings(bookings)
    return summarise(booking)
  }, 700)
}
