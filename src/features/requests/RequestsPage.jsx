import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { Alert } from '../../components/feedback/Alert.jsx'
import { ErrorView, LoadingView } from '../../components/feedback/StatusView.jsx'
import { Screen, SplitLayout } from '../../components/layout/AppShell.jsx'
import { ScreenHeader } from '../../components/layout/ScreenHeader.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { TextField } from '../../components/ui/TextField.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { formatTimestamp, toIsoDate } from '../../lib/dates.js'
import { ERROR_CODES, errorMessage, fieldErrors } from '../../services/api/errors.js'
import { getBooking } from '../../services/bookingService.js'
import { createRequest, listCategories, listRequests } from '../../services/requestService.js'
import { canMakeRequests } from '../bookings/bookingStatus.js'
import { categoryName, localDateTimeToIso, REQUEST_STATUS_LABEL } from './requestStatus.js'
import styles from './Requests.module.css'

const EMPTY_FORM = { category: '', note: '', preferredTime: '' }

async function loadRequests(bookingId, signal) {
  const [booking, categories, requests] = await Promise.all([
    getBooking(bookingId, { signal }),
    listCategories({ signal }),
    listRequests(bookingId, { signal }),
  ])
  return { booking, categories, requests }
}

/** Service requests for one stay: GET /concierge/categories, GET + POST /bookings/:id/requests. */
export function RequestsPage() {
  const { bookingId } = useParams()
  const page = useAsync((signal) => loadRequests(bookingId, signal), bookingId)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [submit, setSubmit] = useState({ status: 'idle' })

  const header = <ScreenHeader title="Requests" backTo={`/bookings/${bookingId}`} />

  if (page.status === 'loading') return <Screen header={header}><LoadingView /></Screen>
  if (page.status === 'error') {
    return (
      <Screen header={header}>
        <ErrorView message={errorMessage(page.error)} actionLabel="Back to booking" actionTo={`/bookings/${bookingId}`} />
      </Screen>
    )
  }

  const { booking, categories, requests } = page.data
  const isSubmitting = submit.status === 'submitting'
  const allowed = canMakeRequests(booking)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const problems = {}
    if (!form.category) problems.category = 'Choose what you need.'
    if (form.category === 'OTHER' && !form.note.trim()) problems.note = 'Tell the hotel what you need.'
    setErrors(problems)
    if (Object.keys(problems).length > 0) return

    setSubmit({ status: 'submitting' })
    try {
      const created = await createRequest(bookingId, {
        category: form.category,
        note: form.note,
        preferredTime: localDateTimeToIso(form.preferredTime),
      })
      page.setData({ ...page.data, requests: [created, ...requests] })
      setForm(EMPTY_FORM)
      setSubmit({ status: 'sent', category: created.category })
    } catch (error) {
      setErrors(fieldErrors(error))
      setSubmit({ status: 'error', error })
    }
  }

  return (
    <Screen header={header}>
      <SplitLayout
        asideLabel="Your requests"
        aside={
          <Card aria-labelledby="history-heading">
            <h2 id="history-heading" className={styles.sectionTitle}>
              Your requests
            </h2>
            {requests.length === 0 ? (
              <p className={styles.empty}>Nothing requested yet.</p>
            ) : (
              <ul className={styles.list}>
                {requests.map((request) => (
                  <li key={request.id}>
                    <Link to={`/requests/${request.id}`} className={styles.item}>
                      <span className={styles.itemText}>
                        <span className={styles.itemTitle}>{categoryName(categories, request.category)}</span>
                        <span className={styles.meta}>{request.note || formatTimestamp(request.createdAt)}</span>
                      </span>
                      <span className={styles.status} data-status={request.status}>
                        {REQUEST_STATUS_LABEL[request.status] ?? request.status}
                      </span>
                      <ChevronRight size={18} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        }
      >
        {!allowed ? (
          <Alert tone="info" title="Requests open once your booking is paid">
            You can ask for towels, housekeeping, repairs and more during your stay.
          </Alert>
        ) : (
          <Card aria-labelledby="new-request-heading">
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <h1 id="new-request-heading" className={styles.sectionTitle}>
                What do you need?
              </h1>

              {submit.status === 'sent' && (
                <Alert tone="success" title="Request sent">
                  The hotel has your {categoryName(categories, submit.category).toLowerCase()} request.
                </Alert>
              )}
              {submit.status === 'error' && (
                <Alert tone="error" title="We couldn’t send your request">
                  {submit.error.code === ERROR_CODES.BOOKING_NOT_PAID ? 'Your booking isn’t paid yet.' : errorMessage(submit.error)}
                </Alert>
              )}

              <fieldset className={styles.fieldset} disabled={isSubmitting} aria-describedby={errors.category ? 'category-error' : undefined}>
                <legend>Category</legend>
                <div className={styles.chips}>
                  {categories.map((category) => (
                    <label key={category.code} className={styles.chip}>
                      <input
                        type="radio"
                        name="category"
                        value={category.code}
                        className="visually-hidden"
                        checked={form.category === category.code}
                        onChange={() => setForm({ ...form, category: category.code })}
                      />
                      {category.name}
                    </label>
                  ))}
                </div>
                {errors.category && (
                  <p id="category-error" className={styles.errorText} role="alert">
                    {errors.category}
                  </p>
                )}
              </fieldset>

              <TextField
                label={form.category === 'OTHER' ? 'Details' : 'Details (optional)'}
                multiline
                rows={3}
                maxLength={500}
                placeholder="e.g. two extra bath towels"
                value={form.note}
                onChange={(event) => setForm({ ...form, note: event.target.value })}
                error={errors.note}
                disabled={isSubmitting}
              />
              <TextField
                label="Preferred time (optional)"
                type="datetime-local"
                min={`${toIsoDate(new Date())}T00:00`}
                value={form.preferredTime}
                onChange={(event) => setForm({ ...form, preferredTime: event.target.value })}
                error={errors.preferredTime}
                disabled={isSubmitting}
              />
              <Button type="submit" fullWidth loading={isSubmitting} loadingLabel="Sending…">
                Send request
              </Button>
            </form>
          </Card>
        )}
      </SplitLayout>
    </Screen>
  )
}
