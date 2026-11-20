// Error codes from the DGEP API. Branch on `code`, never on the message.

export const ERROR_CODES = {
  // 400
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_JSON: 'INVALID_JSON',
  INVALID_DATES: 'INVALID_DATES',
  UNKNOWN_ADD_ON: 'UNKNOWN_ADD_ON',
  TOO_MANY_GUESTS: 'TOO_MANY_GUESTS',
  // 401
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_LOGIN: 'INVALID_LOGIN',
  // 403
  FORBIDDEN: 'FORBIDDEN',
  HOTEL_SUSPENDED: 'HOTEL_SUSPENDED',
  KEY_NOT_ACTIVE: 'KEY_NOT_ACTIVE',
  // 404 (also someone else's booking)
  NOT_FOUND: 'NOT_FOUND',
  // 409
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  LOGIN_REQUIRED: 'LOGIN_REQUIRED',
  ROOM_NOT_AVAILABLE: 'ROOM_NOT_AVAILABLE',
  HOLD_EXPIRED: 'HOLD_EXPIRED',
  BOOKING_CLOSED: 'BOOKING_CLOSED',
  BOOKING_NOT_PAID: 'BOOKING_NOT_PAID',
  TOO_LATE_TO_CANCEL: 'TOO_LATE_TO_CANCEL',
  HOTEL_NOT_READY: 'HOTEL_NOT_READY',
  INVALID_STATUS_CHANGE: 'INVALID_STATUS_CHANGE',
  REQUEST_CLOSED: 'REQUEST_CLOSED',
  // 413
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  // 5xx
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  PAYMENT_PROVIDER_ERROR: 'PAYMENT_PROVIDER_ERROR',
  PAYMENTS_NOT_CONFIGURED: 'PAYMENTS_NOT_CONFIGURED',
  // Client-side: the request never got a DGEP answer.
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  BAD_RESPONSE: 'BAD_RESPONSE',
}

const GENERIC = 'Something went wrong on our side. Please try again.'

// Codes whose server message is not meant for guests, or that have no server message.
const OVERRIDES = {
  INTERNAL_ERROR: GENERIC,
  BAD_RESPONSE: 'The server is not responding properly. Please try again in a moment.',
  NETWORK_ERROR: 'We couldn’t reach the server. Check your connection and try again.',
  TIMEOUT: 'The server is taking too long to answer. Please try again.',
  UNAUTHORIZED: 'Your session has ended. Please log in again.',
  PAYMENTS_NOT_CONFIGURED: 'Online payment is not available right now. Please try again later.',
  PAYMENT_PROVIDER_ERROR: 'We couldn’t reach the payment provider. You have not been charged; please try again.',
}

export class ApiError extends Error {
  constructor(message, { status = 0, code = ERROR_CODES.INTERNAL_ERROR, details = [] } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }

  /** True for failures where retrying the same request may succeed. */
  get retryable() {
    return [ERROR_CODES.NETWORK_ERROR, ERROR_CODES.TIMEOUT, ERROR_CODES.BAD_RESPONSE].includes(this.code) || this.status >= 500
  }
}

/** The message to show a guest for any thrown error. */
export function errorMessage(error) {
  if (!(error instanceof ApiError)) return GENERIC
  return OVERRIDES[error.code] ?? (error.message || GENERIC)
}

/** VALIDATION_ERROR details as { field: message }. Nested fields ("guest.email") keep their path. */
export function fieldErrors(error) {
  if (!(error instanceof ApiError) || !Array.isArray(error.details)) return {}
  return Object.fromEntries(error.details.filter((d) => d?.field).map((d) => [d.field, d.message]))
}

export const isApiError = (error, code) => error instanceof ApiError && (!code || error.code === code)
