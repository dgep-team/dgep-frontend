import { ArrowRight, CircleUserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Alert } from '../../components/feedback/Alert.jsx'
import { ErrorView, LoadingView } from '../../components/feedback/StatusView.jsx'
import { Brand } from '../../components/layout/Brand.jsx'
import { Screen, SplitLayout } from '../../components/layout/AppShell.jsx'
import { ScreenHeader } from '../../components/layout/ScreenHeader.jsx'
import { PriceSummary } from '../../components/pricing/PriceSummary.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { loginUrl } from '../../lib/redirect.js'
import { ERROR_CODES, errorMessage, fieldErrors } from '../../services/api/errors.js'
import { cancelBooking, createBooking } from '../../services/bookingService.js'
import { getHotel } from '../../services/hotelService.js'
import { useAuth } from '../../state/authContext.js'
import { selectionKey, useBookingFlow } from '../../state/bookingFlowContext.js'
import { AddOnsCard } from './components/AddOnsCard.jsx'
import { GuestDetailsCard } from './components/GuestDetailsCard.jsx'
import { EMPTY_GUEST, validateGuest } from './guestDetails.js'
import { HotelSummaryCard } from './components/HotelSummaryCard.jsx'
import { RoomSelectedCard } from './components/RoomSelectedCard.jsx'
import { StayDetailsCard } from './components/StayDetailsCard.jsx'
import styles from './BookingDetailsPage.module.css'

/**
 * Booking details: GET /hotels/:id for the room's live availability and
 * all-in price, then POST /bookings. The booking is PENDING (room held 30
 * minutes) until paid on the next screen.
 */
