import { useId } from 'react'
import styles from './TextField.module.css'

/**
 * Labelled input with an optional leading icon, hint and error.
 * Pass `hideLabel` to keep the label for screen readers only.
 * Pass `multiline` for a textarea.
 */
export function TextField({ label, hideLabel = false, icon: Icon, error, hint, multiline = false, className = '', ...inputProps }) {
  const id = useId()
  const messageId = `${id}-message`
  const Control = multiline ? 'textarea' : 'input'

  return (
    <div className={`${styles.field} ${className}`}>
      <label htmlFor={id} className={hideLabel ? 'visually-hidden' : styles.label}>
        {label}
      </label>
      <div className={`${styles.control} ${error ? styles.invalid : ''} ${multiline ? styles.multiline : ''}`}>
        {Icon && <Icon className={styles.icon} size={20} aria-hidden="true" />}
        <Control
          id={id}
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          {...inputProps}
        />
      </div>
      {(error || hint) && (
        <p id={messageId} className={error ? styles.error : styles.hint}>
          {error || hint}
        </p>
      )}
    </div>
  )
}
