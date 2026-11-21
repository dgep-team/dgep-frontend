import { useSearchParams } from 'react-router'
import { ErrorView, LoadingView } from '../../../components/feedback/StatusView.jsx'
import { useAsync } from '../../../hooks/useAsync.js'
import { formatKobo } from '../../../lib/money.js'
import { getOverview, listHotelBookings, listHotelGuests, listHotelRequests } from '../../../services/adminService.js'
import { errorMessage } from '../../../services/api/errors.js'
import { useStaffSession } from '../../../state/useStaffSession.js'
import { asList, can, categoryLabel, formatDuration } from '../adminData.js'
import {
  bookingStats,
  collectedSeries,
  dailySeries,
  formatKoboCompact,
  formatNumber,
  formatPercent,
  guestStats,
  madeSince,
  paymentStats,
  preArrivalStats,
  RANGES,
  rangeStart,
  requestStats,
  revenueStats,
  today as getToday,
} from '../analytics.js'
import { AdminScreen } from '../components/AdminShell.jsx'
import { BarList } from '../components/BarList.jsx'
import { TrendChart } from '../components/TrendChart.jsx'
import styles from './Dashboard.module.css'

/** Front desk roles get bookings and guests; everyone gets today and requests. */
async function loadDashboard(staff, signal) {
  const frontDesk = can(staff, 'frontDesk')
  const [overview, bookings, guests, requests] = await Promise.all([
    getOverview({ signal }),
    frontDesk ? listHotelBookings({ signal }) : null,
    frontDesk ? listHotelGuests({ signal }) : null,
    listHotelRequests({ signal }),
  ])
  return { overview: overview ?? {}, bookings: asList(bookings), guests: guests ? asList(guests) : null, requests: asList(requests) }
}

/**
 * Hotel Dashboard: today at the hotel (GET /admin/overview) and analytics
 * worked out from bookings, guests and requests (see analytics.js).
 * Revenue and payments are for managers only.
 */
export function DashboardPage() {
  const { staff } = useStaffSession()
  const [params, setParams] = useSearchParams()
  const days = RANGES.find((range) => String(range.days) === params.get('range'))?.days ?? 7
  const page = useAsync((signal) => loadDashboard(staff, signal), `dashboard:${staff?.role}`)

  return (
    <AdminScreen title="Hotel Dashboard">
      {staff?.firstName && <p className={styles.greeting}>Hello, {staff.firstName}. Here’s how your hotel is doing.</p>}

      {page.status === 'loading' && <LoadingView label="Loading your hotel’s numbers…" />}
      {page.status === 'error' && <ErrorView message={errorMessage(page.error)} actionLabel="Try again" onAction={page.reload} />}
      {page.status === 'success' && (
        <Analytics
          data={page.data}
          staff={staff}
          days={days}
          onDaysChange={(value) => setParams(value === 7 ? {} : { range: String(value) }, { replace: true })}
        />
      )}
    </AdminScreen>
  )
}

