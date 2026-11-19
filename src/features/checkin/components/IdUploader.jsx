import { CloudUpload, FileImage, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import styles from './CheckIn.module.css'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png']
const MAX_BYTES = 5 * 1024 * 1024

function validateIdFile(file) {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Upload a JPG or PNG image.'
  if (file.size > MAX_BYTES) return 'This file is larger than 5MB. Try a smaller photo.'
  return null
}

/**
 * Optional ID photo (PC-03). `value` is { file, previewUrl } or null.
 * The image never leaves the device in this build; only the fact that one
 * was provided is sent with pre-check-in.
 */
export function IdUploader({ value, onChange, disabled }) {
  const inputId = useId()
  const [error, setError] = useState(null)

  // Free the preview's object URL when it is replaced or the screen unmounts.
  useEffect(() => {
    const url = value?.previewUrl
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [value?.previewUrl])

  const handleFile = (event) => {
    const file = event.target.files?.[0]
    event.target.value = '' // let the same file be chosen again after removal
    if (!file) return

    const problem = validateIdFile(file)
    setError(problem)
    if (!problem) onChange({ file, previewUrl: URL.createObjectURL(file) })
  }

  return (
    <section className={styles.idSection} aria-labelledby={`${inputId}-heading`}>
      <div className={styles.idHeading}>
        <h2 id={`${inputId}-heading`} className={styles.sectionTitle}>
          Upload Your ID
        </h2>
        <span className={styles.optionalTag}>Optional</span>
      </div>
      <p className={styles.helpText}>
        Please upload a valid government ID (NIN, Driver’s License or Passport). Prefer not to? Just show it at the front
        desk.
      </p>

      {value ? (
        <div className={styles.idPreview}>
          <img src={value.previewUrl} alt="Preview of your uploaded ID" className={styles.idThumb} />
          <div className={styles.idMeta}>
            <p className={styles.idName}>
              <FileImage size={16} aria-hidden="true" /> {value.file.name}
            </p>
            <p className={styles.helpText}>{(value.file.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
          <button
            type="button"
            className={styles.removeButton}
            onClick={() => onChange(null)}
            disabled={disabled}
            aria-label="Remove uploaded ID"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <label htmlFor={inputId} className={`${styles.dropzone} ${error ? styles.dropzoneError : ''}`}>
          <CloudUpload size={36} className={styles.icon} aria-hidden="true" />
          <span className={styles.dropzoneTitle}>Tap to Upload ID</span>
          <span className={styles.helpText}>JPG, PNG (Max 5MB)</span>
          <input
            id={inputId}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            className="visually-hidden"
            onChange={handleFile}
            disabled={disabled}
            aria-describedby={error ? `${inputId}-error` : undefined}
          />
        </label>
      )}

      {error && (
        <p id={`${inputId}-error`} className={styles.errorText} role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
