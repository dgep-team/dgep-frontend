import { REQUEST_STATUS } from '../../services/requestService.js'

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
