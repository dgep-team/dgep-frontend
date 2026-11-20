import { api } from './api/client.js'
import { startGuestCheckoutSession } from './authService.js'

export const BOOKING_STATUS = {
  pending: 'PENDING', // not paid yet, room held 30 minutes (holdExpiresAt)
  confirmed: 'CONFIRMED', // paid
  checkedIn: 'CHECKED_IN',
  checkedOut: 'CHECKED_OUT',
  cancelled: 'CANCELLED',
}

const path = (bookingId, suffix = '') => `/bookings/${encodeURIComponent(bookingId)}${suffix}`

/**
 * POST /bookings -> { booking, price }.
 * Logged in: the token is sent. Not logged in: pass `guest`
 * ({ email, firstName, lastName, phone? }); the returned accessToken is kept
 * so the guest can pay and check in.
 * Throws ROOM_NOT_AVAILABLE, LOGIN_REQUIRED, TOO_MANY_GUESTS, UNKNOWN_ADD_ON, INVALID_DATES.
 */
export async function createBooking({ roomTypeId, checkIn, checkOut, guests, addOns = [], guest }) {
  const body = { roomTypeId, checkIn, checkOut, guests, addOns }
  if (guest) body.guest = guest

  const data = await api.post('/bookings', body, { auth: guest ? false : 'guest' })
  if (data.accessToken) startGuestCheckoutSession({ accessToken: data.accessToken, guest: guest ?? null })
  return { booking: data.booking, price: data.price }
}

/** GET /bookings: the guest's bookings, newest first. */
export const listBookings = ({ signal } = {}) => api.get('/bookings', { signal })

/** GET /bookings/:id: one booking with room, room type, hotel and payments. */
export const getBooking = (bookingId, { signal } = {}) => api.get(path(bookingId), { signal })

/** PATCH /bookings/:id/cancel. Throws BOOKING_CLOSED, TOO_LATE_TO_CANCEL. */
export const cancelBooking = (bookingId) => api.patch(path(bookingId, '/cancel'))

/** GET /bookings/:id/arrival: address, phone, times, parking. roomNumber is null until check-in. */
export const getArrivalInfo = (bookingId, { signal } = {}) => api.get(path(bookingId, '/arrival'), { signal })

/** GET /bookings/:id/check-in -> { paymentStatus, idVerificationStatus, checkInStatus, canCheckIn }. */
export const getCheckInStatus = (bookingId, { signal } = {}) => api.get(path(bookingId, '/check-in'), { signal })

/**
 * POST /bookings/:id/check-in. arrivalTime is HH:MM; `guest` optionally fixes
 * { firstName, lastName, phone }. No ID is needed. Throws BOOKING_NOT_PAID, BOOKING_CLOSED.
 */
export function submitCheckIn(bookingId, { arrivalTime, specialRequests, guest }) {
  const body = { arrivalTime }
  if (specialRequests?.trim()) body.specialRequests = specialRequests.trim()
  if (guest && Object.keys(guest).length > 0) body.guest = guest
  return api.post(path(bookingId, '/check-in'), body)
}
