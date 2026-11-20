import { api } from './api/client.js'

// Paystack flow:
// 1. POST /bookings/:id/payments -> { authorizationUrl, reference }.
// 2. Paystack's checkout opens over the app (InlineJS). On success the app
//    goes to /payments/callback?reference=... itself. If the checkout can't
//    open, the guest is redirected to authorizationUrl and Paystack returns
//    them to the server's callback URL instead.
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

/** Sends the browser to Paystack's hosted checkout (fallback when the in-app checkout can't open). */
export function redirectToPaystack(authorizationUrl) {
  window.location.assign(authorizationUrl)
}

/**
 * The transaction's access code: from the API if it sends one, otherwise the
 * last segment of Paystack's checkout URL (https://checkout.paystack.com/<code>).
 */
export function accessCodeFor({ accessCode, authorizationUrl }) {
  if (accessCode) return accessCode
  try {
    const url = new URL(authorizationUrl)
    const code = url.pathname.split('/').filter(Boolean).at(-1)
    return url.hostname === 'checkout.paystack.com' && /^[\w-]+$/.test(code ?? '') ? code : null
  } catch {
    return null
  }
}

/**
 * Opens Paystack's checkout over the app for a transaction the server has
 * already started (InlineJS resumeTransaction). The guest never leaves the
 * app, so the server's callback URL doesn't matter. onSuccess receives
 * Paystack's { reference, ... }; the caller must still verify it with the API.
 * Rejects if the checkout script can't load (offline, blocked), so the
 * caller can fall back to redirecting.
 */
export async function openPaystackCheckout(accessCode, { onSuccess, onCancel, onError }) {
  const { default: Paystack } = await import('@paystack/inline-js')
  const popup = new Paystack()
  popup.resumeTransaction(accessCode, { onSuccess, onCancel, onError })
}
