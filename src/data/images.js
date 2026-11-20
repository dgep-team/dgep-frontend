// Local images used when a hotel or room type has no photos from the API.
import ekoLobbyImage from '../assets/images/lobby.jpg'
import lagoonPoolImage from '../assets/images/pool.jpg'
import capitalReceptionImage from '../assets/images/reception.jpg'
import deluxeRoomImage from '../assets/images/room.jpg'
import standardRoomImage from '../assets/images/standard.jpg'
import executiveSuiteImage from '../assets/images/suite.jpg'

const HOTEL_FALLBACKS = [ekoLobbyImage, capitalReceptionImage, lagoonPoolImage]
const ROOM_FALLBACKS = [standardRoomImage, deluxeRoomImage, executiveSuiteImage]

// Same id -> same picture on every screen.
function pick(list, id = '') {
  let hash = 0
  for (const char of String(id)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return list[hash % list.length]
}

export const hotelImage = (hotel) => hotel?.photos?.[0] || pick(HOTEL_FALLBACKS, hotel?.id)
export const roomImage = (roomType) => roomType?.photos?.[0] || pick(ROOM_FALLBACKS, roomType?.id)

export const CITY_IMAGES = { Lagos: lagoonPoolImage, Abuja: capitalReceptionImage }
