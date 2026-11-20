import { Card } from '../../../components/ui/Card.jsx'
import { formatKobo } from '../../../lib/money.js'
import styles from './BookingCards.module.css'

const PER_LABEL = { STAY: 'per stay', NIGHT: 'per night', GUEST_NIGHT: 'per guest, per night' }

/** The hotel's optional extras (codes go to POST /bookings as `addOns`). */
export function AddOnsCard({ addOns, selected, onChange, disabled }) {
  if (!addOns?.length) return null

  const toggle = (code) =>
    onChange(selected.includes(code) ? selected.filter((item) => item !== code) : [...selected, code])

  return (
    <Card aria-labelledby="addons-heading">
      <fieldset className={styles.addOns} disabled={disabled}>
        <legend id="addons-heading" className={styles.value}>
          Add extras <span className={styles.muted}>(optional)</span>
        </legend>
        {addOns.map((addOn) => (
          <label key={addOn.code} className={styles.addOn}>
            <input type="checkbox" checked={selected.includes(addOn.code)} onChange={() => toggle(addOn.code)} />
            <span className={styles.grow}>{addOn.name}</span>
            <span className={styles.muted}>
              {formatKobo(addOn.price)} {PER_LABEL[addOn.per] ?? ''}
            </span>
          </label>
        ))}
      </fieldset>
    </Card>
  )
}
