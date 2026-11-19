// Seed data standing in for the hotel inventory and guest-profile APIs.
// Room records follow the PRD's required room-data template (HS-01).
// Lagoon View and Capital Crest are fictional demo properties.
import heritageSuiteImage from '../assets/images/afrosittingarea.jpg'
import signatureSuiteImage from '../assets/images/beadarea.jpg'
import executiveLoungeImage from '../assets/images/exec.jpg'
import juniorSuiteImage from '../assets/images/rm.jpg'
import ekoLobbyImage from '../assets/images/lobby.jpg'
import lagoonPoolImage from '../assets/images/pool.jpg'
import capitalReceptionImage from '../assets/images/reception.jpg'
import presidentialSuiteImage from '../assets/images/rm3.jpg'
import deluxeRoomImage from '../assets/images/room.jpg'
import superiorKingImage from '../assets/images/roomview.jpg'
import standardRoomImage from '../assets/images/standard.jpg'
import executiveSuiteImage from '../assets/images/suite.jpg'

const STANDARD_CANCELLATION = 'Free cancellation until 48 hours before check-in.'
const SUITE_CANCELLATION = 'Free cancellation until 7 days before check-in; 1 night charged after that.'

export const hotels = [
  {
    id: 'eko-hotels-suites',
    name: 'Eko Hotels & Suites',
    rating: 4.6,
    reviewCount: 2500,
    location: 'Victoria Island, Lagos',
    imageUrl: ekoLobbyImage,
    checkInFrom: '14:00',
    rooms: [
      {
        id: 'deluxe-room',
        name: 'Deluxe Room',
        description: 'A calm king room with a work desk and lounge corner, ideal for short city stays.',
        imageUrl: deluxeRoomImage,
        nightlyRate: 120000,
        taxesAndFeesPerRoomNight: 10000,
        maxGuestsPerRoom: 2,
        maxRooms: 5,
        bedType: '1 King bed',
        sizeSqm: 32,
        view: 'City view',
        bathroom: 'Private bathroom with walk-in shower',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Smart TV', 'Mini fridge'],
        accessibility: 'Step-free access; grab rails on request',
        cancellationPolicy: STANDARD_CANCELLATION,
      },
      {
        id: 'executive-suite',
        name: 'Executive Suite',
        description: 'Separate living room with floor-to-ceiling windows over the Lagos skyline.',
        imageUrl: executiveSuiteImage,
        nightlyRate: 380000,
        taxesAndFeesPerRoomNight: 25000,
        maxGuestsPerRoom: 3,
        maxRooms: 2,
        bedType: '1 King bed + sofa bed',
        sizeSqm: 68,
        view: 'Skyline view',
        bathroom: 'Marble bathroom with bathtub and rain shower',
        amenities: ['Free Wi-Fi', 'Executive lounge access', 'Nespresso machine', 'Minibar', 'Bathrobes'],
        accessibility: 'Step-free access; walk-in shower',
        cancellationPolicy: SUITE_CANCELLATION,
      },
      {
        id: 'presidential-suite',
        name: 'Presidential Suite',
        description: 'Our grandest suite: private terrace, dining for eight and a dedicated butler.',
        imageUrl: presidentialSuiteImage,
        nightlyRate: 950000,
        taxesAndFeesPerRoomNight: 60000,
        maxGuestsPerRoom: 4,
        maxRooms: 1,
        bedType: '2 King beds',
        sizeSqm: 210,
        view: 'Terrace and ocean view',
        bathroom: 'Two marble bathrooms with soaking tub and steam shower',
        amenities: ['Butler service', 'Private terrace', 'Dining room', 'Airport transfer', 'Free Wi-Fi', 'Minibar'],
        accessibility: 'Step-free access throughout',
        cancellationPolicy: SUITE_CANCELLATION,
      },
    ],
  },
  {
    id: 'lagoon-view-hotel',
    name: 'Lagoon View Hotel',
    rating: 4.4,
    reviewCount: 1180,
    location: 'Lekki Phase 1, Lagos',
    imageUrl: lagoonPoolImage,
    checkInFrom: '15:00',
    rooms: [
      {
        id: 'superior-king-balcony',
        name: 'Superior King with Balcony',
        description: 'Bright, modern king room that opens onto a private balcony.',
        imageUrl: superiorKingImage,
        nightlyRate: 155000,
        taxesAndFeesPerRoomNight: 12000,
        maxGuestsPerRoom: 2,
        maxRooms: 4,
        bedType: '1 King bed',
        sizeSqm: 40,
        view: 'Lagoon view with balcony',
        bathroom: 'Private bathroom with rain shower',
        amenities: ['Free Wi-Fi', 'Balcony', 'Smart TV', 'Coffee maker', 'Air conditioning'],
        accessibility: 'Step-free access; balcony has a low threshold',
        cancellationPolicy: STANDARD_CANCELLATION,
      },
      {
        id: 'signature-suite',
        name: 'Signature Suite',
        description: 'Designer bedroom with sculpted headboard, marble floors and a curtained lounge.',
        imageUrl: signatureSuiteImage,
        nightlyRate: 320000,
        taxesAndFeesPerRoomNight: 22000,
        maxGuestsPerRoom: 2,
        maxRooms: 2,
        bedType: '1 King bed',
        sizeSqm: 60,
        view: 'Lagoon view',
        bathroom: 'Marble bathroom with freestanding tub',
        amenities: ['Free Wi-Fi', 'Lounge area', 'Minibar', 'Bathrobes', 'Turndown service'],
        accessibility: 'Step-free access',
        cancellationPolicy: SUITE_CANCELLATION,
      },
      {
        id: 'heritage-suite',
        name: 'Heritage Suite',
        description: 'Afro-modern suite with hand-woven textiles, pattern walls and a sunken lounge.',
        imageUrl: heritageSuiteImage,
        nightlyRate: 450000,
        taxesAndFeesPerRoomNight: 30000,
        maxGuestsPerRoom: 4,
        maxRooms: 1,
        bedType: '1 King bed + 2 Single beds',
        sizeSqm: 95,
        view: 'Garden view',
        bathroom: 'Two bathrooms, one with soaking tub',
        amenities: ['Free Wi-Fi', 'Living room', 'Kitchenette', 'Breakfast included', 'Minibar'],
        accessibility: 'Step-free access; walk-in shower',
        cancellationPolicy: SUITE_CANCELLATION,
      },
    ],
  },
  {
    id: 'capital-crest-hotel',
    name: 'Capital Crest Hotel',
    rating: 4.2,
    reviewCount: 860,
    location: 'Wuse II, Abuja',
    imageUrl: capitalReceptionImage,
    checkInFrom: '14:00',
    rooms: [
      {
        id: 'standard-room',
        name: 'Standard Room',
        description: 'Comfortable, great-value king room with a desk and city views.',
        imageUrl: standardRoomImage,
        nightlyRate: 65000,
        taxesAndFeesPerRoomNight: 5000,
        maxGuestsPerRoom: 2,
        maxRooms: 6,
        bedType: '1 King bed',
        sizeSqm: 26,
        view: 'City view',
        bathroom: 'Private bathroom with shower',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Work desk', 'TV'],
        accessibility: 'Step-free access; accessible room on request',
        cancellationPolicy: STANDARD_CANCELLATION,
      },
      {
        id: 'junior-suite',
        name: 'Junior Suite',
        description: 'Open-plan suite with a sofa lounge, perfect for longer business trips.',
        imageUrl: juniorSuiteImage,
        nightlyRate: 210000,
        taxesAndFeesPerRoomNight: 15000,
        maxGuestsPerRoom: 3,
        maxRooms: 3,
        bedType: '1 King bed + sofa bed',
        sizeSqm: 52,
        view: 'City view',
        bathroom: 'Private bathroom with bathtub',
        amenities: ['Free Wi-Fi', 'Lounge area', 'Minibar', 'Work desk', 'Smart TV'],
        accessibility: 'Step-free access',
        cancellationPolicy: STANDARD_CANCELLATION,
      },
      {
        id: 'executive-lounge-suite',
        name: 'Executive Lounge Suite',
        description: 'Marble-floored suite with a private lounge, made for hosting and long stays.',
        imageUrl: executiveLoungeImage,
        nightlyRate: 520000,
        taxesAndFeesPerRoomNight: 35000,
        maxGuestsPerRoom: 3,
        maxRooms: 2,
        bedType: '1 King bed',
        sizeSqm: 110,
        view: 'City view',
        bathroom: 'Marble bathroom with steam shower',
        amenities: ['Executive lounge access', 'Private lounge', 'Free Wi-Fi', 'Butler on call', 'Minibar'],
        accessibility: 'Step-free access throughout',
        cancellationPolicy: SUITE_CANCELLATION,
      },
    ],
  },
]

// Guest checkout (BR-09) still needs contact details; this stands in for
// what the guest entered or what a signed-in profile provides.
export const guestProfile = {
  fullName: 'Allen Natty',
  phone: '+234 901 234 5678',
  email: 'allen.natty@example.com',
}

export const defaultBookingDraft = {
  hotelId: 'eko-hotels-suites',
  roomId: 'deluxe-room',
  checkIn: '2026-11-20',
  checkOut: '2026-11-22',
  rooms: 1,
  guests: 1,
}
