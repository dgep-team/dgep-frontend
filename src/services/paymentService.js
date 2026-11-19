import { digitsOnly, detectCardBrand } from '../lib/cardValidation.js'
import { simulateRequest } from './apiClient.js'
import { createConfirmedBooking, quoteDraft } from './bookingService.js'

/**
 * Mock payment gateway.
 *
 * In production, card fields are collected by the provider's SDK (hosted
 * fields), so raw card data never reaches our code or servers (PRD §9). The
 * `card` argument here only mimics that SDK's tokenised result.
 *
 * Test cards for exercising the failure paths (BR-11):
 *   4000 0000 0000 0002  -> declined by bank
 *   4000 0000 0000 0119  -> provider unreachable
 */
const DECLINED = '4000000000000002'
const UNREACHABLE = '4000000000000119'

// Results keyed by idempotency key, so a double-tap or retry of the same
// attempt can never charge twice or create two bookings.
const attempts = new Map()

export const PAYMENT_STATUS = {
  succeeded: 'succeeded',
  failed: 'failed',
  priceChanged: 'price_changed',
}

function failure(code, title, message) {
  return { status: PAYMENT_STATUS.failed, code, title, message }
}

function charge({ draft, method, card, saveCard, expectedTotal }) {
  const { quote } = quoteDraft(draft)

  if (quote.total !== expectedTotal) {
    return { status: PAYMENT_STATUS.priceChanged, quote, previousTotal: expectedTotal }
  }

  if (method === 'card') {
    const number = digitsOnly(card.number)
    if (number === DECLINED) {
      return failure(
        'card_declined',
        'Your bank declined this card',
        'You have not been charged. Try another card, or pick a different payment method.',
      )
    }
    if (number === UNREACHABLE) {
      return failure(
        'provider_unavailable',
        'We couldn’t reach the payment provider',
        'You have not been charged. Check your connection and try again.',
      )
    }
  }

  const payment = {
    method,
    amount: quote.total,
    currency: quote.currency,
    ...(method === 'card' && {
      cardBrand: detectCardBrand(card.number),
      cardLast4: digitsOnly(card.number).slice(-4),
      savedForLater: saveCard,
    }),
    paidAt: new Date().toISOString(),
  }

  return { status: PAYMENT_STATUS.succeeded, booking: createConfirmedBooking({ draft, quote, payment }) }
}

export function payForBooking({ idempotencyKey, ...request }) {
  return simulateRequest(() => {
    if (!attempts.has(idempotencyKey)) attempts.set(idempotencyKey, charge(request))
    return attempts.get(idempotencyKey)
  }, 1100)
}
