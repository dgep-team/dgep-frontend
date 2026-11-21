import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { ErrorView, LoadingView } from '../../components/feedback/StatusView.jsx'
import { Screen } from '../../components/layout/AppShell.jsx'
import { ScreenHeader } from '../../components/layout/ScreenHeader.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { errorMessage } from '../../services/api/errors.js'
import { getMe } from '../../services/authService.js'
import { BOOKING_STATUS, getArrivalInfo, getBooking, getCheckInStatus } from '../../services/bookingService.js'
import { ArrivalDetailsFields } from './components/ArrivalDetailsFields.jsx'
import { CheckInComplete } from './components/CheckInComplete.jsx'
import { CheckInQr } from './components/CheckInQr.jsx'
import { GuestInfoCard } from './components/GuestInfoCard.jsx'
import { StaySummaryCard } from './components/StaySummaryCard.jsx'
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

/**
 * Digital check-in, step 1 of 2: stay summary, the check-in QR code and the
 * arrival details. "Continue to ID Upload" carries the details to step 2
 * (IdUploadPage), which sends POST /bookings/:id/check-in.
 */
export function CheckInPage() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const page = useAsync((signal) => loadCheckIn(bookingId, signal), bookingId)

  // Coming back from the ID step keeps what the guest already entered.
  const returning = location.state?.checkIn
  const [arrival, setArrival] = useState(returning?.arrival ?? { arrivalTime: '', specialRequests: '' })
  const [editingGuest, setEditingGuest] = useState(Boolean(returning?.guest))
  const [guestEdits, setGuestEdits] = useState(returning?.guestEdits ?? null)
  const [errors, setErrors] = useState({})

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

  const handleContinue = (event) => {
    event.preventDefault()
    if (!arrival.arrivalTime) {
      setErrors({ arrivalTime: 'Choose when you expect to arrive.' })
      requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus())
      return
    }
    setErrors({})
    navigate(`/bookings/${bookingId}/check-in/id`, {
      state: { checkIn: { arrival, guest: changedGuestFields(), guestEdits: editingGuest ? edits : null } },
    })
  }

  return (
    <Screen header={header} width="narrow">
      <form className={styles.form} onSubmit={handleContinue} noValidate>
        <StaySummaryCard booking={booking} />
        <CheckInQr bookingId={booking.id} />
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
        />
        <ArrivalDetailsFields value={arrival} onChange={setArrival} checkInTime={arrivalInfo?.checkInTime} errors={errors} />
        {/* The action sits right after Special requests, at every width. */}
        <Button type="submit" fullWidth iconRight={<ArrowRight size={18} aria-hidden="true" />}>
          Continue to ID Upload
        </Button>
        <p className={styles.frontDesk}>Step 1 of 2. Next, add a photo of your ID.</p>
      </form>
    </Screen>
  )
}
