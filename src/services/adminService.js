import { api } from './api/client.js'
import { REALMS, session } from './api/session.js'

// Hotel staff dashboard. Every /admin call uses the staff token (a separate
// login from guests) and only sees the staff member's own hotel.
// Staff roles: MANAGER, RECEPTION, HOUSEKEEPING, MAINTENANCE.

const staff = { auth: REALMS.staff }
const id = (value) => encodeURIComponent(value)

/** POST /admin/auth/login -> the staff member. Throws INVALID_LOGIN, HOTEL_SUSPENDED. */
export async function staffLogin({ email, password }) {
  const data = await api.post('/admin/auth/login', { email: email.trim(), password }, { auth: false })
  session.set(REALMS.staff, { accessToken: data.accessToken, user: data.staff, source: 'login' })
  return data.staff
}

export const staffLogout = () => session.clear(REALMS.staff)

// Dashboard
/** GET /admin/overview. `date` defaults to today at the hotel. revenueToday is kobo. */
export const getOverview = ({ date, signal } = {}) => api.get('/admin/overview', { ...staff, query: { date }, signal })

// Bookings and guests
/** GET /admin/bookings with optional status, from, to, search (guest name or email). */
export const listHotelBookings = ({ status, from, to, search, signal } = {}) =>
  api.get('/admin/bookings', { ...staff, query: { status, from, to, search }, signal })

export const getHotelBooking = (bookingId, { signal } = {}) => api.get(`/admin/bookings/${id(bookingId)}`, { ...staff, signal })

/** POST /admin/bookings/:id/check-in (front desk, no ID step). Idempotent. Throws BOOKING_NOT_PAID, BOOKING_CLOSED. */
export const frontDeskCheckIn = (bookingId) => api.post(`/admin/bookings/${id(bookingId)}/check-in`, undefined, staff)

export const listHotelGuests = ({ search, signal } = {}) => api.get('/admin/guests', { ...staff, query: { search }, signal })

/** GET /admin/rooms/availability: each room with its bookings between from and to. */
export const getRoomAvailability = ({ from, to, signal }) =>
  api.get('/admin/rooms/availability', { ...staff, query: { from, to }, signal })

// Service requests
/** GET /admin/requests, oldest first. assignedTo is a staff id. */
export const listHotelRequests = ({ status, assignedTo, signal } = {}) =>
  api.get('/admin/requests', { ...staff, query: { status, assignedTo }, signal })

export const getHotelRequest = (requestId, { signal } = {}) => api.get(`/admin/requests/${id(requestId)}`, { ...staff, signal })

/** status: IN_PROGRESS or COMPLETED. Throws INVALID_STATUS_CHANGE. */
export const updateRequestStatus = (requestId, status) =>
  api.patch(`/admin/requests/${id(requestId)}/status`, { status }, staff)

/** staffId null unassigns. Managers and reception only (403 otherwise). */
export const assignRequest = (requestId, staffId) =>
  api.patch(`/admin/requests/${id(requestId)}/assign`, { staffId: staffId ?? null }, staff)

// Hotel setup (managers)
export const getMyHotel = ({ signal } = {}) => api.get('/admin/hotel', { ...staff, signal })
export const updateMyHotel = (changes) => api.patch('/admin/hotel', changes, staff)
export const listRoomTypes = ({ signal } = {}) => api.get('/admin/room-types', { ...staff, signal })
export const createRoomType = (roomType) => api.post('/admin/room-types', roomType, staff)
export const updateRoomType = (roomTypeId, changes) => api.patch(`/admin/room-types/${id(roomTypeId)}`, changes, staff)
export const createRoom = (room) => api.post('/admin/rooms', room, staff)
export const listStaff = ({ signal } = {}) => api.get('/admin/staff', { ...staff, signal })
/** { email, password, firstName, lastName, role } */
export const createStaff = (member) => api.post('/admin/staff', member, staff)
