import { Check, Copy, Download, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router'
import { Alert } from '../../components/feedback/Alert.jsx'
import { ErrorView, LoadingView } from '../../components/feedback/StatusView.jsx'
import { Screen } from '../../components/layout/AppShell.jsx'
import { ScreenHeader } from '../../components/layout/ScreenHeader.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Card, Divider } from '../../components/ui/Card.jsx'
import { hotelImage } from '../../data/images.js'
import { useAsync } from '../../hooks/useAsync.js'
import { formatClock, formatDate, formatTimestamp, nightsBetween, pluralize, stayDate } from '../../lib/dates.js'
import { downloadBlob } from '../../lib/pdf.js'
import { formatKobo } from '../../lib/money.js'
import { errorMessage } from '../../services/api/errors.js'
import { getArrivalInfo } from '../../services/bookingService.js'
import { getHotel } from '../../services/hotelService.js'
import { useAuth } from '../../state/authContext.js'
import { useBookingFlow } from '../../state/bookingFlowContext.js'
import { CheckInHero } from '../checkin/components/CheckInHero.jsx'
import { canCheckInOnline, isPaid } from '../bookings/bookingStatus.js'
import { loadPayableBooking } from './loadPayableBooking.js'
import { buildReceiptPdf } from './receiptPdf.js'
import styles from './PaymentSuccessPage.module.css'

/**
 * Payment Success: where a verified payment lands (from /payments/callback).
 * GET /bookings/:id decides what shows: only a paid booking gets this screen,
 * anything else goes to the ordinary booking page, so the URL alone can never
 * show a false confirmation.
 */
export function PaymentSuccessPage() {
  const { bookingId } = useParams()
  const booking = useAsync(async (signal) => {
    const data = await loadPayableBooking(bookingId, signal)
    // Check-in/out times come with the arrival info; a failure there shouldn't hide the confirmation.
    const arrival = isPaid(data) ? await getArrivalInfo(bookingId, { signal }).catch(() => null) : null
    return { ...data, arrival }
  }, bookingId)
  const header = <ScreenHeader title="Confirmation" backTo="/bookings" />

  // This booking is paid: the next booking starts fresh (also when the guest
  // got here without passing through the payment callback).
  const { draft, resetDraft } = useBookingFlow()
  const paidId = booking.status === 'success' && isPaid(booking.data) ? booking.data.id : null
  useEffect(() => {
    if (paidId && draft.pending?.bookingId === paidId) resetDraft()
  }, [paidId, draft.pending?.bookingId, resetDraft])

  if (booking.status === 'loading') {
    return <Screen header={header} width="narrow"><LoadingView label="Loading your booking…" /></Screen>
  }
  if (booking.status === 'error') {
    return (
      <Screen header={header} width="narrow">
        <ErrorView
          message={`${errorMessage(booking.error)} Your payment is safe.`}
          actionLabel="View my bookings"
          actionTo="/bookings"
        />
      </Screen>
    )
  }

  const data = booking.data
  if (!isPaid(data)) return <Navigate to={`/bookings/${data.id}`} replace />

  const { hotel, roomType } = data.room ?? {}
  const payment = data.payments?.findLast((attempt) => attempt.status === 'SUCCESS')
  const nights = nightsBetween(data.checkIn, data.checkOut)
  const address = [hotel?.address, hotel?.city].filter(Boolean).join(', ') || data.arrival?.address
  const checkInTime = hotel?.checkInTime ?? data.arrival?.checkInTime
  const checkOutTime = hotel?.checkOutTime ?? data.arrival?.checkOutTime
  const checkInText = `${formatDate(data.checkIn)}${checkInTime ? ` · from ${formatClock(checkInTime)}` : ''}`
  const checkOutText = `${formatDate(data.checkOut)}${checkOutTime ? ` · by ${formatClock(checkOutTime)}` : ''}`
  const receiptStay = {
    checkIn: checkInText,
    checkOut: checkOutText,
    nights: pluralize(nights, 'night'),
    guests: pluralize(data.guests, 'guest'),
    paidAt: payment?.paidAt ? formatTimestamp(payment.paidAt) : null,
    issued: formatDate(new Date().toISOString()),
  }

  return (
    <Screen header={header} width="narrow">
      <CheckInHero
        title="Payment successful"
        subtitle={hotel?.name ? `Your stay at ${hotel.name} is confirmed.` : 'Your stay is confirmed.'}
      />

      <Card className={styles.receipt} aria-labelledby="receipt-heading">
        <div className={styles.hotelRow}>
          <img src={hotelImage(hotel)} alt="" className={styles.hotelImage} />
          <div className={styles.hotelText}>
            <h2 id="receipt-heading" className={styles.hotelName}>
              {hotel?.name}
            </h2>
            {address && (
              <p className={styles.muted}>
                <MapPin size={14} aria-hidden="true" /> {address}
              </p>
            )}
          </div>
        </div>

        <Reference id={data.id} />

        <dl className={styles.details}>
          <Row term="Room" value={roomType?.name} />
          <Row term="Check-in" value={checkInText} />
          <Row term="Check-out" value={checkOutText} />
          <Row term="Length of stay" value={pluralize(nights, 'night')} />
          <Row term="Guests" value={pluralize(data.guests, 'guest')} />
          {data.addOns?.length > 0 && (
            <Row term="Extras" value={data.addOns.map((addOn) => addOn.name ?? addOn.code).join(', ')} />
          )}
        </dl>

        <Divider />

        <dl className={styles.details}>
          <div className={`${styles.row} ${styles.total}`}>
            <dt>Amount paid</dt>
            <dd>{formatKobo(payment?.amount ?? data.totalAmount)}</dd>
          </div>
          {payment?.paidAt && (
            <Row
              term="Paid"
              value={`${formatTimestamp(payment.paidAt)}${payment.channel ? ` · ${payment.channel}` : ''}`}
            />
          )}
          {payment?.reference && <Row term="Payment ref." value={payment.reference} mono />}
        </dl>
      </Card>

      <div className={styles.actions}>
        <DownloadReceiptButton booking={data} stay={receiptStay} />
        {canCheckInOnline(data) && (
          <Button fullWidth to={`/bookings/${data.id}/check-in`}>
            Check in online
          </Button>
        )}
        <Button fullWidth variant={canCheckInOnline(data) ? 'secondary' : 'primary'} to={`/bookings/${data.id}`}>
          View booking
        </Button>
        <Button fullWidth variant="ghost" to="/home">
          Back to home
        </Button>
      </div>
    </Screen>
  )
}

function Row({ term, value, mono = false }) {
  if (!value) return null
  return (
    <div className={styles.row}>
      <dt>{term}</dt>
      <dd className={mono ? styles.mono : undefined}>{value}</dd>
    </div>
  )
}

/** Booking reference with a copy button (the guest quotes it at the front desk). */
function Reference({ id }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked: the reference is still visible to copy by hand.
    }
  }

  return (
    <div className={styles.reference}>
      <div>
        <p className={styles.referenceLabel}>Booking reference</p>
        <p className={styles.referenceValue}>{id}</p>
      </div>
      <button type="button" className={styles.copyButton} onClick={copy} aria-label="Copy booking reference">
        {copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
        <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
      </button>
    </div>
  )
}

