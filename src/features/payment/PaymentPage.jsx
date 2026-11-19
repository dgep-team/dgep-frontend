import { Lock } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Alert } from '../../components/feedback/Alert.jsx'
import { ErrorView, LoadingView } from '../../components/feedback/StatusView.jsx'
import { Screen, SplitLayout } from '../../components/layout/AppShell.jsx'
import { ScreenHeader } from '../../components/layout/ScreenHeader.jsx'
import { PriceSummary } from '../../components/pricing/PriceSummary.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { validateCard } from '../../lib/cardValidation.js'
import { formatNaira } from '../../lib/money.js'
import { buildQuote } from '../../lib/pricing.js'
import { PAYMENT_STATUS } from '../../services/paymentService.js'
import { getHotelAndRoom } from '../../services/hotelService.js'
import { useBookingFlow } from '../../state/bookingFlowContext.js'
import { BookingSummaryStrip } from './components/BookingSummaryStrip.jsx'
import { CardDetailsForm } from './components/CardDetailsForm.jsx'
import { MethodInstructions } from './components/MethodInstructions.jsx'
import { PaymentMethodList } from './components/PaymentMethodList.jsx'
import styles from './components/Payment.module.css'
import { useCheckout } from './useCheckout.js'

const EMPTY_CARD = { number: '', expiry: '', cvv: '', saveCard: true }

export function PaymentPage() {
  const navigate = useNavigate()
  const { draft } = useBookingFlow()
  const selection = useAsync(() => getHotelAndRoom(draft.hotelId, draft.roomId), `${draft.hotelId}/${draft.roomId}`)

  const [method, setMethod] = useState('card')
  const [card, setCard] = useState(EMPTY_CARD)
  const [showCardErrors, setShowCardErrors] = useState(false)
  const methodsRef = useRef(null)

  const checkout = useCheckout({
    onSuccess: (booking) =>
      navigate(`/bookings/${booking.id}/check-in`, { replace: true, state: { justBooked: true } }),
  })

  const header = <ScreenHeader title="Payment" backTo="/booking" />

  if (selection.status === 'loading') return <Screen header={header}><LoadingView /></Screen>
  if (selection.status === 'error') {
    return (
      <Screen header={header}>
        <ErrorView message={selection.error.message} actionLabel="Back to booking" actionTo="/booking" />
      </Screen>
    )
  }

  const { hotel, room } = selection.data
  // If the server reported a new price, that is what the guest now confirms (BR-07).
  const quote = checkout.status === PAYMENT_STATUS.priceChanged ? checkout.result.quote : buildQuote({ room, ...draft })
  const cardErrors = method === 'card' && showCardErrors ? validateCard(card) : {}

  const handleSubmit = (event) => {
    event.preventDefault()
    if (method === 'card' && Object.keys(validateCard(card)).length > 0) {
      setShowCardErrors(true)
      requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus())
      return
    }
    checkout.pay({
      draft,
      method,
      card: method === 'card' ? card : null,
      saveCard: method === 'card' && card.saveCard,
      expectedTotal: quote.total,
    })
  }

  const switchMethod = () => {
    checkout.dismiss()
    methodsRef.current?.focus()
    methodsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleCardFailureRetry = () => {
    // A declined card should be re-entered, not silently resubmitted.
    setCard((current) => ({ ...current, cvv: '' }))
    checkout.dismiss()
  }

  return (
    <Screen header={header}>
      <SplitLayout
        asideFirst
        asideLabel="Booking summary"
        aside={
          <>
            <BookingSummaryStrip hotel={hotel} draft={draft} total={quote.total} />
            <div className="desktop-only">
              <PriceSummary quote={quote} />
            </div>
          </>
        }
      >

      {checkout.status === PAYMENT_STATUS.failed && (
        <Alert
          tone="error"
          title={checkout.result.title}
          actions={
            <>
              <Button variant="secondary" onClick={handleCardFailureRetry}>
                Try again
              </Button>
              <Button variant="ghost" onClick={switchMethod}>
                Use another method
              </Button>
            </>
          }
        >
          {checkout.result.message}
        </Alert>
      )}

      {checkout.status === PAYMENT_STATUS.priceChanged && (
        <Alert tone="warning" title="The price has changed">
          The hotel updated this rate from {formatNaira(checkout.result.previousTotal)} to{' '}
          <strong>{formatNaira(quote.total)}</strong>. You have not been charged. Tap Pay to confirm the new total, or go
          back to change your booking.
        </Alert>
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <PaymentMethodList ref={methodsRef} value={method} onChange={setMethod} disabled={checkout.isPaying} />

        <div className={styles.form}>
          {method === 'card' ? (
            <CardDetailsForm value={card} errors={cardErrors} onChange={setCard} disabled={checkout.isPaying} />
          ) : (
            <MethodInstructions method={method} total={quote.total} />
          )}

          <Button type="submit" fullWidth loading={checkout.isPaying} loadingLabel="Processing payment…">
            Pay Now {formatNaira(quote.total)}
          </Button>
          <p className={styles.secure}>
            <Lock size={14} aria-hidden="true" />
            Your payment is secure and encrypted
          </p>
        </div>
      </form>
      </SplitLayout>
    </Screen>
  )
}
