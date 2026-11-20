import { Clock, Lock } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { Alert } from '../../components/feedback/Alert.jsx'
import { ErrorView, LoadingView } from '../../components/feedback/StatusView.jsx'
import { Screen, SplitLayout } from '../../components/layout/AppShell.jsx'
import { ScreenHeader } from '../../components/layout/ScreenHeader.jsx'
import { PriceSummary } from '../../components/pricing/PriceSummary.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { formatTimestamp } from '../../lib/dates.js'
import { formatKobo } from '../../lib/money.js'
import { ERROR_CODES, errorMessage } from '../../services/api/errors.js'
import { BOOKING_STATUS } from '../../services/bookingService.js'
import { accessCodeFor, openPaystackCheckout, redirectToPaystack, startPayment } from '../../services/paymentService.js'
import { useBookingFlow } from '../../state/bookingFlowContext.js'
import { BookingSummaryStrip } from './components/BookingSummaryStrip.jsx'
import { loadPayableBooking } from './loadPayableBooking.js'
import { useHoldCountdown } from './useHoldCountdown.js'
import styles from './components/Payment.module.css'

/**
 * Payment: POST /bookings/:id/payments, then Paystack's checkout opens over
 * the app (card, bank transfer, USSD). Card details never touch this app. On
 * success the guest goes to /payments/callback, which verifies with the API.
 * If the checkout can't open in the app, the guest is sent to Paystack's page.
 */
export function PaymentPage() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const { draft, updateDraft } = useBookingFlow()
  const booking = useAsync((signal) => loadPayableBooking(bookingId, signal), bookingId)
  const hold = useHoldCountdown(booking.data?.holdExpiresAt)
  const [payment, setPayment] = useState({ status: 'idle' })

  const header = <ScreenHeader title="Payment" backTo="/booking" />

  if (booking.status === 'loading') return <Screen header={header}><LoadingView label="Loading your booking…" /></Screen>
  if (booking.status === 'error') {
    return (
      <Screen header={header}>
        <ErrorView message={errorMessage(booking.error)} actionLabel="View my bookings" actionTo="/bookings" />
      </Screen>
    )
  }

  const data = booking.data
  if (data.status !== BOOKING_STATUS.pending && data.status !== BOOKING_STATUS.cancelled) {
    // Already paid (e.g. Paystack's return went astray): show the confirmation.
    return <Navigate to={`/bookings/${data.id}/confirmed`} replace />
  }

  const bookAgain = () => {
    if (draft.pending?.bookingId === data.id) updateDraft({ pending: null })
    navigate('/booking')
  }

  if (data.status === BOOKING_STATUS.cancelled) {
    return (
      <Screen header={header} width="narrow">
        <ErrorView title="This booking was cancelled" message="Nothing was charged. You can book the room again." actionLabel="Book again" onAction={bookAgain} />
      </Screen>
    )
  }

  // The itemised price is only returned when the booking is created.
  const price = draft.pending?.bookingId === data.id ? draft.pending.price : null
  const holdExpired = hold?.expired || payment.error?.code === ERROR_CODES.HOLD_EXPIRED
  const lastAttemptFailed = data.payments?.at(-1)?.status === 'FAILED'
  const isPaying = ['starting', 'checkout', 'redirecting'].includes(payment.status)

  const pay = async () => {
    setPayment({ status: 'starting' })
    try {
      const started = await startPayment(data.id)
      const fallback = () => {
        setPayment({ status: 'redirecting' })
        redirectToPaystack(started.authorizationUrl)
      }
      const accessCode = accessCodeFor(started)
      if (!accessCode) return fallback()

      setPayment({ status: 'checkout' })
      await openPaystackCheckout(accessCode, {
        // The API, not this callback, decides whether the payment succeeded.
        onSuccess: (transaction) =>
          navigate(`/payments/callback?reference=${encodeURIComponent(transaction?.reference ?? started.reference)}`, {
            replace: true,
          }),
        onCancel: () => setPayment({ status: 'cancelled' }),
        onError: fallback,
      }).catch(fallback)
    } catch (error) {
      setPayment({ status: 'error', error })
      if (error.code === ERROR_CODES.BOOKING_CLOSED) booking.reload()
    }
  }

  return (
    <Screen header={header}>
      <SplitLayout
        asideFirst
        asideLabel="Booking summary"
        aside={
          <>
            <BookingSummaryStrip booking={data} />
            {price && (
              <div className="desktop-only">
                <PriceSummary price={price} />
              </div>
            )}
          </>
        }
      >
        {holdExpired ? (
          <Alert
            tone="error"
            title="Your room hold has expired"
            actions={<Button variant="secondary" onClick={bookAgain}>Book again</Button>}
          >
            Unpaid bookings are held for 30 minutes. You have not been charged.
          </Alert>
        ) : (
          hold && (
            <Alert tone="info" title={`Your room is held for ${hold.minutesLeft} more minute${hold.minutesLeft === 1 ? '' : 's'}`}>
              <Clock size={14} aria-hidden="true" /> Pay before {formatTimestamp(data.holdExpiresAt)} to keep it.
            </Alert>
          )
        )}

        {lastAttemptFailed && (payment.status === 'idle' || payment.status === 'cancelled') && (
          <Alert tone="warning" title="Your last payment didn’t go through">
            You have not been charged. You can try again with the same or another method.
          </Alert>
        )}

        {payment.status === 'cancelled' && (
          <Alert tone="info" title="Payment not completed">
            You closed the checkout, so nothing was charged. Your room is still held; tap Pay when you’re ready.
          </Alert>
        )}

        {payment.status === 'error' && payment.error.code !== ERROR_CODES.HOLD_EXPIRED && (
          <Alert tone="error" title="We couldn’t start your payment">
            {errorMessage(payment.error)}
          </Alert>
        )}

        {price && (
          <div className="mobile-only">
            <PriceSummary price={price} />
          </div>
        )}

        <div className={styles.form}>
          <p className={styles.muted}>
            Pay securely with Paystack by card, bank transfer or USSD, without leaving StayEase.
          </p>
          <Button fullWidth onClick={pay} disabled={holdExpired} loading={isPaying} loadingLabel={payment.status === 'checkout' ? 'Complete payment in the Paystack window…' : 'Opening Paystack…'}>
            Pay {formatKobo(data.totalAmount)}
          </Button>
          <p className={styles.secure}>
            <Lock size={14} aria-hidden="true" />
            Payments are processed by Paystack. We never see your card details.
          </p>
        </div>
      </SplitLayout>
    </Screen>
  )
}
