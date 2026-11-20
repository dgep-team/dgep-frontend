import { formatClock } from '../../lib/dates.js'

// The API wants arrivalTime as 24-hour HH:MM in the hotel's time zone.
// Offer half-hour slots across the day; guests can arrive before check-in opens.
const FIRST_HOUR = 6

export const ARRIVAL_TIMES = [
  { value: '', label: 'Select a time' },
  ...Array.from({ length: (24 - FIRST_HOUR) * 2 }, (_, i) => {
    const hour = FIRST_HOUR + Math.floor(i / 2)
    const value = `${String(hour).padStart(2, '0')}:${i % 2 ? '30' : '00'}`
    return { value, label: formatClock(value) }
  }),
]
