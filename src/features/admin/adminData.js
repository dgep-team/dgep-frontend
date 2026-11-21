import { addDays, formatDateRange, parseIsoDate, stayDate, toIsoDate } from '../../lib/dates.js'
import { BOOKING_STATUS } from '../../services/bookingService.js'

/** List endpoints return an array; tolerate a paged `{ items }` shape too. */
export const asList = (data) => (Array.isArray(data) ? data : (data?.items ?? data?.bookings ?? data?.guests ?? []))

/** Staff-facing label and tone for a booking. tone: 'good' | 'info' | 'warning' | 'muted'. */
export function describeHotelBooking(booking) {
  switch (booking.status) {
    case BOOKING_STATUS.pending:
      return { label: 'Awaiting payment', tone: 'warning' }
    case BOOKING_STATUS.confirmed:
      return booking.onlineCheckInAt ? { label: 'Checked in online', tone: 'info' } : { label: 'Confirmed', tone: 'good' }
    case BOOKING_STATUS.checkedIn:
      return { label: 'In house', tone: 'info' }
    case BOOKING_STATUS.checkedOut:
      return { label: 'Completed', tone: 'muted' }
    case BOOKING_STATUS.cancelled:
      return { label: 'Cancelled', tone: 'muted' }
    default:
      return { label: booking.status, tone: 'muted' }
  }
}

export function guestName(booking) {
  const guest = booking.guest ?? {}
  return [guest.firstName, guest.lastName].filter(Boolean).join(' ') || guest.email || 'Guest'
}

/** "Room 302" once a room is known, otherwise the room type. */
export function roomLabel(booking) {
  const room = booking.room ?? {}
  const number = room.number ?? room.roomNumber
  if (number) return `Room ${number}`
  return room.roomType?.name ?? 'Room not assigned'
}

export const stayLabel = (booking) => formatDateRange(booking.checkIn, booking.checkOut)

const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

/** "Nov 20 – Nov 23" for stays this year (as in the list design); with the year otherwise. */
export function shortStayLabel(booking) {
  const start = parseIsoDate(booking.checkIn)
  const end = parseIsoDate(booking.checkOut)
  const year = new Date().getFullYear()
  if (start.getFullYear() !== year || end.getFullYear() !== year) return stayLabel(booking)
  return `${monthDay.format(start)} – ${monthDay.format(end)}`
}

const ACTIVE = [BOOKING_STATUS.pending, BOOKING_STATUS.confirmed, BOOKING_STATUS.checkedIn]

/** Upcoming: not yet over (checked in, or arriving later). Completed: checked out, cancelled or past. */
export function splitBookings(bookings, today = toIsoDate(new Date())) {
  const upcoming = []
  const completed = []
  for (const booking of bookings) {
    if (ACTIVE.includes(booking.status) && stayDate(booking.checkOut) >= today) upcoming.push(booking)
    else completed.push(booking)
  }
  upcoming.sort((a, b) => stayDate(a.checkIn).localeCompare(stayDate(b.checkIn)))
  completed.sort((a, b) => stayDate(b.checkOut).localeCompare(stayDate(a.checkOut)))
  return { upcoming, completed }
}

const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short' })
const dayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

/**
 * New bookings per day for the 7 days ending today, by when they were made
 * (createdAt, local time). Cancelled ones still count: they were bookings made.
 */
export function bookingsPerDay(bookings, today = toIsoDate(new Date())) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(today, index - 6))
  const counts = Object.fromEntries(days.map((day) => [day, 0]))
  for (const booking of bookings) {
    if (!booking.createdAt) continue
    const day = toIsoDate(new Date(booking.createdAt))
    if (day in counts) counts[day] += 1
  }
  return days.map((day) => {
    const [y, m, d] = day.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    return { day, short: weekday.format(date), long: dayLabel.format(date), count: counts[day] }
  })
}
