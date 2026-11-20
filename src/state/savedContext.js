import { createContext, useContext } from 'react'

export const SavedContext = createContext(null)

/**
 * Saved rooms and hotels: { items, rooms, hotels, isSaved(kind, id), toggle(kind, stay), remove(id), scope }.
 * `stay` is { hotel, roomType } for a room, { hotel } for a hotel.
 * `scope` is 'account' when saves follow the logged-in guest, 'device' otherwise.
 */
export function useSaved() {
  const value = useContext(SavedContext)
  if (!value) throw new Error('useSaved must be used inside <SavedProvider>')
  return value
}
