import { api } from './api/client.js'

/** GET /hotels: live hotels, cheapest first. `city` is not case sensitive. */
export function listHotels({ city, signal } = {}) {
  return api.get('/hotels', { query: { city }, auth: false, signal })
}

/**
 * GET /hotels/:id. With checkIn + checkOut every room type also has
 * `availableRooms` and an all-in `price` (without add-ons); with `guests`,
 * room types too small for the party are left out.
 */
export function getHotel(hotelId, { checkIn, checkOut, guests, signal } = {}) {
  const query = checkIn && checkOut ? { checkIn, checkOut, guests } : { guests }
  return api.get(`/hotels/${encodeURIComponent(hotelId)}`, { query, auth: false, signal })
}

/** GET /room-types/compare: 1 to 3 room types side by side, in the order asked. */
export function compareRoomTypes(ids, { checkIn, checkOut, signal } = {}) {
  return api.get('/room-types/compare', { query: { ids: ids.slice(0, 3).join(','), checkIn, checkOut }, auth: false, signal })
}

/**
 * Every bookable room type for a stay, across all live hotels, as
 * [{ hotel, roomType }]. Only room types with a free room are included.
 */
export async function searchStays({ checkIn, checkOut, guests, city, signal }) {
  const hotels = await listHotels({ city, signal })
  const details = await Promise.all(hotels.map((hotel) => getHotel(hotel.id, { checkIn, checkOut, guests, signal })))

  return details.flatMap(({ roomTypes = [], ...hotel }) =>
    roomTypes.filter((roomType) => roomType.availableRooms > 0).map((roomType) => ({ hotel, roomType })),
  )
}
