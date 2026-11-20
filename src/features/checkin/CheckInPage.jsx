import { useState } from 'react'
import { useParams } from 'react-router'
import { Alert } from '../../components/feedback/Alert.jsx'
import { ErrorView, LoadingView } from '../../components/feedback/StatusView.jsx'
import { Screen, SplitLayout } from '../../components/layout/AppShell.jsx'
import { ScreenHeader } from '../../components/layout/ScreenHeader.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { ERROR_CODES, errorMessage, fieldErrors } from '../../services/api/errors.js'
import { getMe } from '../../services/authService.js'
import { BOOKING_STATUS, getArrivalInfo, getBooking, getCheckInStatus, submitCheckIn } from '../../services/bookingService.js'
import { ArrivalDetailsFields } from './components/ArrivalDetailsFields.jsx'
import { CheckInComplete } from './components/CheckInComplete.jsx'
import { CheckInHero } from './components/CheckInHero.jsx'
import { GuestInfoCard } from './components/GuestInfoCard.jsx'
import styles from './components/CheckIn.module.css'

async function loadCheckIn(bookingId, signal) {
  const [booking, status, guest, arrival] = await Promise.all([
    getBooking(bookingId, { signal }),
    getCheckInStatus(bookingId, { signal }),
    getMe({ signal }),
    getArrivalInfo(bookingId, { signal }).catch(() => null),
  ])
  return { booking, status, guest, arrival }
}

/** Pre-arrival check-in: GET + POST /bookings/:id/check-in. No ID is needed (PC-01, PC-02). */
export function CheckInPage() {
  const { bookingId } = useParams()
  const page = useAsync((signal) => loadCheckIn(bookingId, signal), bookingId)

  const [arrival, setArrival] = useState({ arrivalTime: '', specialRequests: '' })
  const [editingGuest, setEditingGuest] = useState(false)
  const [guestEdits, setGuestEdits] = useState(null)
  const [errors, setErrors] = useState({})
  const [submit, setSubmit] = useState({ status: 'idle' })

  const header = <ScreenHeader title="Digital Check-in" backTo={`/bookings/${bookingId}`} />

  if (page.status === 'loading') return <Screen header={header}><LoadingView label="Loading your booking…" /></Screen>
  if (page.status === 'error') {
    return (
      <Screen header={header}>
        <ErrorView message={errorMessage(page.error)} actionLabel="View my bookings" actionTo="/bookings" />
      </Screen>
    )
  }

  const { booking, status, guest, arrival: arrivalInfo } = page.data

  if (status.checkInStatus === 'COMPLETED' || booking.status === BOOKING_STATUS.checkedIn) {
    return (
      <Screen header={header} width="narrow">
        <CheckInComplete booking={booking} arrival={arrivalInfo} />
      </Screen>
    )
  }

  if (!status.canCheckIn) {
    const unpaid = status.paymentStatus === 'UNPAID'
    return (
      <Screen header={header} width="narrow">
        <ErrorView
          title={unpaid ? 'Pay first to check in online' : 'Online check-in isn’t available'}
          message={
            unpaid
              ? 'Online check-in opens once your booking is paid.'
              : 'This booking is cancelled or the stay has ended. You can still check in at the front desk.'
          }
          actionLabel={unpaid && booking.status === BOOKING_STATUS.pending ? 'Pay now' : 'View booking'}
          actionTo={unpaid && booking.status === BOOKING_STATUS.pending ? `/bookings/${booking.id}/pay` : `/bookings/${booking.id}`}
        />
      </Screen>
    )
  }

  const isSubmitting = submit.status === 'submitting'
  const edits = guestEdits ?? { firstName: guest.firstName ?? '', lastName: guest.lastName ?? '', phone: guest.phone ?? '' }

  const changedGuestFields = () => {
    if (!editingGuest) return undefined
    const changes = {}
    for (const field of ['firstName', 'lastName', 'phone']) {
      const next = edits[field].trim()
      if (next && next !== (guest[field] ?? '')) changes[field] = next
    }
    return changes
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!arrival.arrivalTime) {
      setErrors({ arrivalTime: 'Choose when you expect to arrive.' })
      requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus())
      return
    }
    setErrors({})
    setSubmit({ status: 'submitting' })
    try {
      await submitCheckIn(bookingId, { ...arrival, guest: changedGuestFields() })
      setSubmit({ status: 'idle' })
      page.reload()
      window.scrollTo({ top: 0 })
    } catch (error) {
      setErrors(fieldErrors(error))
      setSubmit({ status: 'error', error })
    }
  }

  const submitError = submit.status === 'error' ? submit.error : null

  return (
    <Screen header={header}>
      <CheckInHero title="Check-in Ready!" subtitle="Complete your check-in before arrival for a faster experience." />

      <form onSubmit={handleSubmit} noValidate>
        <SplitLayout
          asideLabel="Submit check-in"
          aside={
            <>
              {submitError && (
                <Alert tone="error" title="We couldn’t complete your check-in">
                  {submitError.code === ERROR_CODES.BOOKING_NOT_PAID
                    ? 'Your booking isn’t paid yet.'
                    : submitError.code === ERROR_CODES.BOOKING_CLOSED
                      ? 'This booking is cancelled or the stay has ended.'
                      : `${errorMessage(submitError)} Your details are still here; please try again.`}
                </Alert>
              )}
              <Button type="submit" fullWidth loading={isSubmitting} loadingLabel="Submitting…">
                Submit &amp; Complete Check-in
              </Button>
              <p className={styles.frontDesk}>
                No ID upload needed. Bring a valid government ID to the front desk, or check in there in person if you prefer.
              </p>
            </>
          }
        >
          <GuestInfoCard
            guest={guest}
            editing={editingGuest}
            edits={edits}
            onEditsChange={setGuestEdits}
            onToggleEdit={() => {
              setEditingGuest((value) => !value)
              setGuestEdits(null)
            }}
            errors={errors}
            disabled={isSubmitting}
          />
          <ArrivalDetailsFields
            value={arrival}
            onChange={setArrival}
            checkInTime={arrivalInfo?.checkInTime}
            errors={errors}
            disabled={isSubmitting}
          />
        </SplitLayout>
      </form>
    </Screen>
  )
}
