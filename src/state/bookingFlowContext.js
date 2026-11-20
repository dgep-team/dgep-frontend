import { createContext, useContext } from 'react'

export const BookingFlowContext = createContext(null)

/**
 * The in-progress booking shared by the flow's screens:
 * { draft: { hotelId, roomTypeId, checkIn, checkOut, guests, addOns, pending }, updateDraft, resetDraft }.
 */
export function useBookingFlow() {
  const value = useContext(BookingFlowContext)
  if (!value) throw new Error('useBookingFlow must be used inside <BookingFlowProvider>')
  return value
}

/** Identifies what a pending booking was made for. */
export function selectionKey({ roomTypeId, checkIn, checkOut, guests, addOns }) {
  return JSON.stringify([roomTypeId, checkIn, checkOut, guests, [...(addOns ?? [])].sort()])
}
