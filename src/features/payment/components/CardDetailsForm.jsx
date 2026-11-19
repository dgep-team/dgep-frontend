import { CalendarDays, CreditCard, Lock } from 'lucide-react'
import { TextField } from '../../../components/ui/TextField.jsx'
import { digitsOnly, formatCardNumber, formatExpiry } from '../../../lib/cardValidation.js'
import styles from './Payment.module.css'

/**
 * Card inputs. Values stay in memory for this screen only and are never
 * persisted; in production the provider's hosted fields replace these inputs.
 */
export function CardDetailsForm({ value, errors, onChange, disabled }) {
  const set = (field) => (event) => {
    const raw = event.target.value
    const formatted = {
      number: formatCardNumber(raw),
      expiry: formatExpiry(raw),
      cvv: digitsOnly(raw).slice(0, 4),
    }[field]
    onChange({ ...value, [field]: formatted })
  }

  return (
    <fieldset className={styles.cardForm} disabled={disabled}>
      <legend className={styles.sectionTitle}>Card Details</legend>
      <TextField
        label="Card number"
        hideLabel
        icon={CreditCard}
        name="cc-number"
        autoComplete="cc-number"
        inputMode="numeric"
        placeholder="1234 5678 9012 3456"
        value={value.number}
        onChange={set('number')}
        error={errors.number}
      />
      <div className={styles.cardRow}>
        <TextField
          label="Expiry date (MM/YY)"
          hideLabel
          icon={CalendarDays}
          name="cc-exp"
          autoComplete="cc-exp"
          inputMode="numeric"
          placeholder="MM/YY"
          value={value.expiry}
          onChange={set('expiry')}
          error={errors.expiry}
        />
        <TextField
          label="CVV"
          hideLabel
          icon={Lock}
          name="cc-csc"
          autoComplete="cc-csc"
          inputMode="numeric"
          placeholder="CVV"
          value={value.cvv}
          onChange={set('cvv')}
          error={errors.cvv}
        />
      </div>
      <label className={styles.checkbox}>
        <input
          type="checkbox"
          checked={value.saveCard}
          onChange={(event) => onChange({ ...value, saveCard: event.target.checked })}
        />
        <span>Save card for next time</span>
      </label>
    </fieldset>
  )
}
