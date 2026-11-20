import { Clock } from 'lucide-react'
import { SelectField } from '../../../components/ui/SelectField.jsx'
import { TextField } from '../../../components/ui/TextField.jsx'
import { formatClock } from '../../../lib/dates.js'
import { ARRIVAL_TIMES } from '../arrivalTimes.js'
import styles from './CheckIn.module.css'

/** Arrival time (required, HH:MM) and special requests (optional, max 500) for online check-in. */
export function ArrivalDetailsFields({ value, onChange, checkInTime, errors = {}, disabled }) {
  return (
    <fieldset className={styles.fieldset} disabled={disabled}>
      <legend className={styles.sectionTitle}>Arrival Details</legend>
      <SelectField
        label="Estimated arrival time"
        icon={Clock}
        options={ARRIVAL_TIMES}
        value={value.arrivalTime}
        onChange={(event) => onChange({ ...value, arrivalTime: event.target.value })}
        error={errors.arrivalTime}
        hint={checkInTime ? `Check-in opens at ${formatClock(checkInTime)}.` : undefined}
        required
      />
      <TextField
        label="Special requests (optional)"
        multiline
        rows={3}
        maxLength={500}
        placeholder="e.g. high floor, extra pillows"
        value={value.specialRequests}
        onChange={(event) => onChange({ ...value, specialRequests: event.target.value })}
        error={errors.specialRequests}
        hint={`Requests depend on availability at the hotel. ${500 - value.specialRequests.length} characters left.`}
      />
    </fieldset>
  )
}
