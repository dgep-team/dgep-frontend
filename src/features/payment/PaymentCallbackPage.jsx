import { useEffect, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router'
import { Alert } from '../../components/feedback/Alert.jsx'
import { ErrorView, LoadingView } from '../../components/feedback/StatusView.jsx'
import { Screen } from '../../components/layout/AppShell.jsx'
import { ScreenHeader } from '../../components/layout/ScreenHeader.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { errorMessage } from '../../services/api/errors.js'
import { VERIFY_STATUS, verifyPayment } from '../../services/paymentService.js'
import { useBookingFlow } from '../../state/bookingFlowContext.js'

// A just-finished payment can still be "pending" for a few seconds.
const POLL_INTERVAL_MS = 3_000
const MAX_POLLS = 6

const wait = (ms, signal) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(signal.reason)
    })
  })

/**
 * Paystack sends the guest back here with ?reference=... (and ?trxref=...).
 * GET /payments/verify/:reference decides the outcome; the URL alone proves nothing.
 */
export function PaymentCallbackPage() {
  const [params] = useSearchParams()
  const reference = params.get('reference') || params.get('trxref')
  const { draft, resetDraft } = useBookingFlow()
  const [state, setState] = useState({ status: 'verifying' })
  const [attempt, setAttempt] = useState(0)
  const retry = () => {
    setState({ status: 'verifying' })
    setAttempt((n) => n + 1)
  }

  useEffect(() => {
    if (!reference) return undefined
    const controller = new AbortController()

    async function run() {
      try {
        for (let poll = 1; ; poll++) {
          const result = await verifyPayment(reference, { signal: controller.signal })
          if (result.status !== VERIFY_STATUS.pending || poll >= MAX_POLLS) {
            setState({ status: result.status, result })
            return
          }
          await wait(POLL_INTERVAL_MS, controller.signal)
        }
      } catch (error) {
        if (!controller.signal.aborted) setState({ status: 'error', error })
      }
    }

    run()
    return () => controller.abort()
  }, [reference, attempt])

  const succeededFor = state.status === VERIFY_STATUS.success ? state.result.booking?.id : null
  // The draft's unpaid booking is now paid: start the next booking fresh.
  useEffect(() => {
    if (succeededFor && draft.pending?.bookingId === succeededFor) resetDraft()
  }, [succeededFor, draft.pending?.bookingId, resetDraft])

  const header = <ScreenHeader title="Payment" backTo="/bookings" />

  if (!reference) {
    return (
      <Screen header={header} width="narrow">
        <ErrorView title="No payment to check" message="This page is opened by Paystack after you pay." actionLabel="View my bookings" actionTo="/bookings" />
      </Screen>
    )
  }

  const booking = state.result?.booking

  switch (state.status) {
    case 'verifying':
      return <Screen header={header} width="narrow"><LoadingView label="Confirming your payment…" /></Screen>

    case VERIFY_STATUS.success:
      if (state.result.refundNeeded) {
        return (
          <Screen header={header} width="narrow">
            <Alert tone="warning" title="Your payment arrived after the room was released">
              The room was booked by someone else while your hold had run out. The hotel will refund you in full.
            </Alert>
            <Button fullWidth to="/search">Find another room</Button>
          </Screen>
        )
      }
      return <Navigate to={`/bookings/${booking.id}`} replace state={{ justPaid: true }} />

    case VERIFY_STATUS.failed:
      return (
        <Screen header={header} width="narrow">
          <Alert tone="error" title="Your payment didn’t go through">
            You have not been charged. You can try again with the same or another method.
          </Alert>
          {booking?.id && <Button fullWidth to={`/bookings/${booking.id}/pay`}>Try again</Button>}
          <Button fullWidth variant="ghost" to="/bookings">View my bookings</Button>
        </Screen>
      )

    case VERIFY_STATUS.pending:
      return (
        <Screen header={header} width="narrow">
          <Alert tone="info" title="Your payment is still processing">
            This can take a minute for bank transfers. Don’t pay again; we’ll confirm your booking as soon as it clears.
          </Alert>
          <Button fullWidth onClick={retry}>Check again</Button>
          {booking?.id && <Button fullWidth variant="ghost" to={`/bookings/${booking.id}`}>View booking</Button>}
        </Screen>
      )

    default:
      return (
        <Screen header={header} width="narrow">
          <ErrorView
            title="We couldn’t confirm your payment yet"
            message={`${errorMessage(state.error)} If you paid, you won’t be charged twice.`}
            actionLabel="Try again"
            onAction={retry}
          />
        </Screen>
      )
  }
}
