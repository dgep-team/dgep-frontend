import { useEffect, useState } from 'react'
import { TextField } from '../../../components/ui/TextField.jsx'
import { formatDate } from '../../../lib/dates.js'

/**
 * A date input that only commits complete, in-range dates.
 *
 * Native date inputs fire `change` on every keystroke with partial values
 * (typing "24" passes through the 2nd). A controlled input would clamp those
 * and fight the user, so this one is uncontrolled: it commits valid values,
 * ignores the rest while typing, and reverts with a message on blur.
 */
export function DateField({ label, value, min, max, onCommit, inputRef, hint }) {
  const [error, setError] = useState(null)

  // Reflect outside changes (e.g. check-out moving with check-in), but never
  // overwrite what the guest is typing.
  useEffect(() => {
    const input = inputRef.current
    if (input && document.activeElement !== input) input.value = value
  }, [value, inputRef])

  const isValid = (candidate) => Boolean(candidate) && candidate >= min && (!max || candidate <= max)

  const handleChange = (event) => {
    const candidate = event.target.value
    if (!isValid(candidate)) return
    setError(null)
    if (candidate !== value) onCommit(candidate)
  }

  const handleBlur = (event) => {
    if (isValid(event.target.value)) return
    event.target.value = value
    setError(
      max
        ? `Choose a date from ${formatDate(min)} to ${formatDate(max)}.`
        : `Choose a date from ${formatDate(min)}.`,
    )
  }

  return (
    <TextField
      ref={inputRef}
      label={label}
      type="date"
      min={min}
      max={max}
      defaultValue={value}
      onChange={handleChange}
      onBlur={handleBlur}
      error={error}
      hint={hint}
    />
  )
}
