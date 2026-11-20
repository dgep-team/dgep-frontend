import { useState } from 'react'
import { useParams } from 'react-router'
import { Alert } from '../../components/feedback/Alert.jsx'
import { ErrorView, LoadingView } from '../../components/feedback/StatusView.jsx'
import { Screen } from '../../components/layout/AppShell.jsx'
import { ScreenHeader } from '../../components/layout/ScreenHeader.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { CallReception } from '../../components/contact/CallReception.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { usePolling } from '../../hooks/usePolling.js'
import { formatTimestamp } from '../../lib/dates.js'
import { ERROR_CODES, errorMessage } from '../../services/api/errors.js'
import { getBooking } from '../../services/bookingService.js'
import { cancelRequest, getRequest, listCategories, REQUEST_STATUS } from '../../services/requestService.js'
import { categoryName, isOpenRequest, REQUEST_STATUS_LABEL, STATUS_POLL_MS } from './requestStatus.js'
import styles from './Requests.module.css'

function describeEvent(event) {
  const who = event.byRole === 'guest' ? 'You' : 'Hotel staff'
  if (event.status) return `${who}: ${REQUEST_STATUS_LABEL[event.status] ?? event.status}`
  if ('assignedToId' in event) return event.assignedToId ? 'Assigned to a staff member' : 'Unassigned'
  return who
}

/** One request with its history: GET /requests/:id, PATCH /requests/:id/cancel (only while SUBMITTED). */
export function RequestPage() {
  const { requestId } = useParams()
  const page = useAsync(async (signal) => {
    const [request, categories] = await Promise.all([getRequest(requestId, { signal }), listCategories({ signal })])
    // Only for the hotel's phone number; the request shows without it.
    const booking = await getBooking(request.bookingId, { signal }).catch(() => null)
    return { request, categories, hotel: booking?.room?.hotel ?? null }
  }, requestId)
  const [cancel, setCancel] = useState({ status: 'idle' })
  // Staff update the status from their dashboard; keep it current while the request is open.
  usePolling(page.refresh, { intervalMs: STATUS_POLL_MS, enabled: isOpenRequest(page.data?.request) })

  const backTo = page.data?.request?.bookingId ? `/bookings/${page.data.request.bookingId}/requests` : '/bookings'
  const header = <ScreenHeader title="Request" backTo={backTo} />

  if (page.status === 'loading') return <Screen header={header}><LoadingView /></Screen>
  if (page.status === 'error') {
    return (
      <Screen header={header}>
        <ErrorView message={errorMessage(page.error)} actionLabel="View my bookings" actionTo="/bookings" />
      </Screen>
    )
  }

  const { request, categories, hotel } = page.data

  const doCancel = async () => {
    setCancel({ status: 'cancelling' })
    try {
      const updated = await cancelRequest(request.id)
      page.setData({ ...page.data, request: { ...request, ...updated } })
      setCancel({ status: 'idle' })
    } catch (error) {
      setCancel({ status: 'error', error })
      // Staff may have started it meanwhile: show the current state.
      if (error.code === ERROR_CODES.INVALID_STATUS_CHANGE) page.reload()
    }
  }

  return (
    <Screen header={header} width="narrow">
      <Card aria-labelledby="request-heading">
        <div className={styles.form}>
          <div className={styles.item}>
            <h1 id="request-heading" className={styles.sectionTitle}>
              {categoryName(categories, request.category)}
            </h1>
            <span className={styles.status} data-status={request.status} aria-live="polite">
              {REQUEST_STATUS_LABEL[request.status] ?? request.status}
            </span>
          </div>
          {isOpenRequest(request) && <p className={styles.meta}>Status updates automatically.</p>}
          {request.note && <p>{request.note}</p>}
          <p className={styles.meta}>
            Sent {formatTimestamp(request.createdAt)}
            {request.preferredTime && ` · preferred ${formatTimestamp(request.preferredTime)}`}
          </p>
        </div>
      </Card>

      {request.history?.length > 0 && (
        <Card aria-labelledby="timeline-heading">
          <h2 id="timeline-heading" className={styles.sectionTitle}>
            Updates
          </h2>
          <ol className={styles.timeline}>
            {request.history.map((event, index) => (
              <li key={`${event.at}-${index}`}>
                <span className={styles.itemTitle}>{describeEvent(event)}</span>
                <br />
                <span className={styles.meta}>{formatTimestamp(event.at)}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {cancel.status === 'error' && (
        <Alert tone="error" title="We couldn’t cancel this request">
          {cancel.error.code === ERROR_CODES.INVALID_STATUS_CHANGE
            ? 'The hotel has already started on it.'
            : errorMessage(cancel.error)}
        </Alert>
      )}
      <CallReception phone={hotel?.phone} hotelName={hotel?.name} />
      {request.status === REQUEST_STATUS.submitted && (
        <Button variant="secondary" fullWidth onClick={doCancel} loading={cancel.status === 'cancelling'} loadingLabel="Cancelling…">
          Cancel request
        </Button>
      )}
    </Screen>
  )
}
