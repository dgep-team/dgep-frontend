import { UserRound } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { ErrorView, LoadingView } from '../../../components/feedback/StatusView.jsx'
import { useAsync } from '../../../hooks/useAsync.js'
import { listHotelBookings } from '../../../services/adminService.js'
import { errorMessage } from '../../../services/api/errors.js'
import { asList, describeHotelBooking, guestName, roomLabel, shortStayLabel, splitBookings } from '../adminData.js'
import { AdminScreen } from '../components/AdminShell.jsx'
import styles from '../components/AdminList.module.css'

const TABS = [
  { id: 'upcoming', label: 'Upcoming', empty: 'No upcoming stays yet.' },
  { id: 'completed', label: 'Completed', empty: 'No past or cancelled stays yet.' },
]

/** All Bookings: GET /admin/bookings, split into Upcoming and Completed. The tab lives in the URL. */
export function AdminBookingsPage() {
  const [params, setParams] = useSearchParams()
  const tab = TABS.find((item) => item.id === params.get('tab')) ?? TABS[0]
  const page = useAsync(async (signal) => splitBookings(asList(await listHotelBookings({ signal }))), 'bookings')

  return (
    <AdminScreen title="All Bookings">
      <div className={styles.tabs} role="tablist" aria-label="Bookings">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={item.id === tab.id}
            aria-controls="bookings-panel"
            className={styles.tab}
            onClick={() => setParams(item.id === 'upcoming' ? {} : { tab: item.id }, { replace: true })}
          >
            {item.label}
            {page.status === 'success' && <span className={styles.count}>{page.data[item.id].length}</span>}
          </button>
        ))}
      </div>

      <div id="bookings-panel" role="tabpanel" aria-labelledby={`tab-${tab.id}`}>
        {page.status === 'loading' && <LoadingView label="Loading bookings…" />}
        {page.status === 'error' && <ErrorView message={errorMessage(page.error)} actionLabel="Try again" onAction={page.reload} />}
        {page.status === 'success' &&
          (page.data[tab.id].length === 0 ? (
            <p className={styles.empty}>{tab.empty}</p>
          ) : (
            <ul className={styles.list}>
              {page.data[tab.id].map((booking) => (
                <li key={booking.id}>
                  <BookingRow booking={booking} />
                </li>
              ))}
            </ul>
          ))}
      </div>
    </AdminScreen>
  )
}

function BookingRow({ booking }) {
  const status = describeHotelBooking(booking)
  return (
    <Link to={`/admin/bookings/${booking.id}`} className={styles.row}>
      <span className={styles.avatar} aria-hidden="true">
        <UserRound size={22} />
      </span>
      <span className={styles.text}>
        <span className={styles.primary}>{roomLabel(booking)}</span>
        <span className={styles.secondary}>{guestName(booking)}</span>
        <span className={styles.secondary}>{shortStayLabel(booking)}</span>
      </span>
      <span className={`${styles.pill} ${styles[status.tone]}`}>{status.label}</span>
    </Link>
  )
}
