import { useRef, useState } from 'react'
import { PAYMENT_STATUS, payForBooking } from '../../services/paymentService.js'

const CONNECTION_LOST = {
  title: 'We couldn’t confirm your payment',
  message: 'Check your connection and tap Pay again. You will not be charged twice.',
}

/**
 * Submits a payment and tracks the outcome (BR-10, BR-11).
 *
 * One idempotency key covers one attempt. It is kept when the request itself
 * fails (the charge may have gone through, so retrying must reuse it), and
 * cleared when the provider gives a clear answer, so the next tap is a new
 * attempt.
 */
export function useCheckout({ onSuccess }) {
  const [state, setState] = useState({ status: 'idle' })
  const attemptKey = useRef(null)

  async function pay(request) {
    attemptKey.current ??= crypto.randomUUID()
    setState({ status: 'paying' })

    try {
      const result = await payForBooking({ ...request, idempotencyKey: attemptKey.current })
      attemptKey.current = null
      if (result.status === PAYMENT_STATUS.succeeded) {
        onSuccess(result.booking)
        return
      }
      setState({ status: result.status, result })
    } catch {
      setState({ status: PAYMENT_STATUS.failed, result: CONNECTION_LOST })
    }
  }

  const dismiss = () => setState({ status: 'idle' })

  return { ...state, isPaying: state.status === 'paying', pay, dismiss }
}
