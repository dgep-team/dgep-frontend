// Saved rooms and hotels.
//
// The DGEP API has no favourites endpoint yet, so saves live in localStorage,
// one list per owner: the guest's id when logged in, 'device' otherwise.
// Screens only use this module (through SavedProvider), so moving saves to
// the API later means changing this file alone.
//
// Each save keeps a small snapshot of what was saved, so the Saved screen
// renders instantly and offline. Booking Details always reloads live prices.

const KEY_PREFIX = 'stayease.saved.'
export const DEVICE_OWNER = 'device'

const keyFor = (owner) => `${KEY_PREFIX}${owner || DEVICE_OWNER}`

function read(owner) {
  try {
    const raw = window.localStorage.getItem(keyFor(owner))
    const items = raw ? JSON.parse(raw) : []
    return Array.isArray(items) ? items : []
  } catch {
    return []
  }
}

function write(owner, items) {
  try {
    window.localStorage.setItem(keyFor(owner), JSON.stringify(items))
  } catch {
    // Storage blocked or full: the save lasts for this session only.
  }
}

export const savedId = (kind, id) => `${kind}:${id}`

// Only what the Saved screen and booking need; keeps storage small.
function hotelSnapshot(hotel) {
  return {
    id: hotel.id,
    name: hotel.name,
    city: hotel.city,
    address: hotel.address,
    photos: hotel.photos?.slice(0, 1) ?? [],
    fromPricePerNight: hotel.fromPricePerNight ?? null,
  }
}

function roomSnapshot(roomType) {
  return {
    id: roomType.id,
    name: roomType.name,
    pricePerNight: roomType.pricePerNight,
    maxGuests: roomType.maxGuests,
    bedType: roomType.bedType ?? null,
    sizeSqm: roomType.sizeSqm ?? null,
    photos: roomType.photos?.slice(0, 1) ?? [],
  }
}

/** Builds a save. `kind` is 'room' (needs hotel + roomType) or 'hotel'. */
export function makeSavedItem(kind, { hotel, roomType }) {
  const base = { kind, hotel: hotelSnapshot(hotel), savedAt: new Date().toISOString() }
  return kind === 'room'
    ? { ...base, id: savedId('room', roomType.id), roomType: roomSnapshot(roomType) }
    : { ...base, id: savedId('hotel', hotel.id) }
}

export const savedStore = {
  /** Newest first. */
  list: (owner) => read(owner),

  add(owner, item) {
    const items = read(owner).filter((existing) => existing.id !== item.id)
    const next = [item, ...items]
    write(owner, next)
    return next
  },

  remove(owner, id) {
    const next = read(owner).filter((item) => item.id !== id)
    write(owner, next)
    return next
  },

  /**
   * Moves saves made while logged out into the guest's own list, so nothing
   * saved before logging in is lost. Returns the merged list.
   */
  adoptDeviceSaves(owner) {
    if (!owner || owner === DEVICE_OWNER) return read(owner)
    const deviceItems = read(DEVICE_OWNER)
    if (deviceItems.length === 0) return read(owner)
    const ownIds = new Set(read(owner).map((item) => item.id))
    const merged = [...deviceItems.filter((item) => !ownIds.has(item.id)), ...read(owner)].sort((a, b) =>
      b.savedAt.localeCompare(a.savedAt),
    )
    write(owner, merged)
    write(DEVICE_OWNER, [])
    return merged
  },

  /** Calls `listener(owner)` when another tab changes saves. */
  subscribe(listener) {
    const onStorage = (event) => {
      if (event.key?.startsWith(KEY_PREFIX)) listener(event.key.slice(KEY_PREFIX.length))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  },
}
