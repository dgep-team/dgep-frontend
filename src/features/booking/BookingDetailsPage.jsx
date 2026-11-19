import { ArrowRight, CircleUserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { ErrorView, LoadingView } from '../../components/feedback/StatusView.jsx'
import { Brand } from '../../components/layout/Brand.jsx'
import { Screen, SplitLayout } from '../../components/layout/AppShell.jsx'
import { ScreenHeader } from '../../components/layout/ScreenHeader.jsx'
import { PriceSummary } from '../../components/pricing/PriceSummary.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { buildQuote } from '../../lib/pricing.js'
import { getHotelAndRoom } from '../../services/hotelService.js'
import { useBookingFlow } from '../../state/bookingFlowContext.js'
import { HotelSummaryCard } from './components/HotelSummaryCard.jsx'
import { RoomSelectedCard } from './components/RoomSelectedCard.jsx'
import { StayDetailsCard } from './components/StayDetailsCard.jsx'
import styles from './BookingDetailsPage.module.css'

export function BookingDetailsPage() {
  const navigate = useNavigate()
  const { draft, updateDraft } = useBookingFlow()
  const selection = useAsync(() => getHotelAndRoom(draft.hotelId, draft.roomId), `${draft.hotelId}/${draft.roomId}`)

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

  if (selection.status === 'loading') return <Screen header={header}><LoadingView label="Loading your booking…" /></Screen>
  if (selection.status === 'error') {
    return (
      <Screen header={header}>
        <ErrorView message={selection.error.message} actionLabel="Search hotels" actionTo="/search" />
      </Screen>
    )
  }

  const { hotel, room } = selection.data
  // Same function the server runs, so this total is what payment will charge.
  const quote = buildQuote({ room, ...draft })

  return (
    <Screen header={header} labelledBy="booking-title">
      <SplitLayout
        asideLabel="Price and payment"
        aside={
          <>
            <PriceSummary quote={quote} />
            <Button
              fullWidth
              iconRight={<ArrowRight size={20} aria-hidden="true" />}
              onClick={() => navigate('/booking/payment')}
            >
              Proceed to Payment
            </Button>
          </>
        }
      >
        <h1 id="booking-title" className={styles.title}>Booking Details</h1>
        <HotelSummaryCard hotel={hotel} />
        <StayDetailsCard draft={draft} room={room} onChange={updateDraft} />

        <section className={styles.section} aria-labelledby="room-heading">
          <h2 id="room-heading" className={styles.sectionTitle}>Room Selected</h2>
          <RoomSelectedCard room={room} />
        </section>
      </SplitLayout>
    </Screen>
  )
}
