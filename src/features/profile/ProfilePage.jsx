import { Lock, LogOut, Mail, Phone, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Alert } from '../../components/feedback/Alert.jsx'
import { ErrorView, LoadingView } from '../../components/feedback/StatusView.jsx'
import { Screen } from '../../components/layout/AppShell.jsx'
import { ScreenHeader } from '../../components/layout/ScreenHeader.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { TextField } from '../../components/ui/TextField.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { errorMessage, fieldErrors } from '../../services/api/errors.js'
import { getMe, setPassword, updateMe } from '../../services/authService.js'
import { useAuth } from '../../state/authContext.js'
import styles from '../auth/Auth.module.css'

/** Profile: GET + PATCH /me, POST /auth/password, log out. */
export function ProfilePage() {
  const { isGuestCheckout } = useAuth()
  const me = useAsync((signal) => getMe({ signal }), 'me')

  const header = <ScreenHeader title="Profile" backTo="/home" />

  if (me.status === 'loading') return <Screen header={header} width="narrow"><LoadingView /></Screen>
  if (me.status === 'error') {
    return (
      <Screen header={header} width="narrow">
        <ErrorView message={errorMessage(me.error)} actionLabel="Try again" onAction={me.reload} />
      </Screen>
    )
  }

  return (
    <Screen header={header} width="narrow" labelledBy="profile-title">
      <div className={styles.intro}>
        <h1 id="profile-title" className={styles.title}>
          {[me.data.firstName, me.data.lastName].filter(Boolean).join(' ') || 'Your profile'}
        </h1>
        <p className={styles.subtitle}>
          <Mail size={14} aria-hidden="true" /> {me.data.email}
        </p>
      </div>

      <DetailsForm key={me.data.id} guest={me.data} onSaved={me.setData} />
      <PasswordForm firstPassword={isGuestCheckout} />

      <Button variant="ghost" fullWidth to="/logout" iconRight={<LogOut size={18} aria-hidden="true" />}>
        Log out
      </Button>
    </Screen>
  )
}

function DetailsForm({ guest, onSaved }) {
  const [form, setForm] = useState({ firstName: guest.firstName ?? '', lastName: guest.lastName ?? '', phone: guest.phone ?? '' })
  const [errors, setErrors] = useState({})
  const [save, setSave] = useState({ status: 'idle' })
  const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    const problems = {}
    if (!form.firstName.trim()) problems.firstName = 'Enter your first name.'
    if (!form.lastName.trim()) problems.lastName = 'Enter your last name.'
    setErrors(problems)
    if (Object.keys(problems).length > 0) return

    // Send only what changed.
    const changes = {}
    for (const field of ['firstName', 'lastName', 'phone']) {
      const next = form[field].trim()
      if (next !== (guest[field] ?? '')) changes[field] = next
    }
    if (Object.keys(changes).length === 0) {
      setSave({ status: 'saved' })
      return
    }

    setSave({ status: 'saving' })
    try {
      const updated = await updateMe(changes)
      setSave({ status: 'saved' })
      onSaved({ ...guest, ...updated })
    } catch (error) {
      setErrors(fieldErrors(error))
      setSave({ status: 'error', error })
    }
  }

  const saving = save.status === 'saving'

  return (
    <Card aria-labelledby="details-heading">
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <h2 id="details-heading" className={styles.subtitle}>
          Your details
        </h2>
        {save.status === 'saved' && <Alert tone="success" title="Details saved" />}
        {save.status === 'error' && <Alert tone="error" title={errorMessage(save.error)} />}
        <div className={styles.row}>
          <TextField label="First name" icon={UserRound} autoComplete="given-name" value={form.firstName} onChange={set('firstName')} error={errors.firstName} disabled={saving} />
          <TextField label="Last name" autoComplete="family-name" value={form.lastName} onChange={set('lastName')} error={errors.lastName} disabled={saving} />
        </div>
        <TextField label="Phone" type="tel" icon={Phone} autoComplete="tel" value={form.phone} onChange={set('phone')} error={errors.phone} disabled={saving} />
        <Button type="submit" variant="secondary" loading={saving} loadingLabel="Saving…">
          Save details
        </Button>
      </form>
    </Card>
  )
}

/** A guest who booked without an account sets a first password (no current one needed). */
function PasswordForm({ firstPassword }) {
  const [form, setForm] = useState({ currentPassword: '', password: '' })
  const [errors, setErrors] = useState({})
  const [save, setSave] = useState({ status: 'idle' })
  const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    const problems = {}
    if (!firstPassword && !form.currentPassword) problems.currentPassword = 'Enter your current password.'
    if (form.password.length < 8) problems.password = 'Use at least 8 characters.'
    else if (form.password.length > 72) problems.password = 'Use 72 characters or fewer.'
    setErrors(problems)
    if (Object.keys(problems).length > 0) return

    setSave({ status: 'saving' })
    try {
      await setPassword({ password: form.password, currentPassword: firstPassword ? undefined : form.currentPassword })
      setForm({ currentPassword: '', password: '' })
      setSave({ status: 'saved' })
    } catch (error) {
      setErrors(fieldErrors(error))
      setSave({ status: 'error', error })
    }
  }

  const saving = save.status === 'saving'

  return (
    <Card aria-labelledby="password-heading">
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <h2 id="password-heading" className={styles.subtitle}>
          {firstPassword ? 'Set a password to keep your account' : 'Change password'}
        </h2>
        {save.status === 'saved' && <Alert tone="success" title="Password saved" />}
        {save.status === 'error' && <Alert tone="error" title={errorMessage(save.error)} />}
        {!firstPassword && (
          <TextField label="Current password" type="password" icon={Lock} autoComplete="current-password" value={form.currentPassword} onChange={set('currentPassword')} error={errors.currentPassword} disabled={saving} />
        )}
        <TextField label="New password" type="password" icon={Lock} autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} hint="At least 8 characters." disabled={saving} />
        <Button type="submit" variant="secondary" loading={saving} loadingLabel="Saving…">
          {firstPassword ? 'Set password' : 'Change password'}
        </Button>
      </form>
    </Card>
  )
}
