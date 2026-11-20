import { REQUEST_STATUS } from '../../services/requestService.js'

/** Polled while a request is open, so staff updates show up on their own. */
export const STATUS_POLL_MS = 15_000

/** Still being handled by the hotel (status can change). */
export const isOpenRequest = (request) =>
  request?.status === REQUEST_STATUS.submitted || request?.status === REQUEST_STATUS.inProgress

export const REQUEST_STATUS_LABEL = {
  [REQUEST_STATUS.submitted]: 'Sent to the hotel',
  [REQUEST_STATUS.inProgress]: 'In progress',
  [REQUEST_STATUS.completed]: 'Done',
  [REQUEST_STATUS.cancelled]: 'Cancelled',
}

/** Category code -> name, from GET /concierge/categories (falls back to the code). */
export const categoryName = (categories, code) => categories?.find((c) => c.code === code)?.name ?? code

/** "2026-12-01T15:30" (datetime-local, the guest's clock) -> ISO 8601 instant for the API. */
export function localDateTimeToIso(value) {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}
