import { Lock, Mail, UserPlus, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Alert } from '../../../components/feedback/Alert.jsx'
import { ErrorView, LoadingView } from '../../../components/feedback/StatusView.jsx'
import { Button } from '../../../components/ui/Button.jsx'
import { Card } from '../../../components/ui/Card.jsx'
import { SelectField } from '../../../components/ui/SelectField.jsx'
import { TextField } from '../../../components/ui/TextField.jsx'
import { useAsync } from '../../../hooks/useAsync.js'
import { createStaff, listStaff } from '../../../services/adminService.js'
import { ERROR_CODES, errorMessage, fieldErrors } from '../../../services/api/errors.js'
import { useStaffSession } from '../../../state/useStaffSession.js'
import { asList, can, personName, roleLabel, STAFF_ROLES } from '../adminData.js'
import { AdminScreen } from '../components/AdminShell.jsx'
import styles from '../components/AdminList.module.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ROLE_ORDER = STAFF_ROLES.map((role) => role.value)

/** This hotel's staff: GET /admin/staff. Managers add staff with POST /admin/staff. */
export function AdminStaffPage() {
  const { staff: me } = useStaffSession()
  const page = useAsync((signal) => listStaff({ signal }).then(asList), 'staff')
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(null)

  const team =
    page.status === 'success'
      ? [...page.data].sort(
          (a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || (personName(a) ?? '').localeCompare(personName(b) ?? ''),
        )
      : []

  return (
    <AdminScreen title="Staff" backTo="/admin/more">
      {added && (
        <Alert tone="success" title={`${personName(added)} can now log in`}>
          Share the email and starting password with them privately.
        </Alert>
      )}

      {can(me, 'manageHotel') &&
        (adding ? (
          <AddStaffCard
            onDone={(member) => {
              setAdding(false)
              if (member) {
                setAdded(member)
                page.reload()
              }
            }}
          />
        ) : (
          <Button
            variant="secondary"
            onClick={() => {
              setAdding(true)
              setAdded(null)
            }}
            iconRight={<UserPlus size={18} aria-hidden="true" />}
          >
            Add staff member
          </Button>
        ))}

      {page.status === 'loading' && <LoadingView label="Loading staff…" />}
      {page.status === 'error' && <ErrorView message={errorMessage(page.error)} actionLabel="Try again" onAction={page.reload} />}
      {page.status === 'success' && (
        <ul className={styles.list}>
          {team.map((member) => (
            <li key={member.id} className={styles.row}>
              <span className={styles.avatar} aria-hidden="true">
                <UserRound size={22} />
              </span>
              <span className={styles.text}>
                <span className={styles.primary}>
                  {personName(member)}
                  {member.id === me?.id && ' (you)'}
                </span>
                <span className={styles.secondary}>{member.email}</span>
              </span>
              <span className={`${styles.pill} ${member.role === 'MANAGER' ? styles.info : styles.muted}`}>{roleLabel(member.role)}</span>
            </li>
          ))}
        </ul>
      )}
    </AdminScreen>
  )
}

/** POST /admin/staff { email, password, firstName, lastName, role }. The password is their first one. */
function AddStaffCard({ onDone }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', role: 'RECEPTION', password: '' })
  const [errors, setErrors] = useState({})
  const [submit, setSubmit] = useState({ status: 'idle' })
  const saving = submit.status === 'saving'
  const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const save = async (event) => {
    event.preventDefault()
    const problems = {}
    if (!form.firstName.trim()) problems.firstName = 'Enter their first name.'
    if (!form.lastName.trim()) problems.lastName = 'Enter their last name.'
    if (!EMAIL_PATTERN.test(form.email.trim())) problems.email = 'Enter a valid email address.'
    if (form.password.length < 8) problems.password = 'Use at least 8 characters.'
    setErrors(problems)
    if (Object.keys(problems).length) return

    setSubmit({ status: 'saving' })
    try {
      const member = await createStaff({ ...form, firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim() })
      onDone(member ?? { firstName: form.firstName, lastName: form.lastName })
    } catch (error) {
      setErrors(fieldErrors(error))
      setSubmit({
        status: 'error',
        message: error.code === ERROR_CODES.ALREADY_EXISTS ? 'Someone already uses that email.' : errorMessage(error),
      })
    }
  }

  return (
    <Card aria-labelledby="add-staff-heading">
      <h2 id="add-staff-heading" className={styles.cardTitle}>
        Add a staff member
      </h2>
      <form className={styles.form} onSubmit={save} noValidate>
        {submit.status === 'error' && <Alert tone="error" title={submit.message} />}
        <div className={styles.dateRow}>
          <TextField label="First name" autoComplete="off" value={form.firstName} onChange={set('firstName')} error={errors.firstName} disabled={saving} />
          <TextField label="Last name" autoComplete="off" value={form.lastName} onChange={set('lastName')} error={errors.lastName} disabled={saving} />
        </div>
        <TextField label="Work email" type="email" icon={Mail} autoComplete="off" value={form.email} onChange={set('email')} error={errors.email} disabled={saving} />
        <SelectField label="Role" options={STAFF_ROLES} value={form.role} onChange={set('role')} disabled={saving} />
        <TextField
          label="Starting password"
          type="text"
          icon={Lock}
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          hint="At least 8 characters. They use it to log in the first time."
          disabled={saving}
        />
        <div className={styles.formActions}>
          <Button type="submit" loading={saving} loadingLabel="Adding…">
            Add staff member
          </Button>
          <Button variant="ghost" onClick={() => onDone(null)} disabled={saving}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}
