import { ChevronDown } from 'lucide-react'
import { useId } from 'react'
import styles from './TextField.module.css'

/** Native <select> styled to match TextField. `options` is [{ value, label }]. */
export function SelectField({ label, icon: Icon, options, hint, error, className = '', ...selectProps }) {
  const id = useId()
  const messageId = `${id}-message`

  return (
    <div className={`${styles.field} ${className}`}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={`${styles.control} ${error ? styles.invalid : ''}`}>
        {Icon && <Icon className={styles.icon} size={20} aria-hidden="true" />}
        <select
          id={id}
          className={`${styles.input} ${styles.select}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          {...selectProps}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className={styles.icon} size={18} aria-hidden="true" />
      </div>
      {(error || hint) && (
        <p id={messageId} className={error ? styles.error : styles.hint}>
          {error || hint}
        </p>
      )}
    </div>
  )
}
