import { Clock } from 'lucide-react'
import { SelectField } from '../../../components/ui/SelectField.jsx'
import { TextField } from '../../../components/ui/TextField.jsx'
import { ARRIVAL_WINDOWS } from '../arrivalWindows.js'
import styles from './CheckIn.module.css'

/** Arrival preferences collected during pre-check-in (PC-02). */
export function ArrivalDetailsFields({ value, onChange, checkInFrom, disabled }) {
  return (
    <fieldset className={styles.fieldset} disabled={disabled}>
      <legend className={styles.sectionTitle}>Arrival Details</legend>
      <SelectField
        label="Estimated arrival time"
        icon={Clock}
        options={ARRIVAL_WINDOWS}
        value={value.arrivalTime}
        onChange={(event) => onChange({ ...value, arrivalTime: event.target.value })}
        hint={`Check-in opens at ${checkInFrom}.`}
      />
      <TextField
        label="Special requests (optional)"
        multiline
        rows={3}
        maxLength={500}
        placeholder="e.g. high floor, extra pillows, airport pickup time"
        value={value.specialRequests}
        onChange={(event) => onChange({ ...value, specialRequests: event.target.value })}
        hint="Requests depend on availability at the hotel."
      />
    </fieldset>
  )
}