/**
 * Builds the PDF receipt on the device and saves it. The hotel's tax rates
 * and the room's price for these dates (GET /hotels/:id) let the receipt
 * itemise the total; without them it still lists what is known.
 */
function DownloadReceiptButton({ booking, stay }) {
  const { guest } = useAuth()
  const [state, setState] = useState('idle')

  const download = async () => {
    setState('working')
    let taxes
    let roomTotal
    try {
      const hotel = await getHotel(booking.room?.hotelId ?? booking.room?.hotel?.id, {
        checkIn: stayDate(booking.checkIn),
        checkOut: stayDate(booking.checkOut),
        guests: booking.guests,
      })
      taxes = hotel.taxes
      roomTotal = hotel.roomTypes?.find((item) => item.id === booking.room?.roomTypeId)?.price?.roomTotal
    } catch {
      // Offline or the hotel lookup failed: the receipt shows the total without the tax split.
    }

    try {
      const blob = buildReceiptPdf({ booking, taxes, roomTotal, guest, stay })
      downloadBlob(blob, `StayEase-receipt-${booking.id.slice(0, 8)}.pdf`)
      setState('idle')
    } catch {
      setState('error')
    }
  }

  return (
    <>
      <Button
        fullWidth
        variant="secondary"
        onClick={download}
        loading={state === 'working'}
        loadingLabel="Preparing receipt…"
        iconRight={<Download size={18} aria-hidden="true" />}
      >
        Download receipt (PDF)
      </Button>
      {state === 'error' && (
        <Alert tone="error" title="We couldn’t create your receipt">
          Please try again. Your booking and payment are not affected.
        </Alert>
      )}
    </>
  )
}
