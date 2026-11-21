// Hotel analytics, computed on the device from what the staff API already
// returns (GET /admin/bookings, /admin/requests, /admin/guests). There is no
// analytics endpoint yet, so every number here is derived, and metrics that
// need event tracking (searches, views, abandoned bookings) are left out.
//
// Money stays in kobo; format it only for display.

import { addDays, nightsBetween, parseIsoDate, stayDate, toIsoDate } from '../../lib/dates.js'
import { BOOKING_STATUS } from '../../services/bookingService.js'

const { pending, confirmed, checkedIn, checkedOut, cancelled } = BOOKING_STATUS

export const RANGES = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
]

const localDay = (iso) => (iso ? toIsoDate(new Date(iso)) : null)
const sum = (items, value) => items.reduce((total, item) => total + (Number(value(item)) || 0), 0)
const average = (items, value) => (items.length ? sum(items, value) / items.length : null)
const ratio = (part, whole) => (whole ? part / whole : null)
const isLive = (booking) => booking.status !== cancelled

/** The first day of a range that ends today. */
export const rangeStart = (days, today) => addDays(today, -(days - 1))

/** Bookings or requests made (createdAt, local day) on or after `from`. */
export const madeSince = (items, from) => items.filter((item) => (localDay(item.createdAt) ?? '') >= from)

const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short' })
const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const longDay = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

/**
 * One point per day from `from` to `today`: the sum of `value(item)` for
 * items whose `date(item)` falls on that day. `short` labels the x-axis.
 */
export function dailySeries(items, { from, today, date, value = () => 1 }) {
  const days = []
  for (let day = from; day <= today; day = addDays(day, 1)) days.push(day)
  const totals = Object.fromEntries(days.map((day) => [day, 0]))
  for (const item of items) {
    const day = localDay(date(item))
    if (day in totals) totals[day] += Number(value(item)) || 0
  }
  return days.map((day) => {
    const d = parseIsoDate(day)
    return { key: day, short: days.length <= 7 ? weekday.format(d) : monthDay.format(d), long: longDay.format(d), value: totals[day] }
  })
}

// Bookings
export function bookingStats(bookings) {
  const count = (status) => bookings.filter((b) => b.status === status).length
  const live = bookings.filter(isLive)
  return {
    total: bookings.length,
    confirmed: count(confirmed) + count(checkedIn),
    pending: count(pending),
    cancelled: count(cancelled),
    completed: count(checkedOut),
    averageValue: average(live, (b) => b.totalAmount),
    averageNights: average(live, (b) => nightsBetween(b.checkIn, b.checkOut)),
    byStatus: [
      { label: 'Confirmed', value: count(confirmed) },
      { label: 'In house', value: count(checkedIn) },
      { label: 'Awaiting payment', value: count(pending) },
      { label: 'Completed', value: count(checkedOut) },
      { label: 'Cancelled', value: count(cancelled) },
    ],
  }
}

// Revenue and payments
const successfulPayments = (booking) => (booking.payments ?? []).filter((p) => p.status === 'SUCCESS')

/** Price of one add-on line for a booking (STAY, NIGHT or GUEST_NIGHT), unless the API sends its total. */
function addOnAmount(addOn, booking) {
  const sent = addOn.total ?? addOn.amount
  if (sent !== undefined && sent !== null) return Number(sent) || 0
  const price = Number(addOn.price) || 0
  const nights = nightsBetween(booking.checkIn, booking.checkOut)
  if (addOn.per === 'NIGHT') return price * nights
  if (addOn.per === 'GUEST_NIGHT') return price * nights * (booking.guests || 1)
  return price
}

/**
 * Kept apart on purpose: gross booking value (what live bookings are worth),
 * collected (successful payments) and add-on revenue are different numbers.
 */
export function revenueStats(bookings) {
  const live = bookings.filter(isLive)
  const paid = bookings.filter((b) => successfulPayments(b).length > 0)
  const byRoomType = new Map()
  for (const booking of live) {
    const name = booking.room?.roomType?.name ?? 'Other'
    byRoomType.set(name, (byRoomType.get(name) ?? 0) + (Number(booking.totalAmount) || 0))
  }
  const withAddOns = live.filter((b) => b.addOns?.length > 0)
  return {
    hasPayments: bookings.some((b) => Array.isArray(b.payments)),
    gross: sum(live, (b) => b.totalAmount),
    collected: sum(paid, (b) => sum(successfulPayments(b), (p) => p.amount)),
    averageCollected: paid.length ? sum(paid, (b) => sum(successfulPayments(b), (p) => p.amount)) / paid.length : null,
    addOnRevenue: sum(withAddOns, (b) => sum(b.addOns, (a) => addOnAmount(a, b))),
    addOnShare: ratio(withAddOns.length, live.length),
    byRoomType: [...byRoomType].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
  }
}

