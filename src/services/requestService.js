import { api } from './api/client.js'

// In-stay service requests. The booking must be paid.
// Statuses: SUBMITTED -> IN_PROGRESS -> COMPLETED, or CANCELLED by the guest before staff start.

export const REQUEST_STATUS = {
  submitted: 'SUBMITTED',
  inProgress: 'IN_PROGRESS',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
}

/** GET /concierge/categories -> [{ code, name }]. OTHER needs a note. */
export const listCategories = ({ signal } = {}) => api.get('/concierge/categories', { signal })

/** GET /bookings/:id/requests: newest first. */
export const listRequests = (bookingId, { signal } = {}) =>
  api.get(`/bookings/${encodeURIComponent(bookingId)}/requests`, { signal })

/** POST /bookings/:id/requests. preferredTime is an ISO 8601 date-time with offset. */
export function createRequest(bookingId, { category, note, preferredTime }) {
  const body = { category }
  if (note?.trim()) body.note = note.trim()
  if (preferredTime) body.preferredTime = preferredTime
  return api.post(`/bookings/${encodeURIComponent(bookingId)}/requests`, body)
}

/** GET /requests/:id: one request with its history (oldest first). */
export const getRequest = (requestId, { signal } = {}) => api.get(`/requests/${encodeURIComponent(requestId)}`, { signal })

/** PATCH /requests/:id/cancel: only while SUBMITTED, else INVALID_STATUS_CHANGE. */
export const cancelRequest = (requestId) => api.patch(`/requests/${encodeURIComponent(requestId)}/cancel`)
