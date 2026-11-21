import { FileText, IdCard, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { Alert } from '../../components/feedback/Alert.jsx'
import { ErrorView, LoadingView } from '../../components/feedback/StatusView.jsx'
import { Screen } from '../../components/layout/AppShell.jsx'
import { ScreenHeader } from '../../components/layout/ScreenHeader.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { SelectField } from '../../components/ui/SelectField.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { ERROR_CODES, errorMessage } from '../../services/api/errors.js'
import { getBooking, submitCheckIn } from '../../services/bookingService.js'
import { ACCEPTED_ID_FILES, checkIdFile, ID_TYPES, saveIdDocument } from '../../services/mock/idDocumentService.js'
import { StaySummaryCard } from './components/StaySummaryCard.jsx'
import styles from './components/CheckIn.module.css'

/**
 * Digital check-in, step 2 of 2: the guest adds a photo of their ID, then
 * Submit sends POST /bookings/:id/check-in with the details from step 1.
 * The ID itself is MOCKED (services/mock/idDocumentService.js): the API has no
 * upload endpoint yet, so the file never leaves the device.
 */
export function IdUploadPage() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const checkIn = location.state?.checkIn
  const booking = useAsync((signal) => getBooking(bookingId, { signal }), checkIn ? bookingId : null)

  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [idType, setIdType] = useState('')
  const [errors, setErrors] = useState({})
  const [submit, setSubmit] = useState({ status: 'idle' })

  // The preview's object URL is freed when it is replaced, removed, or the page is left.
  const previewRef = useRef(null)
  const setPreview = (url) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = url
    setPreviewUrl(url)
  }
  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    },
    [],
  )

  const backToDetails = () => navigate(`/bookings/${bookingId}/check-in`, { replace: true, state: { checkIn } })
  const header = <ScreenHeader title="ID Upload" backTo={`/bookings/${bookingId}/check-in`} />

  // Step 1 wasn't done in this visit (a refresh or a shared link): start there.
  if (!checkIn) return <Navigate to={`/bookings/${bookingId}/check-in`} replace />
  if (booking.status === 'loading' || booking.status === 'idle') {
    return (
      <Screen header={header} width="narrow">
        <LoadingView label="Loading your booking…" />
      </Screen>
    )
  }
  if (booking.status === 'error') {
    return (
      <Screen header={header} width="narrow">
        <ErrorView message={errorMessage(booking.error)} actionLabel="Try again" onAction={booking.reload} />
      </Screen>
    )
  }

  const isSubmitting = submit.status === 'submitting'

  const pickFile = (event) => {
    const picked = event.target.files?.[0] ?? null
    event.target.value = '' // lets the guest pick the same file again after removing it
    if (!picked) return
    const problem = checkIdFile(picked)
    setErrors((current) => ({ ...current, file: problem ?? undefined }))
    setFile(problem ? null : picked)
    setPreview(!problem && canPreview(picked) ? URL.createObjectURL(picked) : null)
  }

  const removeFile = () => {
    setFile(null)
    setPreview(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const problems = {}
    const fileProblem = checkIdFile(file)
    if (fileProblem) problems.file = fileProblem
    if (!idType) problems.idType = 'Choose the type of ID.'
    setErrors(problems)
    if (Object.keys(problems).length > 0) return

    setSubmit({ status: 'submitting' })
    try {
      await saveIdDocument(bookingId, { file, idType })
      await submitCheckIn(bookingId, { ...checkIn.arrival, guest: checkIn.guest })
      navigate(`/bookings/${bookingId}/check-in`, { replace: true })
    } catch (error) {
      setSubmit({ status: 'error', error })
    }
  }

  const submitError = submit.status === 'error' ? submit.error : null

  return (
    <Screen header={header} width="narrow">
      <form className={styles.idPage} onSubmit={handleSubmit} noValidate>
        <StaySummaryCard booking={booking.data} />

        {file ? (
          <IdPreview file={file} previewUrl={previewUrl} onRemove={removeFile} disabled={isSubmitting} />
        ) : (
          <div className={styles.idSection}>
            <label className={`${styles.dropzone} ${styles.dropzoneLarge} ${errors.file ? styles.dropzoneError : ''}`}>
              <span className={styles.dropzoneIcon} aria-hidden="true">
                <Upload size={26} />
              </span>
              <span className={styles.dropzoneTitle}>Tap to upload your ID</span>
              <span className={styles.helpText}>Photo or PDF, up to 5 MB</span>
              <input
                type="file"
                accept={ACCEPTED_ID_FILES}
                className="visually-hidden"
                onChange={pickFile}
                aria-invalid={errors.file ? true : undefined}
                aria-describedby={errors.file ? 'id-file-error' : undefined}
                disabled={isSubmitting}
              />
            </label>
            {errors.file && (
              <p id="id-file-error" className={styles.errorText}>
                {errors.file}
              </p>
            )}
          </div>
        )}

        <SelectField
          label="ID type"
          icon={IdCard}
          options={ID_TYPES}
          value={idType}
          onChange={(event) => {
            setIdType(event.target.value)
            setErrors((current) => ({ ...current, idType: undefined }))
          }}
          error={errors.idType}
          disabled={isSubmitting}
        />

        {submitError && (
          <Alert
            tone="error"
            title="We couldn’t complete your check-in"
            actions={
              submitError.code === ERROR_CODES.VALIDATION_ERROR ? (
                <Button variant="secondary" onClick={backToDetails}>
                  Check my details
                </Button>
              ) : undefined
            }
          >
            {submitError.code === ERROR_CODES.BOOKING_NOT_PAID
              ? 'Your booking isn’t paid yet.'
              : submitError.code === ERROR_CODES.BOOKING_CLOSED
                ? 'This booking is cancelled or the stay has ended.'
                : `${errorMessage(submitError)} Your details are still here; please try again.`}
          </Alert>
        )}

        <Button type="submit" fullWidth loading={isSubmitting} loadingLabel="Submitting…">
          Submit
        </Button>
        <p className={styles.mockNote}>Preview: your ID stays on this device for now. Bring the original to the front desk.</p>
      </form>
    </Screen>
  )
}

const canPreview = (file) => file.type.startsWith('image/') && file.type !== 'image/heic'

const fileSize = (bytes) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`)

function IdPreview({ file, previewUrl, onRemove, disabled }) {
  return (
    <div className={styles.idPreview}>
      {previewUrl ? (
        <img src={previewUrl} alt="Your ID" className={styles.idThumb} />
      ) : (
        <span className={`${styles.idThumb} ${styles.dropzoneIcon}`} aria-hidden="true">
          <FileText size={24} />
        </span>
      )}
      <div className={styles.idMeta}>
        <p className={styles.idName}>{file.name}</p>
        <p className={styles.helpText}>{fileSize(file.size)} · ready to submit</p>
      </div>
      <button type="button" className={styles.removeButton} onClick={onRemove} disabled={disabled} aria-label="Remove this file">
        <X size={20} aria-hidden="true" />
      </button>
    </div>
  )
}
