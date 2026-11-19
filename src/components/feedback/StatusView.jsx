import { Button } from '../ui/Button.jsx'
import styles from './StatusView.module.css'

export function LoadingView({ label = 'Loading…' }) {
  return (
    <div className={styles.view} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <p className={styles.text}>{label}</p>
    </div>
  )
}

export function ErrorView({ title = 'Something went wrong', message, actionLabel, actionTo, onAction }) {
  return (
    <div className={styles.view} role="alert">
      <p className={styles.title}>{title}</p>
      {message && <p className={styles.text}>{message}</p>}
      {actionLabel && (
        <Button variant="secondary" to={actionTo} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