function Analytics({ data, staff, days, onDaysChange }) {
  const { overview, bookings, guests, requests } = data
  const today = getToday()
  const from = rangeStart(days, today)
  const range = { from, today }
  const rangeText = `last ${days} days`
  const frontDesk = can(staff, 'frontDesk')
  const finance = can(staff, 'finance')

  const recentBookings = madeSince(bookings, from)
  const recentRequests = madeSince(requests, from)
  const booking = bookingStats(recentBookings)
  const revenue = revenueStats(recentBookings)
  const payments = paymentStats(recentBookings)
  const guest = guestStats({ guests, bookings, from })
  const request = requestStats(recentRequests)
  const preArrival = preArrivalStats(bookings, today)

  return (
    <>
      {/* Today ignores the range: it is always today at the hotel. */}
      <Section title="Today" description="Live from the front desk.">
        <Tiles>
          <Tile label="Arrivals" value={overview.arrivalsToday ?? '—'} />
          <Tile label="Departures" value={overview.departuresToday ?? '—'} />
          <Tile label="Occupancy" value={formatPercent(overview.occupancyRate)} />
          <Tile label="Open requests" value={overview.openRequests ?? '—'} />
          {finance && (
            <Tile
              label="Revenue today"
              value={overview.revenueToday === null || overview.revenueToday === undefined ? '—' : formatKobo(overview.revenueToday)}
              caption={overview.revenueToday === null || overview.revenueToday === undefined ? 'Shows once payments are live' : undefined}
            />
          )}
        </Tiles>
      </Section>

      <div className={styles.rangeBar}>
        <span className={styles.rangeLabel} id="range-label">
          Showing
        </span>
        <div className={styles.segmented} role="group" aria-labelledby="range-label">
          {RANGES.map((option) => (
            <button
              key={option.days}
              type="button"
              className={styles.segment}
              aria-pressed={option.days === days}
              onClick={() => onDaysChange(option.days)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {frontDesk && (
        <Section title="Bookings" description={`Bookings made in the ${rangeText}.`}>
          <Tiles>
            <Tile label="Total bookings" value={booking.total} />
            <Tile label="Confirmed" value={booking.confirmed} caption="Paid, including in house" />
            <Tile label="Awaiting payment" value={booking.pending} />
            <Tile label="Cancelled" value={booking.cancelled} />
            <Tile label="Completed stays" value={booking.completed} />
            <Tile label="Avg. booking value" value={formatKobo(wholeNaira(booking.averageValue))} />
            <Tile label="Avg. length of stay" value={booking.averageNights === null ? '—' : `${formatNumber(booking.averageNights)} nights`} />
          </Tiles>
          <Charts>
            <TrendChart
              title="Bookings per day"
              meta={`${booking.total} in the ${rangeText}`}
              points={dailySeries(recentBookings, { ...range, date: (b) => b.createdAt })}
              unit="bookings"
            />
            <BarList title="By status" items={booking.byStatus} />
          </Charts>
        </Section>
      )}

      {finance && (
        <Section
          title="Revenue"
          description="Booking value, money collected and add-ons are different numbers, so they are kept apart."
        >
          <Tiles>
            <Tile label="Gross booking value" value={formatKobo(revenue.gross)} caption="All bookings not cancelled" />
            <Tile
              label="Collected"
              value={revenue.hasPayments ? formatKobo(revenue.collected) : '—'}
              caption={revenue.hasPayments ? 'Successful payments' : 'Not in the bookings list yet'}
            />
            <Tile
              label="Avg. collected per booking"
              value={revenue.hasPayments ? formatKobo(wholeNaira(revenue.averageCollected)) : '—'}
            />
            <Tile label="Add-on revenue" value={formatKobo(revenue.addOnRevenue)} caption={`${formatPercent(revenue.addOnShare)} of bookings add extras`} />
            <Tile label="Refunds" value="—" caption="Not tracked by the API yet" />
          </Tiles>
          <Charts>
            {revenue.hasPayments && (
              <TrendChart
                title="Collected per day"
                meta={`${formatKobo(revenue.collected)} in the ${rangeText}`}
                points={collectedSeries(recentBookings, range)}
                format={formatKobo}
                formatAxis={formatKoboCompact}
              />
            )}
            <BarList title="Booking value by room type" items={revenue.byRoomType} format={formatKobo} empty="No bookings in this period." />
          </Charts>
        </Section>
      )}

      {finance && (
        <Section title="Payments" description={`Payment attempts on bookings made in the ${rangeText}.`}>
          {revenue.hasPayments ? (
            <>
              <Tiles>
                <Tile label="Payment attempts" value={payments.attempts} />
                <Tile label="Successful" value={payments.success} />
                <Tile label="Failed" value={payments.failed} />
                <Tile label="Success rate" value={formatPercent(payments.successRate)} caption={`${formatPercent(payments.failureRate)} failed`} />
              </Tiles>
              <Charts>
                <BarList title="Payment methods" items={payments.byChannel} empty="No successful payments in this period." />
              </Charts>
            </>
          ) : (
            <p className={styles.note}>The staff bookings list doesn’t include payment attempts yet, so these can’t be counted.</p>
          )}
        </Section>
      )}

      {frontDesk && (
        <Section title="Guests" description={`Guests who booked in the ${rangeText}.`}>
          <Tiles>
            <Tile label="All guests" value={guest.total} caption="Everyone who has booked here" />
            <Tile label="New guests" value={guest.newGuests} caption="First booking here" />
            <Tile label="Returning guests" value={guest.returning} caption="Booked here before" />
            <Tile label="Bookings per guest" value={formatNumber(guest.bookingsPerGuest)} />
            <Tile label="Avg. guests per booking" value={formatNumber(guest.averageParty)} />
            <Tile label="Cancellation rate" value={formatPercent(guest.cancellationRate)} />
          </Tiles>
        </Section>
      )}

      <Section title="Service requests" description={`Requests made in the ${rangeText}.`}>
        <Tiles>
          <Tile label="Total requests" value={request.total} />
          <Tile label="New" value={request.submitted} caption="Waiting for someone" />
          <Tile label="In progress" value={request.inProgress} />
          <Tile label="Completed" value={request.completed} />
          <Tile label="Completion rate" value={formatPercent(request.completionRate)} caption="Of requests not cancelled" />
          <Tile label="Avg. time to resolve" value={formatDuration(request.averageResolutionMs)} />
        </Tiles>
        <Charts>
          <TrendChart
            title="Requests per day"
            meta={`${request.total} in the ${rangeText}`}
            points={dailySeries(recentRequests, { ...range, date: (r) => r.createdAt })}
            unit="requests"
          />
          <BarList
            title="By category"
            items={request.byCategory.map((item) => ({ label: categoryLabel(item.code), value: item.value }))}
            empty="No requests in this period."
          />
        </Charts>
      </Section>

      {frontDesk && (
        <Section title="Pre-arrival" description="Guests arriving in the next 7 days.">
          <Tiles>
            <Tile label="Upcoming arrivals" value={preArrival.arrivals} />
            <Tile label="Checked in online" value={preArrival.preCheckedIn} />
            <Tile label="Not yet checked in" value={preArrival.pending} />
            <Tile label="Online check-in rate" value={formatPercent(preArrival.completionRate)} />
            <Tile label="Upcoming departures" value={preArrival.departures} />
          </Tiles>
        </Section>
      )}

      {finance && (
        <details className={styles.notTracked}>
          <summary>Metrics that need event tracking first</summary>
          <p>
            Booking conversion and abandonment, most viewed hotels and rooms, most searched destinations, and refunds need the
            app to record events (such as <code>hotel_viewed</code> and <code>booking_started</code>) before they can be shown.
          </p>
        </details>
      )}
    </>
  )
}

/** Averages are shown to the nearest naira (amounts are in kobo). */
const wholeNaira = (kobo) => (kobo === null || kobo === undefined ? null : Math.round(kobo / 100) * 100)

function Section({ title, description, children }) {
  const id = `section-${title.toLowerCase().replace(/\W+/g, '-')}`
  return (
    <section className={styles.section} aria-labelledby={id}>
      <div className={styles.sectionHead}>
        <h2 id={id} className={styles.sectionTitle}>
          {title}
        </h2>
        {description && <p className={styles.sectionDescription}>{description}</p>}
      </div>
      {children}
    </section>
  )
}

const Tiles = ({ children }) => <ul className={styles.stats}>{children}</ul>
const Charts = ({ children }) => <div className={styles.charts}>{children}</div>

function Tile({ label, value, caption }) {
  return (
    <li className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
      {caption && <span className={styles.statCaption}>{caption}</span>}
    </li>
  )
}