/** Successful payments per day, by when they were paid. */
export const collectedSeries = (bookings, range) =>
  dailySeries(
    bookings.flatMap((b) => successfulPayments(b)),
    { ...range, date: (p) => p.paidAt, value: (p) => p.amount },
  )

export function paymentStats(bookings) {
  const attempts = bookings.flatMap((b) => b.payments ?? [])
  const count = (status) => attempts.filter((p) => p.status === status).length
  const success = count('SUCCESS')
  const failed = count('FAILED')
  const byChannel = new Map()
  for (const payment of attempts.filter((p) => p.status === 'SUCCESS')) {
    const channel = payment.channel ? payment.channel.replace(/_/g, ' ') : 'Unknown'
    byChannel.set(channel, (byChannel.get(channel) ?? 0) + 1)
  }
  return {
    attempts: attempts.length,
    success,
    failed,
    // Attempts still INITIATED haven't finished, so they don't count either way.
    successRate: ratio(success, success + failed),
    failureRate: ratio(failed, success + failed),
    byChannel: [...byChannel].map(([label, value]) => ({ label: label[0].toUpperCase() + label.slice(1), value })).sort((a, b) => b.value - a.value),
  }
}

// Guests
const guestKey = (booking) => booking.guestId ?? booking.guest?.id ?? booking.guest?.email ?? null

/**
 * New guests made their first booking here in the range; returning guests
 * booked in the range and had booked before it.
 */
export function guestStats({ guests, bookings, from }) {
  const firstBooking = new Map()
  for (const booking of bookings) {
    const key = guestKey(booking)
    const day = localDay(booking.createdAt)
    if (!key || !day) continue
    if (!firstBooking.has(key) || day < firstBooking.get(key)) firstBooking.set(key, day)
  }
  const inRange = madeSince(bookings, from)
  const active = new Set(inRange.map(guestKey).filter(Boolean))
  let newGuests = 0
  for (const key of active) if (firstBooking.get(key) >= from) newGuests += 1

  return {
    total: guests?.length ?? firstBooking.size,
    newGuests,
    returning: active.size - newGuests,
    averageParty: average(inRange, (b) => b.guests),
    cancellationRate: ratio(inRange.filter((b) => b.status === cancelled).length, inRange.length),
    bookingsPerGuest: ratio(inRange.length, active.size),
  }
}

// Service requests
function resolvedAt(request) {
  const done = [...(request.history ?? [])].reverse().find((entry) => entry.status === 'COMPLETED')
  return done?.at ?? request.completedAt ?? null
}

export function requestStats(requests) {
  const count = (status) => requests.filter((r) => r.status === status).length
  const completed = count('COMPLETED')
  const cancelledCount = count('CANCELLED')
  const durations = requests
    .filter((r) => r.status === 'COMPLETED' && resolvedAt(r) && r.createdAt)
    .map((r) => new Date(resolvedAt(r)) - new Date(r.createdAt))
    .filter((ms) => ms >= 0)
  const byCategory = new Map()
  for (const request of requests) byCategory.set(request.category, (byCategory.get(request.category) ?? 0) + 1)

  return {
    total: requests.length,
    submitted: count('SUBMITTED'),
    inProgress: count('IN_PROGRESS'),
    completed,
    outstanding: count('SUBMITTED') + count('IN_PROGRESS'),
    // Requests the guest cancelled were never the hotel's to finish.
    completionRate: ratio(completed, requests.length - cancelledCount),
    averageResolutionMs: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : null,
    byCategory: [...byCategory].map(([code, value]) => ({ code, value })).sort((a, b) => b.value - a.value),
  }
}

// Pre-arrival: the next 7 days, whatever range is picked.
export function preArrivalStats(bookings, today) {
  const end = addDays(today, 6)
  const arriving = bookings.filter(
    (b) => [confirmed, checkedIn].includes(b.status) && stayDate(b.checkIn) >= today && stayDate(b.checkIn) <= end,
  )
  const ready = arriving.filter((b) => b.onlineCheckInAt || b.status === checkedIn)
  return {
    arrivals: arriving.length,
    preCheckedIn: ready.length,
    pending: arriving.length - ready.length,
    completionRate: ratio(ready.length, arriving.length),
    departures: bookings.filter(
      (b) => [confirmed, checkedIn].includes(b.status) && stayDate(b.checkOut) >= today && stayDate(b.checkOut) <= end,
    ).length,
  }
}

export const today = () => toIsoDate(new Date())

const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 })
export const formatPercent = (value) => (value === null || value === undefined ? '—' : percent.format(value))
export const formatNumber = (value, digits = 1) =>
  value === null || value === undefined ? '—' : Number(value.toFixed(digits)).toLocaleString('en-US')

const compactNaira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', notation: 'compact', maximumFractionDigits: 1 })
/** 120000000 kobo -> "₦1.2M" (axis labels). */
export const formatKoboCompact = (kobo) => compactNaira.format((Number(kobo) || 0) / 100)
