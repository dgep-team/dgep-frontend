import { useNavigate } from 'react-router'
import { useBookingFlow } from '../../state/bookingFlowContext.js'

/**
 * Returns a handler that makes a stay ({ hotel, roomType }) the one being
 * booked and opens Booking Details. Shared by Search and Home.
 */
export function useSelectRoom() {
  const navigate = useNavigate()
  const { draft, updateDraft } = useBookingFlow()

  return ({ hotel, roomType }) => {
    const sameRoom = draft.roomTypeId === roomType.id
    updateDraft({
      hotelId: hotel.id,
      roomTypeId: roomType.id,
      // Keep the party within the room's capacity.
      guests: Math.min(Math.max(draft.guests, 1), roomType.maxGuests ?? draft.guests),
      // Add-ons are per hotel.
      addOns: sameRoom ? draft.addOns : [],
    })
    navigate('/booking')
  }
}
