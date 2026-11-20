import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEVICE_OWNER, makeSavedItem, savedId, savedStore } from '../services/savedService.js'
import { useAuth } from './authContext.js'
import { SavedContext } from './savedContext.js'

/** Must sit inside <AuthProvider>: saves belong to the logged-in guest. */
export function SavedProvider({ children }) {
  const { guest, isLoggedIn } = useAuth()
  const owner = isLoggedIn && guest?.id ? guest.id : DEVICE_OWNER

  // Items are tagged with the owner they were read for. When the owner changes
  // (login, logout, account switch) the list is reloaded during render, React's
  // pattern for resetting state from a prop, so the previous owner's saves are
  // never shown. On login this also brings in anything saved while logged out;
  // adoptDeviceSaves is idempotent, so a repeated render is harmless.
  const [state, setState] = useState(() => ({ owner, items: savedStore.adoptDeviceSaves(owner) }))
  if (state.owner !== owner) setState({ owner, items: savedStore.adoptDeviceSaves(owner) })
  const items = state.items

  // Keep in step with other tabs.
  useEffect(
    () =>
      savedStore.subscribe((changedOwner) => {
        if (changedOwner === owner) setState({ owner, items: savedStore.list(owner) })
      }),
    [owner],
  )

  const isSaved = useCallback(
    (kind, id) => items.some((item) => item.id === savedId(kind, id)),
    [items],
  )

  const toggle = useCallback(
    (kind, stay) => {
      const id = savedId(kind, kind === 'room' ? stay.roomType.id : stay.hotel.id)
      const next = items.some((item) => item.id === id)
        ? savedStore.remove(owner, id)
        : savedStore.add(owner, makeSavedItem(kind, stay))
      setState({ owner, items: next })
    },
    [items, owner],
  )

  const remove = useCallback((id) => setState({ owner, items: savedStore.remove(owner, id) }), [owner])

  const value = useMemo(
    () => ({
      items,
      rooms: items.filter((item) => item.kind === 'room'),
      hotels: items.filter((item) => item.kind === 'hotel'),
      isSaved,
      toggle,
      remove,
      scope: owner === DEVICE_OWNER ? 'device' : 'account',
    }),
    [items, isSaved, toggle, remove, owner],
  )

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>
}