export function BookingDetailsPage() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const { draft, updateDraft } = useBookingFlow()
  const { hotelId, roomTypeId, checkIn, checkOut, guests } = draft

  const hotelRequest = useAsync(
    (signal) => getHotel(hotelId, { checkIn, checkOut, guests, signal }),
    hotelId ? `${hotelId}|${checkIn}|${checkOut}|${guests}` : null,
  )

  const [guest, setGuest] = useState(EMPTY_GUEST)
  const [errors, setErrors] = useState({})
  const [submit, setSubmit] = useState({ status: 'idle' })

  const header = (
    <ScreenHeader
      backTo="/search"
      center={<Brand />}
      right={
        <Link to="/profile" className={styles.profile} aria-label="Profile">
          <CircleUserRound size={28} aria-hidden="true" />
        </Link>
      }
    />
  )

  if (!hotelId || !roomTypeId) {
    return (
      <Screen header={header} width="narrow">
        <ErrorView title="Choose a room first" message="Pick dates and a room to start a booking." actionLabel="Find a room" actionTo="/search" />
      </Screen>
    )
  }
  if (hotelRequest.status === 'loading' || hotelRequest.status === 'idle') {
    return <Screen header={header}><LoadingView label="Checking availability…" /></Screen>
  }
  if (hotelRequest.status === 'error') {
    return (
      <Screen header={header}>
        <ErrorView message={errorMessage(hotelRequest.error)} actionLabel="Try again" onAction={hotelRequest.reload} />
      </Screen>
    )
  }

  const { roomTypes = [], ...hotel } = hotelRequest.data
  const roomType = roomTypes.find((item) => item.id === roomTypeId)
  const isAvailable = Boolean(roomType && roomType.availableRooms > 0)
  const isSubmitting = submit.status === 'submitting'
  const validAddOns = draft.addOns.filter((code) => hotel.addOns?.some((addOn) => addOn.code === code))

  const handleSubmit = async (event) => {
    event.preventDefault()
    const selection = { roomTypeId, checkIn, checkOut, guests, addOns: validAddOns }
    const key = selectionKey(selection)

    // Same selection as the unpaid booking we already made: reuse it.
    if (draft.pending?.key === key) {
      navigate(`/bookings/${draft.pending.bookingId}/pay`)
      return
    }

    const problems = isLoggedIn ? {} : validateGuest(guest)
    setErrors(problems)
    if (Object.keys(problems).length > 0) {
      requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus())
      return
    }

    setSubmit({ status: 'submitting' })
    try {
      // Give back the room held by an earlier, now-abandoned selection.
      if (draft.pending?.bookingId && isLoggedIn) cancelBooking(draft.pending.bookingId).catch(() => {})

      const guestDetails = isLoggedIn
        ? undefined
        : {
            email: guest.email.trim(),
            firstName: guest.firstName.trim(),
            lastName: guest.lastName.trim(),
            ...(guest.phone.trim() && { phone: guest.phone.trim() }),
          }
      const { booking, price } = await createBooking({ ...selection, guest: guestDetails })
      updateDraft({ pending: { bookingId: booking.id, key, price } })
      navigate(`/bookings/${booking.id}/pay`)
    } catch (error) {
      setErrors(fieldErrors(error))
      setSubmit({ status: 'error', error })
      if (error.code === ERROR_CODES.ROOM_NOT_AVAILABLE) hotelRequest.reload()
      if (error.code === ERROR_CODES.UNKNOWN_ADD_ON) updateDraft({ addOns: [] })
    }
  }

  return (
    <Screen header={header} labelledBy="booking-title">
      <form onSubmit={handleSubmit} noValidate>
        <SplitLayout
          asideLabel="Price and payment"
          aside={
            <>
              {isAvailable && (
                <PriceSummary
                  price={roomType.price}
                  note={
                    validAddOns.length > 0
                      ? 'Extras and their taxes are added to this total on the next step, before you pay.'
                      : undefined
                  }
                />
              )}
              {submit.status === 'error' && <SubmitError error={submit.error} />}
              <Button
                type="submit"
                fullWidth
                disabled={!isAvailable}
                loading={isSubmitting}
                loadingLabel="Reserving your room…"
                iconRight={<ArrowRight size={20} aria-hidden="true" />}
              >
                Continue to payment
              </Button>
            </>
          }
        >
          <h1 id="booking-title" className={styles.title}>
            Booking Details
          </h1>
          <HotelSummaryCard hotel={hotel} />
          <StayDetailsCard
            draft={draft}
            maxGuests={roomType?.maxGuests}
            onChange={(changes) => updateDraft(changes)}
            disabled={isSubmitting}
          />

          {!isAvailable && (
            <Alert tone="warning" title="This room isn’t available for your dates">
              {roomType
                ? 'It’s fully booked. Try other dates, or '
                : 'It can’t take your party size or is no longer offered. Try fewer guests, or '}
              <Link to="/search">choose another room</Link>.
            </Alert>
          )}

          {roomType && (
            <section className={styles.section} aria-labelledby="room-heading">
              <h2 id="room-heading" className={styles.sectionTitle}>
                Room Selected
              </h2>
              <RoomSelectedCard roomType={roomType} />
            </section>
          )}

          {isAvailable && (
            <AddOnsCard
              addOns={hotel.addOns}
              selected={validAddOns}
              onChange={(addOns) => updateDraft({ addOns })}
              disabled={isSubmitting}
            />
          )}

          {isAvailable && !isLoggedIn && (
            <GuestDetailsCard value={guest} onChange={setGuest} errors={errors} disabled={isSubmitting} />
          )}
        </SplitLayout>
      </form>
    </Screen>
  )
}

function SubmitError({ error }) {
  switch (error.code) {
    case ERROR_CODES.ROOM_NOT_AVAILABLE:
      return (
        <Alert tone="error" title="Someone just booked the last room">
          Try other dates, or <Link to="/search">choose another room</Link>.
        </Alert>
      )
    case ERROR_CODES.LOGIN_REQUIRED:
      return (
        <Alert tone="error" title="This email already has an account">
          <Link to={loginUrl('/booking')}>Log in</Link> to finish booking.
        </Alert>
      )
    case ERROR_CODES.UNKNOWN_ADD_ON:
      return <Alert tone="error" title="One of the extras is no longer offered">We removed it. Please check and try again.</Alert>
    default:
      return <Alert tone="error" title="We couldn’t reserve your room">{errorMessage(error)}</Alert>
  }
}
