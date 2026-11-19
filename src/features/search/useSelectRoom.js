import { useNavigate } from 'react-router'
import { useBookingFlow } from '../../state/bookingFlowContext.js'

/**
 * Returns a handler that makes a catalog entry the room being booked and
 * opens Booking Details. Shared by Search and Home.
 */
export function useSelectRoom() {
  const navigate = useNavigate()
  const { draft, updateDraft } = useBookingFlow()

  return ({ hotel, room }) => {
    // Keep the party valid for the new room's capacity.
    const rooms = Math.min(draft.rooms, room.maxRooms)
    const guests = Math.min(Math.max(draft.guests, rooms), rooms * room.maxGuestsPerRoom)
    updateDraft({ hotelId: hotel.id, roomId: room.id, rooms, guests })
    navigate('/booking')
  }
}
