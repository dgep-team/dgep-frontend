import { Lock, Mail, Phone, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { Alert } from '../../components/feedback/Alert.jsx'
import { Screen } from '../../components/layout/AppShell.jsx'
import { ScreenHeader } from '../../components/layout/ScreenHeader.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { TextField } from '../../components/ui/TextField.jsx'
import { loginUrl, safeRedirect } from '../../lib/redirect.js'
import { ERROR_CODES, errorMessage, fieldErrors, isApiError } from '../../services/api/errors.js'
import { useAuth } from '../../state/authContext.js'
import styles from './Auth.module.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^\+?[0-9\s-]{7,20}$/

// Mirrors the API's rules (password 8 to 72 characters) so most mistakes are caught before sending.
function validate({ firstName, lastName, email, phone, password }) {
  const errors = {}
  if (!firstName.trim()) errors.firstName = 'Enter your first name.'
  if (!lastName.trim()) errors.lastName = 'Enter your last name.'
  if (!email.trim()) errors.email = 'Enter your email address.'
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Check your email address.'
  if (phone.trim() && !PHONE_PATTERN.test(phone.trim())) errors.phone = 'Use digits only, e.g. +2348012345678.'
  if (password.length < 8) errors.password = 'Use at least 8 characters.'
  else if (password.length > 72) errors.password = 'Use 72 characters or fewer.'
  return errors
}

/** Guest sign up: POST /auth/register (logs in straight away). */
export function RegisterPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { register, isLoggedIn, isGuestCheckout } = useAuth()
  const redirect = safeRedirect(params.get('redirect'))

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submit, setSubmit] = useState({ status: 'idle' })

  if (isLoggedIn && !isGuestCheckout && submit.status !== 'submitting') return <Navigate to={redirect} replace />

  const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    const problems = validate(form)
    setErrors(problems)
    if (Object.keys(problems).length > 0) return

    setSubmit({ status: 'submitting' })
    try {
      await register(form)
      navigate(redirect, { replace: true })
    } catch (error) {
      setErrors(fieldErrors(error))
      setSubmit({ status: 'error', error })
    }
  }

  const isSubmitting = submit.status === 'submitting'
  const emailTaken = isApiError(submit.error, ERROR_CODES.ALREADY_EXISTS)

  return (
    <Screen width="narrow" header={<ScreenHeader title="Sign up" backTo="/home" />} labelledBy="register-title">
      <div className={styles.intro}>
        <h1 id="register-title" className={styles.title}>
          Create your account
        </h1>
        <p className={styles.subtitle}>Keep your bookings in one place and check in before you arrive.</p>
      </div>

      <Card>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {submit.status === 'error' &&
            (emailTaken ? (
              <Alert tone="error" title="This email already has an account or a booking">
                <Link to={loginUrl(redirect)}>Log in instead</Link>.
              </Alert>
            ) : (
              <Alert tone="error" title={errorMessage(submit.error)} />
            ))}
          <div className={styles.row}>
            <TextField
              label="First name"
              icon={UserRound}
              autoComplete="given-name"
              value={form.firstName}
              onChange={set('firstName')}
              error={errors.firstName}
              disabled={isSubmitting}
            />
            <TextField
              label="Last name"
              autoComplete="family-name"
              value={form.lastName}
              onChange={set('lastName')}
              error={errors.lastName}
              disabled={isSubmitting}
            />
          </div>
          <TextField
            label="Email"
            type="email"
            icon={Mail}
            autoComplete="email"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
            disabled={isSubmitting}
          />
          <TextField
            label="Phone (optional)"
            type="tel"
            icon={Phone}
            autoComplete="tel"
            placeholder="+2348012345678"
            value={form.phone}
            onChange={set('phone')}
            error={errors.phone}
            disabled={isSubmitting}
          />
          <TextField
            label="Password"
            type="password"
            icon={Lock}
            autoComplete="new-password"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            hint="At least 8 characters."
            disabled={isSubmitting}
          />
          <Button type="submit" fullWidth loading={isSubmitting} loadingLabel="Creating account…">
            Create account
          </Button>
        </form>
      </Card>

      <p className={styles.footer}>
        Already have an account? <Link to={loginUrl(redirect)}>Log in</Link>
      </p>
    </Screen>
  )
}
