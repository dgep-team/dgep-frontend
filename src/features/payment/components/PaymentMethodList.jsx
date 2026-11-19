import { PAYMENT_METHODS } from '../paymentMethods.js'
import styles from './Payment.module.css'

export function PaymentMethodList({ value, onChange, disabled, ref }) {
  return (
    <fieldset className={styles.methods} disabled={disabled}>
      <legend className={styles.sectionTitle} ref={ref} tabIndex={-1}>
        Select Payment Method
      </legend>
      {PAYMENT_METHODS.map(({ id, label, description, icon: Icon, badge }) => (
        <label key={id} className={styles.method}>
          <input
            type="radio"
            name="payment-method"
            value={id}
            checked={value === id}
            onChange={() => onChange(id)}
            className={styles.radio}
          />
          <Icon size={24} className={styles.methodIcon} aria-hidden="true" />
          <span className={styles.methodText}>
            <span className={styles.methodLabel}>{label}</span>
            <span className={styles.methodDescription}>{description}</span>
          </span>
          {badge && <MethodBadge badge={badge} />}
        </label>
      ))}
    </fieldset>
  )
}

function MethodBadge({ badge }) {
  if (badge === 'cards') {
    return (
      <span className={styles.cardBadges} aria-hidden="true">
        <span className={styles.visa}>VISA</span>
        <span className={styles.mastercard}>
          <span />
          <span />
        </span>
      </span>
    )
  }
  return (
    <span className={styles.textBadge} aria-hidden="true">
      {badge}
    </span>
  )
}
