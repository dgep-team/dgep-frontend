import { useCallback, useEffect, useMemo, useState } from 'react'
import { addDays, adjustStay, toIsoDate } from '../lib/dates.js'
import { sessionStore } from '../lib/storage.js'
import { BookingFlowContext } from './bookingFlowContext.js'

const STORE_KEY = 'stayease.draft.v2'

function initialDraft() {
  const today = toIsoDate(new Date())
  return {
    hotelId: null,
    roomTypeId: null,
    checkIn: addDays(today, 1),
    checkOut: addDays(today, 3),
    guests: 1,
    addOns: [],
    // The unpaid booking made from this draft: { bookingId, key, price }.
    // Reused while the selection is unchanged so going back and forth never
    // creates (and holds) a second room.
    pending: null,
  }
}

export function BookingFlowProvider({ children }) {
  // A draft restored from storage may have dates that are now in the past.
  const [draft, setDraft] = useState(() => {
    const saved = { ...initialDraft(), ...sessionStore.read(STORE_KEY, {}) }
    return { ...saved, ...adjustStay(saved, {}, toIsoDate(new Date())) }
  })

  useEffect(() => {
    sessionStore.write(STORE_KEY, draft)
  }, [draft])

  const updateDraft = useCallback((changes) => setDraft((current) => ({ ...current, ...changes })), [])
  const resetDraft = useCallback(
    () => setDraft((current) => ({ ...initialDraft(), checkIn: current.checkIn, checkOut: current.checkOut, guests: current.guests })),
    [],
  )

  const value = useMemo(() => ({ draft, updateDraft, resetDraft }), [draft, updateDraft, resetDraft])

  return <BookingFlowContext.Provider value={value}>{children}</BookingFlowContext.Provider>
}
