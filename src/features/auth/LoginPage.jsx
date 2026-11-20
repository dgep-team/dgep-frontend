import { Lock, Mail } from 'lucide-react'
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

function validate({ email, password }) {
  const errors = {}
  if (!email.trim()) errors.email = 'Enter your email address.'
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Check your email address.'
  if (!password) errors.password = 'Enter your password.'
  return errors
}

/** Guest login: POST /auth/login. */
export function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { login, isLoggedIn, isGuestCheckout } = useAuth()
  const redirect = safeRedirect(params.get('redirect'))

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submit, setSubmit] = useState({ status: 'idle' })

  // A guest-checkout session may still log in to a full account.
  if (isLoggedIn && !isGuestCheckout && submit.status !== 'submitting') return <Navigate to={redirect} replace />

  const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    const problems = validate(form)
    setErrors(problems)
    if (Object.keys(problems).length > 0) return

    setSubmit({ status: 'submitting' })
    try {
      await login(form)
      navigate(redirect, { replace: true })
    } catch (error) {
      setErrors(fieldErrors(error))
      setForm((current) => ({ ...current, password: '' }))
      setSubmit({
        status: 'error',
        message: isApiError(error, ERROR_CODES.INVALID_LOGIN) ? 'Email or password is wrong.' : errorMessage(error),
      })
    }
  }

  const isSubmitting = submit.status === 'submitting'

  return (
    <Screen width="narrow" header={<ScreenHeader title="Log in" backTo="/home" />} labelledBy="login-title">
      <div className={styles.intro}>
        <h1 id="login-title" className={styles.title}>
          Welcome back
        </h1>
        <p className={styles.subtitle}>Log in to see your bookings, check in and make requests during your stay.</p>
      </div>

      <Card>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {submit.status === 'error' && <Alert tone="error" title={submit.message} />}
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
            label="Password"
            type="password"
            icon={Lock}
            autoComplete="current-password"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            disabled={isSubmitting}
          />
          <Button type="submit" fullWidth loading={isSubmitting} loadingLabel="Logging in…">
            Log in
          </Button>
        </form>
      </Card>

      <p className={styles.footer}>
        New to StayEase? <Link to={loginUrl(redirect, '/register')}>Create an account</Link>
      </p>
    </Screen>
  )
}
