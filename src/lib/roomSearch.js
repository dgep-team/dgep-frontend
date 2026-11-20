// Pure search logic over the stays returned by hotelService.searchStays():
// [{ hotel, roomType }]. No React, no I/O. Amounts are kobo.

/** Price bands by nightly rate (kobo). `keywords` let "cheap" or "vip" find a band. */
export const PRICE_TIERS = [
  { id: 'budget', label: 'Budget', maxRate: 4_000_000, keywords: ['budget', 'affordable', 'cheap', 'economy', 'value'] },
  { id: 'midrange', label: 'Mid-range', maxRate: 7_000_000, keywords: ['mid-range', 'midrange', 'comfort', 'moderate'] },
  { id: 'luxury', label: 'Luxury', maxRate: Infinity, keywords: ['luxury', 'premium', 'exclusive', 'vip', 'upscale', 'suite'] },
]

export const SORT_OPTIONS = [
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'size', label: 'Room size' },
]

export function tierFor(pricePerNight) {
  return PRICE_TIERS.find((tier) => pricePerNight <= tier.maxRate)
}

const normalize = (text) =>
  String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

/** The all-in total for the searched dates, falling back to the nightly rate. */
export const totalFor = (roomType) => roomType.price?.total ?? roomType.pricePerNight

/** Adds search fields to each stay. */
export function buildCatalog(stays) {
  return stays.map(({ hotel, roomType }) => {
    const tier = tierFor(roomType.pricePerNight)
    const haystack = normalize(
      [
        roomType.name,
        roomType.description,
        roomType.bedType,
        roomType.view,
        ...(roomType.amenities ?? []),
        ...(roomType.accessibility ?? []),
        hotel.city,
        hotel.address,
        ...(hotel.amenities ?? []),
        tier.label,
        ...tier.keywords,
      ].join(' '),
    )
    // Hotel names match whole words only, so "suite" finds suites rather
    // than every room at "Eko Suites" (while "eko" still works).
    const hotelWords = normalize(hotel.name).split(/[^a-z0-9]+/).filter(Boolean)
    return { hotel, roomType, tier, haystack, hotelWords }
  })
}

const SORTERS = {
  'price-asc': (a, b) => totalFor(a.roomType) - totalFor(b.roomType),
  'price-desc': (a, b) => totalFor(b.roomType) - totalFor(a.roomType),
  size: (a, b) => (b.roomType.sizeSqm ?? 0) - (a.roomType.sizeSqm ?? 0) || totalFor(a.roomType) - totalFor(b.roomType),
}

/**
 * Every word in `query` must appear somewhere in the room's text (AND match),
 * so "lagos deluxe" narrows to deluxe rooms in Lagos. `tier` is a PRICE_TIERS id or 'all'.
 */
export function searchCatalog(catalog, { query = '', tier = 'all', sort = 'price-asc' } = {}) {
  const words = normalize(query).split(/\s+/).filter(Boolean)
  const sorter = SORTERS[sort] ?? SORTERS['price-asc']

  return catalog
    .filter((entry) => tier === 'all' || entry.tier.id === tier)
    .filter((entry) => words.every((word) => entry.haystack.includes(word) || entry.hotelWords.includes(word)))
    .sort(sorter)
}

/** Per-city hotel count and lowest nightly rate, from GET /hotels summaries. */
export function summarizeCities(hotels) {
  const byCity = new Map()
  for (const hotel of hotels) {
    const entry = byCity.get(hotel.city) ?? { city: hotel.city, hotelCount: 0, fromRate: null }
    entry.hotelCount += 1
    if (hotel.fromPricePerNight !== null && hotel.fromPricePerNight !== undefined) {
      entry.fromRate = entry.fromRate === null ? hotel.fromPricePerNight : Math.min(entry.fromRate, hotel.fromPricePerNight)
    }
    byCity.set(hotel.city, entry)
  }
  return [...byCity.values()]
}

/** The cheapest room in each price band, budget to luxury. */
export function featuredByTier(catalog) {
  return PRICE_TIERS.map(
    (tier) =>
      catalog
        .filter((entry) => entry.tier.id === tier.id)
        .sort((a, b) => a.roomType.pricePerNight - b.roomType.pricePerNight)[0],
  ).filter(Boolean)
}
