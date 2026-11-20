import { api } from './api/client.js'

// Paystack flow:
// 1. POST /bookings/:id/payments, then send the guest to authorizationUrl.
// 2. Paystack returns them to the callback page with ?reference=...
// 3. The callback page calls GET /payments/verify/:reference.
// Card details are entered on Paystack's page and never touch this app.

export const VERIFY_STATUS = { success: 'success', failed: 'failed', pending: 'pending' }

/**
 * POST /bookings/:id/payments -> { authorizationUrl, reference }.
 * Call again after a failed payment for a new attempt.
 * Throws BOOKING_CLOSED (already paid or cancelled), HOLD_EXPIRED (book again),
 * PAYMENTS_NOT_CONFIGURED, PAYMENT_PROVIDER_ERROR.
 */
export const startPayment = (bookingId) => api.post(`/bookings/${encodeURIComponent(bookingId)}/payments`)

/**
 * GET /payments/verify/:reference -> { status: success | failed | pending, booking, refundNeeded }.
 * Safe to call more than once.
 */
export const verifyPayment = (reference, { signal } = {}) =>
  api.get(`/payments/verify/${encodeURIComponent(reference)}`, { signal })

/** Sends the browser to Paystack's hosted checkout. */
export function redirectToPaystack(authorizationUrl) {
  window.location.assign(authorizationUrl)
}
