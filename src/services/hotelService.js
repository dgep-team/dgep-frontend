import { hotels } from '../data/mockDb.js'
import { ApiError, simulateRequest } from './apiClient.js'

export function findHotelAndRoom(hotelId, roomId) {
  const hotel = hotels.find((h) => h.id === hotelId)
  const room = hotel?.rooms.find((r) => r.id === roomId)
  if (!hotel || !room) {
    throw new ApiError('That room is no longer available.', { status: 404, code: 'room_not_found' })
  }
  return { hotel, room }
}

export function getHotelAndRoom(hotelId, roomId) {
  return simulateRequest(() => findHotelAndRoom(hotelId, roomId))
}

/** The full room catalog for search (BR-01/BR-02). */
export function getRoomCatalog() {
  return simulateRequest(() => hotels)
}
