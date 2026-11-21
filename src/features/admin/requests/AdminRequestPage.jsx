import { UserRound } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router'
import { Alert } from '../../../components/feedback/Alert.jsx'
import { ErrorView, LoadingView } from '../../../components/feedback/StatusView.jsx'
import { Button } from '../../../components/ui/Button.jsx'
import { Card } from '../../../components/ui/Card.jsx'
import { SelectField } from '../../../components/ui/SelectField.jsx'
import { useAsync } from '../../../hooks/useAsync.js'
import { usePolling } from '../../../hooks/usePolling.js'
import { formatTimestamp } from '../../../lib/dates.js'
import { assignRequest, getHotelRequest, listStaff, updateRequestStatus } from '../../../services/adminService.js'
import { ERROR_CODES, errorMessage } from '../../../services/api/errors.js'
import { useStaffSession } from '../../../state/useStaffSession.js'
import {
  asList,
  assigneeName,
  can,
  categoryLabel,
  describeRequest,
  isOpenRequest,
  personName,
  requestGuestName,
  requestRoomLabel,
  roleLabel,
  timeAgo,
} from '../adminData.js'
import { AdminScreen } from '../components/AdminShell.jsx'
import styles from '../components/AdminList.module.css'

const POLL_MS = 15_000

async function loadRequest(requestId, signal) {
  const [request, staff] = await Promise.all([
    getHotelRequest(requestId, { signal }),
    listStaff({ signal }).catch(() => []),
  ])
  return { request, staff: asList(staff) }
}

/**
 * One request: GET /admin/requests/:id. Start / finish it
 * (PATCH .../status) and, for managers and reception, assign it
 * (PATCH .../assign). Refreshes while it is still open.
 */
export function AdminRequestPage() {
  const { requestId } = useParams()
  const { staff: me } = useStaffSession()
  const page = useAsync((signal) => loadRequest(requestId, signal), requestId)
  const [action, setAction] = useState({ status: 'idle' })
  usePolling(page.refresh, { intervalMs: POLL_MS, enabled: page.status === 'success' && isOpenRequest(page.data.request) })

  const title = page.status === 'success' ? categoryLabel(page.data.request.category) : 'Request'

  const run = async (name, call) => {
    setAction({ status: 'working', name })
    try {
      const updated = await call()
      if (updated) page.setData({ ...page.data, request: { ...page.data.request, ...updated } })
      setAction({ status: 'idle' })
      page.refresh()
    } catch (error) {
      setAction({ status: 'error', error })
      if (error.code === ERROR_CODES.INVALID_STATUS_CHANGE) page.refresh()
    }
  }

  return (
    <AdminScreen title={title} backTo="/admin/requests">
      {page.status === 'loading' && <LoadingView label="Loading request…" />}
      {page.status === 'error' && (
        <ErrorView message={errorMessage(page.error)} actionLabel="Back to requests" actionTo="/admin/requests" />
      )}
      {page.status === 'success' && (
        <RequestDetails
          request={page.data.request}
          staffList={page.data.staff}
          me={me}
          action={action}
          onStatus={(status) => run(status, () => updateRequestStatus(requestId, status))}
          onAssign={(staffId) => run('assign', () => assignRequest(requestId, staffId))}
        />
      )}
    </AdminScreen>
  )
}

