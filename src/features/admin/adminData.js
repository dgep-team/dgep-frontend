import { BedDouble, Droplets, Hammer, Package, Sparkles, UtensilsCrossed } from 'lucide-react'
import { formatDateRange, parseIsoDate, stayDate, toIsoDate } from '../../lib/dates.js'
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

// Staff roles and what each may do in the dashboard. The API has the final
// say (403); this only hides controls a role can't use.
export const STAFF_ROLES = [
  { value: 'MANAGER', label: 'Manager' },
  { value: 'RECEPTION', label: 'Reception' },
  { value: 'HOUSEKEEPING', label: 'Housekeeping' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
]

export const roleLabel = (role) => STAFF_ROLES.find((item) => item.value === role)?.label ?? role ?? 'Staff'

const PERMISSIONS = {
  finance: ['MANAGER'], // revenue and payment analytics
  frontDesk: ['MANAGER', 'RECEPTION'], // bookings, guests, check-in, assigning requests
  manageHotel: ['MANAGER'], // add rooms and staff
}

export const can = (staff, permission) => PERMISSIONS[permission]?.includes(staff?.role) ?? false

export const personName = (person) =>
  [person?.firstName, person?.lastName].filter(Boolean).join(' ') || person?.email || null

// Service requests
export const REQUEST_CATEGORIES = {
  TOWELS: 'Towels',
  TOILETRIES: 'Toiletries',
  HOUSEKEEPING: 'Housekeeping',
  MAINTENANCE: 'Maintenance',
  ROOM_SERVICE: 'Room service',
  OTHER: 'Other',
}

export const CATEGORY_ICONS = {
  TOWELS: Droplets,
  TOILETRIES: Package,
  HOUSEKEEPING: Sparkles,
  MAINTENANCE: Hammer,
  ROOM_SERVICE: UtensilsCrossed,
  OTHER: BedDouble,
}

export const categoryLabel = (code) => REQUEST_CATEGORIES[code] ?? code ?? 'Request'

export function describeRequest(request) {
  switch (request.status) {
    case 'SUBMITTED':
      return { label: 'New', tone: 'warning' }
    case 'IN_PROGRESS':
      return { label: 'In progress', tone: 'info' }
    case 'COMPLETED':
      return { label: 'Done', tone: 'good' }
    case 'CANCELLED':
      return { label: 'Cancelled', tone: 'muted' }
    default:
      return { label: request.status, tone: 'muted' }
  }
}

export const isOpenRequest = (request) => request.status === 'SUBMITTED' || request.status === 'IN_PROGRESS'

/** The request's guest and room may come on the request or on its booking. */
export const requestGuestName = (request) => personName(request.guest ?? request.booking?.guest) ?? 'Guest'

export function requestRoomLabel(request) {
  const room = request.room ?? request.booking?.room
  return room ? roomLabel({ room }) : 'Room not assigned'
}

/** Who has the request: the assignee object if sent, else looked up in the staff list. */
export function assigneeName(request, staffList = []) {
  const person = request.assignedTo ?? request.assignee ?? staffList.find((member) => member.id === request.assignedToId)
  if (person && typeof person === 'object') return personName(person)
  return request.assignedToId ? 'Assigned' : null
}

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

/** "5 minutes ago", "yesterday", "3 days ago". */
export function timeAgo(iso, now = Date.now()) {
  if (!iso) return ''
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000)
  const abs = Math.abs(seconds)
  if (abs < 60) return 'just now'
  if (abs < 3600) return relative.format(Math.round(seconds / 60), 'minute')
  if (abs < 86400) return relative.format(Math.round(seconds / 3600), 'hour')
  return relative.format(Math.round(seconds / 86400), 'day')
}

/** 95 minutes -> "1 h 35 min". */
export function formatDuration(ms) {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return '—'
  const minutes = Math.max(1, Math.round(ms / 60000))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours < 48) return rest ? `${hours} h ${rest} min` : `${hours} h`
  return `${Math.round(hours / 24)} days`
}
