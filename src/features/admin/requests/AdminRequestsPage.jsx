import { BedDouble } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { ErrorView, LoadingView } from '../../../components/feedback/StatusView.jsx'
import { useAsync } from '../../../hooks/useAsync.js'
import { usePolling } from '../../../hooks/usePolling.js'
import { listHotelRequests, listStaff } from '../../../services/adminService.js'
import { errorMessage } from '../../../services/api/errors.js'
import { useStaffSession } from '../../../state/useStaffSession.js'
import {
  asList,
  assigneeName,
  CATEGORY_ICONS,
  categoryLabel,
  describeRequest,
  isOpenRequest,
  requestGuestName,
  requestRoomLabel,
  timeAgo,
} from '../adminData.js'
import { AdminScreen } from '../components/AdminShell.jsx'
import styles from '../components/AdminList.module.css'

const POLL_MS = 20_000

const TABS = [
  { id: 'open', label: 'Open', empty: 'No open requests. All caught up.', match: (r) => isOpenRequest(r) },
  { id: 'mine', label: 'Mine', empty: 'Nothing assigned to you.', match: (r, me) => r.assignedToId === me && isOpenRequest(r) },
  { id: 'done', label: 'Done', empty: 'No finished requests yet.', match: (r) => !isOpenRequest(r) },
]

/** The staff list names assignees; a role that can't read it still sees the requests. */
async function loadRequests(signal) {
  const [requests, staff] = await Promise.all([
    listHotelRequests({ signal }),
    listStaff({ signal }).catch(() => []),
  ])
  return { requests: asList(requests), staff: asList(staff) }
}

/** Service requests: GET /admin/requests (oldest first), refreshed every 20 seconds. */
export function AdminRequestsPage() {
  const { staff: me } = useStaffSession()
  const [params, setParams] = useSearchParams()
  const tab = TABS.find((item) => item.id === params.get('tab')) ?? TABS[0]
  const page = useAsync((signal) => loadRequests(signal), 'requests')
  usePolling(page.refresh, { intervalMs: POLL_MS, enabled: page.status === 'success' })

  const visible = page.status === 'success' ? page.data.requests.filter((r) => tab.match(r, me?.id)) : []
  // Open work oldest first (as the API sends it); finished work newest first.
  if (tab.id === 'done') visible.reverse()

  return (
    <AdminScreen title="Requests">
      <div className={`${styles.tabs} ${styles.tabs3}`} role="tablist" aria-label="Requests">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={item.id === tab.id}
            aria-controls="requests-panel"
            className={styles.tab}
            onClick={() => setParams(item.id === 'open' ? {} : { tab: item.id }, { replace: true })}
          >
            {item.label}
            {page.status === 'success' && item.id !== 'done' && (
              <span className={styles.count}>{page.data.requests.filter((r) => item.match(r, me?.id)).length}</span>
            )}
          </button>
        ))}
      </div>

      <div id="requests-panel" role="tabpanel" aria-labelledby={`tab-${tab.id}`}>
        {page.status === 'loading' && <LoadingView label="Loading requests…" />}
        {page.status === 'error' && <ErrorView message={errorMessage(page.error)} actionLabel="Try again" onAction={page.reload} />}
        {page.status === 'success' &&
          (visible.length === 0 ? (
            <p className={styles.empty}>{tab.empty}</p>
          ) : (
            <ul className={styles.list}>
              {visible.map((request) => (
                <li key={request.id}>
                  <RequestRow request={request} staffList={page.data.staff} />
                </li>
              ))}
            </ul>
          ))}
      </div>
    </AdminScreen>
  )
}

function RequestRow({ request, staffList }) {
  const status = describeRequest(request)
  const Icon = CATEGORY_ICONS[request.category] ?? BedDouble
  const assignee = assigneeName(request, staffList)

  return (
    <Link to={`/admin/requests/${request.id}`} className={styles.row}>
      <span className={`${styles.avatar} ${styles.avatarAccent}`} aria-hidden="true">
        <Icon size={20} />
      </span>
      <span className={styles.text}>
        <span className={styles.primary}>{categoryLabel(request.category)}</span>
        <span className={styles.secondary}>
          {requestRoomLabel(request)} · {requestGuestName(request)}
        </span>
        <span className={styles.secondary}>
          {timeAgo(request.createdAt)}
          {isOpenRequest(request) && ` · ${assignee ?? 'Unassigned'}`}
        </span>
      </span>
      <span className={`${styles.pill} ${styles[status.tone]}`}>{status.label}</span>
    </Link>
  )
}