function RequestDetails({ request, staffList, me, action, onStatus, onAssign }) {
  const status = describeRequest(request)
  const open = isOpenRequest(request)
  const working = action.status === 'working'
  const canAssign = can(me, 'frontDesk')
  const assignee = assigneeName(request, staffList)

  return (
    <>
      <Card aria-labelledby="request-heading">
        <h2 id="request-heading" className={styles.cardTitle}>
          {requestRoomLabel(request)}
        </h2>
        <dl className={styles.details}>
          <div>
            <dt>Status</dt>
            <dd>
              <span className={`${styles.pill} ${styles[status.tone]}`}>{status.label}</span>
            </dd>
          </div>
          <div>
            <dt>Guest</dt>
            <dd>{requestGuestName(request)}</dd>
          </div>
          <div>
            <dt>Requested</dt>
            <dd>
              {formatTimestamp(request.createdAt)} ({timeAgo(request.createdAt)})
            </dd>
          </div>
          {request.preferredTime && (
            <div>
              <dt>Preferred time</dt>
              <dd>{formatTimestamp(request.preferredTime)}</dd>
            </div>
          )}
          <div>
            <dt>Assigned to</dt>
            <dd>{assignee ?? 'No one yet'}</dd>
          </div>
        </dl>
        {request.note && <p className={styles.note}>{request.note}</p>}
      </Card>

      {action.status === 'error' && (
        <Alert tone="error" title="That didn’t work">
          {action.error.code === ERROR_CODES.INVALID_STATUS_CHANGE
            ? 'The request changed in the meantime (the guest may have cancelled it). It has been refreshed.'
            : action.error.status === 403
              ? 'Your role can’t do that. Ask a manager or reception.'
              : errorMessage(action.error)}
        </Alert>
      )}

      {open && (
        <div className={styles.actions}>
          {request.status === 'SUBMITTED' && (
            <Button fullWidth onClick={() => onStatus('IN_PROGRESS')} loading={working && action.name === 'IN_PROGRESS'} loadingLabel="Starting…" disabled={working}>
              Start working on it
            </Button>
          )}
          {request.status === 'IN_PROGRESS' && (
            <Button fullWidth onClick={() => onStatus('COMPLETED')} loading={working && action.name === 'COMPLETED'} loadingLabel="Saving…" disabled={working}>
              Mark as done
            </Button>
          )}
        </div>
      )}

      {open && canAssign && <AssignCard request={request} staffList={staffList} me={me} disabled={working} onAssign={onAssign} />}

      {request.history?.length > 0 && (
        <Card aria-labelledby="history-heading">
          <h2 id="history-heading" className={styles.cardTitle}>
            History
          </h2>
          <ol className={styles.timeline}>
            {request.history.map((entry, index) => (
              <li key={`${entry.at}-${index}`}>
                <span className={styles.primary}>{historyText(entry, staffList)}</span>
                <span className={styles.secondary}>
                  {formatTimestamp(entry.at)} · {historyActor(entry, staffList)}
                </span>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </>
  )
}

function AssignCard({ request, staffList, me, disabled, onAssign }) {
  const [choice, setChoice] = useState(request.assignedToId ?? '')
  const options = [
    { value: '', label: 'No one (unassigned)' },
    ...staffList.map((member) => ({ value: member.id, label: `${personName(member)} · ${roleLabel(member.role)}` })),
  ]
  const unchanged = (choice || null) === (request.assignedToId ?? null)

  return (
    <Card aria-labelledby="assign-heading">
      <div className={styles.sectionHead}>
        <h2 id="assign-heading" className={styles.cardTitle}>
          Assign
        </h2>
        {me?.id && request.assignedToId !== me.id && (
          <Button variant="ghost" onClick={() => onAssign(me.id)} disabled={disabled} iconRight={<UserRound size={16} aria-hidden="true" />}>
            Assign to me
          </Button>
        )}
      </div>
      {staffList.length > 0 && (
        <div className={styles.inlineForm}>
          <SelectField label="Staff member" options={options} value={choice} onChange={(event) => setChoice(event.target.value)} disabled={disabled} />
          <Button variant="secondary" onClick={() => onAssign(choice || null)} disabled={disabled || unchanged}>
            Save
          </Button>
        </div>
      )}
    </Card>
  )
}

const STATUS_TEXT = { SUBMITTED: 'Request sent', IN_PROGRESS: 'Started', COMPLETED: 'Marked as done', CANCELLED: 'Cancelled' }

function historyText(entry, staffList) {
  if (entry.status) return STATUS_TEXT[entry.status] ?? entry.status
  if ('assignedToId' in entry) {
    if (!entry.assignedToId) return 'Unassigned'
    return `Assigned to ${personName(staffList.find((member) => member.id === entry.assignedToId)) ?? 'a staff member'}`
  }
  return 'Updated'
}

function historyActor(entry, staffList) {
  const person = staffList.find((member) => member.id === entry.byId)
  if (person) return personName(person)
  if (entry.byRole === 'GUEST' || entry.byRole === 'guest') return 'Guest'
  return entry.byRole ? roleLabel(entry.byRole) : 'System'
}
