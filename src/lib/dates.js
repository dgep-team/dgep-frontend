// Stay dates are calendar dates ("YYYY-MM-DD"), not instants. Parse them as
// local dates so a guest's check-in never shifts a day because of time zones.

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function parseIsoDate(iso) {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const longDate = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

/** "2026-11-20" -> "Nov 20, 2026" */
export function formatDate(iso) {
  return longDate.format(parseIsoDate(iso))
}

/** "2026-11-20", "2026-11-22" -> "Nov 20 – 22, 2026" (collapses shared month/year). */
export function formatDateRange(startIso, endIso) {
  const start = parseIsoDate(startIso)
  const end = parseIsoDate(endIso)
  const month = (d) => d.toLocaleString('en-US', { month: 'short' })

  if (start.getFullYear() !== end.getFullYear()) {
    return `${formatDate(startIso)} – ${formatDate(endIso)}`
  }
  if (start.getMonth() !== end.getMonth()) {
    return `${month(start)} ${start.getDate()} – ${month(end)} ${end.getDate()}, ${end.getFullYear()}`
  }
  return `${month(start)} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`
}

export function nightsBetween(startIso, endIso) {
  const diff = parseIsoDate(endIso) - parseIsoDate(startIso)
  return Math.max(0, Math.round(diff / MS_PER_DAY))
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

/** Local calendar date -> "YYYY-MM-DD". */
export function toIsoDate(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function addDays(iso, days) {
  const date = parseIsoDate(iso)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

export const MAX_STAY_NIGHTS = 30

/**
 * Applies a date change and returns a valid stay: check-in no earlier than
 * `today`, check-out 1 to MAX_STAY_NIGHTS nights after check-in.
 * Moving check-in keeps the length of the stay (check-out moves with it).
 * Empty input (a cleared picker) leaves that date unchanged.
 */
export function adjustStay({ checkIn, checkOut }, changes, today) {
  let nextIn = changes.checkIn || checkIn
  let nextOut = changes.checkOut || checkOut

  if (nextIn < today) nextIn = today
  if (changes.checkIn) {
    const nights = Math.min(Math.max(nightsBetween(checkIn, checkOut), 1), MAX_STAY_NIGHTS)
    nextOut = addDays(nextIn, nights)
  }
  if (nextOut <= nextIn) nextOut = addDays(nextIn, 1)

  // Too long: keep the date the guest just picked and move the other one.
  if (nightsBetween(nextIn, nextOut) > MAX_STAY_NIGHTS) {
    if (changes.checkOut) nextIn = addDays(nextOut, -MAX_STAY_NIGHTS)
    else nextOut = addDays(nextIn, MAX_STAY_NIGHTS)
  }
  return { checkIn: nextIn, checkOut: nextOut }
}
