import { useState } from 'react'
import { useLocation, useParams } from 'react-router'
import { Alert } from '../../components/feedback/Alert.jsx'
import { ErrorView, LoadingView } from '../../components/feedback/StatusView.jsx'
import { Screen, SplitLayout } from '../../components/layout/AppShell.jsx'
import { ScreenHeader } from '../../components/layout/ScreenHeader.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { getBooking, submitPreCheckIn } from '../../services/bookingService.js'
import { ArrivalDetailsFields } from './components/ArrivalDetailsFields.jsx'
import { CheckInComplete } from './components/CheckInComplete.jsx'
import { CheckInHero } from './components/CheckInHero.jsx'
import { GuestInfoCard } from './components/GuestInfoCard.jsx'
import { IdUploader } from './components/IdUploader.jsx'
import styles from './components/CheckIn.module.css'

/** Mobile pre-check-in (PC-01, PC-02, PC-03 optional, PC-07 front-desk fallback). */
export function CheckInPage() {
  const { bookingId } = useParams()
  const { state } = useLocation()
  const booking = useAsync(() => getBooking(bookingId), bookingId)

  const [arrival, setArrival] = useState({ arrivalTime: '', specialRequests: '' })
  const [idDocument, setIdDocument] = useState(null)
  const [submit, setSubmit] = useState({ status: 'idle' })

  const header = <ScreenHeader title="Digital Check-in" backTo="/bookings" />

  if (booking.status === 'loading') return <Screen header={header}><LoadingView label="Loading your booking…" /></Screen>
  if (booking.status === 'error') {
    return (
      <Screen header={header}>
        <ErrorView message={booking.error.message} actionLabel="View my bookings" actionTo="/bookings" />
      </Screen>
    )
  }

  if (booking.data.preCheckIn) {
    return (
      <Screen header={header} width="narrow">
        <CheckInComplete booking={booking.data} />
      </Screen>
    )
  }

  const isSubmitting = submit.status === 'submitting'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmit({ status: 'submitting' })
    try {
      const updated = await submitPreCheckIn(bookingId, { ...arrival, idDocument: idDocument?.file ?? null })
      setIdDocument(null)
      booking.setData(updated)
      window.scrollTo({ top: 0 })
    } catch (error) {
      setSubmit({ status: 'error', message: error.message })
    }
  }

  return (
    <Screen header={header}>
      {state?.justBooked && (
        <Alert tone="success" title="Payment successful">
          Booking {booking.data.id} at {booking.data.hotel.name} is confirmed.
        </Alert>
      )}

      <CheckInHero title="Check-in Ready!" subtitle="Complete your check-in before arrival for a faster experience." />

      <form onSubmit={handleSubmit} noValidate>
        <SplitLayout
          asideLabel="ID and submit"
          aside={
            <>
              <IdUploader value={idDocument} onChange={setIdDocument} disabled={isSubmitting} />

              {submit.status === 'error' && (
                <Alert tone="error" title="We couldn’t complete your check-in">
                  {submit.message} Your details are still here; please try again.
                </Alert>
              )}

              <Button type="submit" fullWidth loading={isSubmitting} loadingLabel="Submitting…">
                Submit &amp; Complete Check-in
              </Button>
              <p className={styles.frontDesk}>Rather do it in person? You can always check in at the front desk.</p>
            </>
          }
        >
          <GuestInfoCard guest={booking.data.guest} />
          <ArrivalDetailsFields
            value={arrival}
            onChange={setArrival}
            checkInFrom={booking.data.hotel.checkInFrom}
            disabled={isSubmitting}
          />
        </SplitLayout>
      </form>
    </Screen>
  )
}
