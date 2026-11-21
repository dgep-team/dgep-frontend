import { BedDouble, CalendarCheck, ClipboardList, ConciergeBell } from 'lucide-react'
import { ErrorView, LoadingView } from '../../../components/feedback/StatusView.jsx'
import { useAsync } from '../../../hooks/useAsync.js'
import { getOverview, listHotelBookings } from '../../../services/adminService.js'
import { errorMessage } from '../../../services/api/errors.js'
import { useStaffSession } from '../../../state/useStaffSession.js'
import { asList, bookingsPerDay } from '../adminData.js'
import { AdminScreen } from '../components/AdminShell.jsx'
import { WeeklyBookingsChart } from './WeeklyBookingsChart.jsx'
import styles from './Dashboard.module.css'

async function loadDashboard(signal) {
  const [overview, bookings] = await Promise.all([getOverview({ signal }), listHotelBookings({ signal })])
  return { overview: overview ?? {}, bookings: asList(bookings) }
}

/**
 * Hotel Dashboard: GET /admin/overview (today at the hotel) and
 * GET /admin/bookings (total, and the last 7 days for the chart: the API has
 * no per-day series, so it is counted here).
 */
export function DashboardPage() {
  const { staff } = useStaffSession()
  const page = useAsync((signal) => loadDashboard(signal), 'dashboard')

  return (
    <AdminScreen title="Hotel Dashboard">
      {staff?.firstName && <p className={styles.greeting}>Hello, {staff.firstName}. Here’s today at your hotel.</p>}

      {page.status === 'loading' && <LoadingView label="Loading today’s numbers…" />}
      {page.status === 'error' && (
        <ErrorView message={errorMessage(page.error)} actionLabel="Try again" onAction={page.reload} />
      )}
      {page.status === 'success' && <DashboardContent {...page.data} />}
    </AdminScreen>
  )
}

function DashboardContent({ overview, bookings }) {
  const occupancy = typeof overview.occupancyRate === 'number' ? `${Math.round(overview.occupancyRate * 100)}%` : '—'

  return (
    <>
      <ul className={styles.stats} aria-label="Today at a glance">
        <Stat icon={ClipboardList} label="Total Bookings" value={bookings.length} />
        <Stat icon={CalendarCheck} label="Check-ins Today" value={overview.arrivalsToday ?? '—'} />
        <Stat icon={BedDouble} label="Occupancy" value={occupancy} />
        <Stat icon={ConciergeBell} label="Open requests" value={overview.openRequests ?? '—'} />
      </ul>

      <WeeklyBookingsChart days={bookingsPerDay(bookings)} />
    </>
  )
}

function Stat({ icon: Icon, label, value }) {
  return (
    <li className={styles.stat}>
      <span className={styles.statIcon} aria-hidden="true">
        <Icon size={18} />
      </span>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
    </li>
  )
}
