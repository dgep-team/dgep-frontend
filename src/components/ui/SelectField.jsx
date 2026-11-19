import { ChevronDown } from 'lucide-react'
import { useId } from 'react'
import styles from './TextField.module.css'

/** Native <select> styled to match TextField. `options` is [{ value, label }]. */
export function SelectField({ label, icon: Icon, options, hint, className = '', ...selectProps }) {
  const id = useId()
  const hintId = `${id}-hint`

  return (
    <div className={`${styles.field} ${className}`}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.control}>
        {Icon && <Icon className={styles.icon} size={20} aria-hidden="true" />}
        <select id={id} className={`${styles.input} ${styles.select}`} aria-describedby={hint ? hintId : undefined} {...selectProps}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className={styles.icon} size={18} aria-hidden="true" />
      </div>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  )
}
