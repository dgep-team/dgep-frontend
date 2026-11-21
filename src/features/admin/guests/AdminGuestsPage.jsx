import { Search, UserRound } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { ErrorView, LoadingView } from '../../../components/feedback/StatusView.jsx'
import { TextField } from '../../../components/ui/TextField.jsx'
import { useAsync } from '../../../hooks/useAsync.js'
import { listHotelGuests } from '../../../services/adminService.js'
import { errorMessage } from '../../../services/api/errors.js'
import { asList } from '../adminData.js'
import { AdminScreen } from '../components/AdminShell.jsx'
import styles from '../components/AdminList.module.css'

/** The API sends each guest's booking count; accept the likely field names. */
const bookingCount = (guest) => guest.bookingCount ?? guest.bookingsCount ?? guest._count?.bookings ?? null

/** Guests who have booked at this hotel: GET /admin/guests?search=. */
export function AdminGuestsPage() {
  const [search, setSearch] = useState('')
  const query = useDeferredValue(search.trim())
  const page = useAsync(async (signal) => asList(await listHotelGuests({ search: query || undefined, signal })), query)

  return (
    <AdminScreen title="Guests">
      <TextField
        label="Search guests"
        hideLabel
        type="search"
        icon={Search}
        placeholder="Search by name or email"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {page.status === 'loading' && <LoadingView label="Loading guests…" />}
      {page.status === 'error' && <ErrorView message={errorMessage(page.error)} actionLabel="Try again" onAction={page.reload} />}
      {page.status === 'success' &&
        (page.data.length === 0 ? (
          <p className={styles.empty}>{query ? 'No guests match that search.' : 'No guests have booked yet.'}</p>
        ) : (
          <ul className={styles.list}>
            {page.data.map((guest) => (
              <li key={guest.id} className={styles.row}>
                <span className={styles.avatar} aria-hidden="true">
                  <UserRound size={22} />
                </span>
                <span className={styles.text}>
                  <span className={styles.primary}>{[guest.firstName, guest.lastName].filter(Boolean).join(' ') || 'Guest'}</span>
                  <span className={styles.secondary}>{[guest.email, guest.phone].filter(Boolean).join(' · ')}</span>
                </span>
                {bookingCount(guest) !== null && (
                  <span className={`${styles.pill} ${bookingCount(guest) > 1 ? styles.info : styles.muted}`}>
                    {bookingCount(guest) === 1 ? '1 booking' : `${bookingCount(guest)} bookings`}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ))}
    </AdminScreen>
  )
}
