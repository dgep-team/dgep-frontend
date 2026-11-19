import { useCallback, useEffect, useMemo, useState } from 'react'
import { defaultBookingDraft } from '../data/mockDb.js'
import { adjustStay, toIsoDate } from '../lib/dates.js'
import { sessionStore } from '../services/apiClient.js'
import { BookingFlowContext } from './bookingFlowContext.js'

const STORE_KEY = 'stayease.draft'

export function BookingFlowProvider({ children }) {
  // Until search (BR-01) exists, the flow starts from the seeded selection.
  // A draft restored from storage may have dates that are now in the past.
  const [draft, setDraft] = useState(() => {
    const saved = sessionStore.read(STORE_KEY, defaultBookingDraft)
    return { ...saved, ...adjustStay(saved, {}, toIsoDate(new Date())) }
  })

  useEffect(() => {
    sessionStore.write(STORE_KEY, draft)
  }, [draft])

  const updateDraft = useCallback((changes) => setDraft((current) => ({ ...current, ...changes })), [])

  const value = useMemo(() => ({ draft, updateDraft }), [draft, updateDraft])

  return <BookingFlowContext.Provider value={value}>{children}</BookingFlowContext.Provider>
}
