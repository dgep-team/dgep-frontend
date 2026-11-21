import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { Alert } from '../../../components/feedback/Alert.jsx'
import { Brand } from '../../../components/layout/Brand.jsx'
import { Button } from '../../../components/ui/Button.jsx'
import { Card } from '../../../components/ui/Card.jsx'
import { FieldIconButton, TextField } from '../../../components/ui/TextField.jsx'
import { safeRedirect } from '../../../lib/redirect.js'
import { staffLogin } from '../../../services/adminService.js'
import { ERROR_CODES, errorMessage, fieldErrors, isApiError } from '../../../services/api/errors.js'
import { useStaffSession } from '../../../state/useStaffSession.js'
import styles from './StaffLoginPage.module.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate({ email, password }) {
  const errors = {}
  if (!email.trim()) errors.email = 'Enter your work email.'
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Check your email address.'
  if (!password) errors.password = 'Enter your password.'
  return errors
}

function loginProblem(error) {
  if (isApiError(error, ERROR_CODES.INVALID_LOGIN)) return 'Email or password is wrong.'
  if (isApiError(error, ERROR_CODES.HOTEL_SUSPENDED)) return 'This hotel’s account is suspended. Contact StayEase support.'
  return errorMessage(error)
}

/** Hotel staff login: POST /admin/auth/login. Separate from guest login. */
export function StaffLoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { isLoggedIn } = useStaffSession()
  // Only staff pages are valid destinations after a staff login.
  const requested = safeRedirect(params.get('redirect'), '/admin')
  const redirect = requested.startsWith('/admin') ? requested : '/admin'

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [errors, setErrors] = useState({})
  const [submit, setSubmit] = useState({ status: 'idle' })

  if (isLoggedIn && submit.status !== 'submitting') return <Navigate to={redirect} replace />

  const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    const problems = validate(form)
    setErrors(problems)
    if (Object.keys(problems).length > 0) return

    setSubmit({ status: 'submitting' })
    try {
      await staffLogin(form)
      navigate(redirect, { replace: true })
    } catch (error) {
      setErrors(fieldErrors(error))
      setForm((current) => ({ ...current, password: '' }))
      setSubmit({ status: 'error', message: loginProblem(error) })
    }
  }

  const isSubmitting = submit.status === 'submitting'

  return (
    <div className={styles.page}>
      <main className={styles.main} aria-labelledby="staff-login-title">
        <div className={styles.brand}>
          <Brand />
        </div>
        <div className={styles.intro}>
          <h1 id="staff-login-title" className={styles.title}>
            Staff Login
          </h1>
          <p className={styles.subtitle}>Sign in to manage your hotel’s bookings and guests.</p>
        </div>

        <Card>
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {submit.status === 'error' && <Alert tone="error" title={submit.message} />}
            <TextField
              label="Email Address"
              type="email"
              icon={Mail}
              autoComplete="username"
              value={form.email}
              onChange={set('email')}
              error={errors.email}
              disabled={isSubmitting}
            />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              autoComplete="current-password"
              value={form.password}
              onChange={set('password')}
              error={errors.password}
              disabled={isSubmitting}
              trailing={
                <FieldIconButton
                  label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                </FieldIconButton>
              }
            />
            <Button type="submit" fullWidth loading={isSubmitting} loadingLabel="Logging in…">
              Login
            </Button>
            <button
              type="button"
              className={styles.forgot}
              onClick={() => setShowForgot((value) => !value)}
              aria-expanded={showForgot}
            >
              Forgot password?
            </button>
            {showForgot && (
              <Alert tone="info" title="Ask your hotel manager">
                Staff passwords are set by your manager. They can give you a new one from the Staff settings.
              </Alert>
            )}
          </form>
        </Card>

        <p className={styles.footer}>
          Not hotel staff? <Link to="/home">Go to StayEase</Link>
        </p>
      </main>
    </div>
  )
}
