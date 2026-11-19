// Pure search logic for the room catalog. No React, no I/O: easy to test,
// and the same rules can move server-side later.

/** Price bands by nightly rate. `keywords` let "cheap" or "vip" find a band. */
export const PRICE_TIERS = [
  { id: 'budget', label: 'Budget', maxRate: 100000, keywords: ['budget', 'affordable', 'cheap', 'economy', 'value'] },
  { id: 'midrange', label: 'Mid-range', maxRate: 250000, keywords: ['mid-range', 'midrange', 'comfort', 'moderate'] },
  { id: 'luxury', label: 'Luxury', maxRate: Infinity, keywords: ['luxury', 'premium', 'exclusive', 'vip', 'upscale'] },
]

export const SORT_OPTIONS = [
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Guest rating' },
]

export function tierFor(nightlyRate) {
  return PRICE_TIERS.find((tier) => nightlyRate <= tier.maxRate)
}

const normalize = (text) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

/** Flattens hotels into one searchable entry per room. */
export function buildCatalog(hotels) {
  return hotels.flatMap((hotel) =>
    hotel.rooms.map((room) => {
      const tier = tierFor(room.nightlyRate)
      const haystack = normalize(
        [
          room.name,
          room.description,
          room.bedType,
          room.view,
          room.bathroom,
          ...room.amenities,
          hotel.location,
          tier.label,
          ...tier.keywords,
        ].join(' '),
      )
      // Hotel names match whole words only, so "suite" finds suites rather
      // than every room at "Eko Hotels & Suites" (while "eko" still works).
      const hotelWords = normalize(hotel.name).split(/[^a-z0-9]+/).filter(Boolean)
      return { hotel, room, tier, haystack, hotelWords }
    }),
  )
}

const SORTERS = {
  'price-asc': (a, b) => a.room.nightlyRate - b.room.nightlyRate,
  'price-desc': (a, b) => b.room.nightlyRate - a.room.nightlyRate,
  rating: (a, b) => b.hotel.rating - a.hotel.rating || a.room.nightlyRate - b.room.nightlyRate,
}

/**
 * Every word in `query` must appear somewhere in the room's text (AND match),
 * so "lagos suite" narrows to suites in Lagos. `tier` is a PRICE_TIERS id or 'all'.
 */
export function searchCatalog(catalog, { query = '', tier = 'all', sort = 'price-asc' } = {}) {
  const words = normalize(query).split(/\s+/).filter(Boolean)
  const sorter = SORTERS[sort] ?? SORTERS['price-asc']

  return catalog
    .filter((entry) => tier === 'all' || entry.tier.id === tier)
    .filter((entry) => words.every((word) => entry.haystack.includes(word) || entry.hotelWords.includes(word)))
    .sort(sorter)
}

/** "Victoria Island, Lagos" -> "Lagos" */
export function cityOf(hotel) {
  return hotel.location.split(',').pop().trim()
}

/** Per-city room count and lowest nightly rate, in catalog order. */
export function summarizeCities(catalog) {
  const byCity = new Map()
  for (const { hotel, room } of catalog) {
    const city = cityOf(hotel)
    const entry = byCity.get(city) ?? { city, roomCount: 0, fromRate: Infinity }
    entry.roomCount += 1
    entry.fromRate = Math.min(entry.fromRate, room.nightlyRate)
    byCity.set(city, entry)
  }
  return [...byCity.values()]
}

/** The cheapest room in each price band, budget to luxury. */
export function featuredByTier(catalog) {
  return PRICE_TIERS.map((tier) =>
    catalog
      .filter((entry) => entry.tier.id === tier.id)
      .sort((a, b) => a.room.nightlyRate - b.room.nightlyRate)[0],
  ).filter(Boolean)
}
