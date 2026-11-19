import { createContext, useContext } from 'react'

export const BookingFlowContext = createContext(null)

/** The in-progress booking (hotel, room, dates, party) shared by the flow's screens. */
export function useBookingFlow() {
  const value = useContext(BookingFlowContext)
  if (!value) throw new Error('useBookingFlow must be used inside <BookingFlowProvider>')
  return value
}
