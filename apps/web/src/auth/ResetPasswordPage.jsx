import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import Button from '../components/Button.jsx'
import { TextField } from '../components/FormField.jsx'
import Notice from '../components/Notice.jsx'
import { AuthError } from './authService.js'
import { useAuth } from './useAuth.js'
import { passwordError } from './validation.js'
import AuthCard from './AuthCard.jsx'
import PasswordInput from './PasswordInput.jsx'
import PasswordStrength from './PasswordStrength.jsx'
import styles from './ResetPasswordPage.module.css'

function validate({ password, confirmPassword }) {
  const errors = {}
  const badPassword = passwordError(password)
  if (badPassword) errors.password = badPassword
  if (!confirmPassword) errors.confirmPassword = 'Type your new password again.'
  else if (confirmPassword !== password) errors.confirmPassword = "Passwords don't match."
  return errors
}

// /reset-password?token=... - the link from the reset email.
export default function ResetPasswordPage() {
  const { service } = useAuth()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const requestNewLink = <Link to="/forgot-password">Request a new reset link</Link>

  if (!token) {
    return (
      <AuthCard title="Reset link missing" footer={requestNewLink}>
        <Notice tone="warning">
          This page needs the link from your reset email. Open the link from the email again, or request a new one.
        </Notice>
      </AuthCard>
    )
  }

  if (done) {
    return (
      <AuthCard title="Password changed">
        <Notice tone="success">Your password was changed. You can log in with your new password now.</Notice>
        <Button to="/login">Go to log in</Button>
      </AuthCard>
    )
  }

  const setField = (name) => (event) => {
    const { value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError(null)
    const found = validate(form)
    setErrors(found)
    const [firstInvalid] = Object.keys(found)
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus()
      return
    }

    setSubmitting(true)
    try {
      await service.resetPassword(token, form.password)
      setDone(true)
    } catch (error) {
      if (error instanceof AuthError && error.field) setErrors({ [error.field]: error.message })
      else setFormError(error instanceof AuthError ? error.message : "Couldn't change your password. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard title="Choose a new password" footer={<Link to="/login">Back to log in</Link>}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {formError && (
          <Notice tone="danger">
            <p>{formError}</p>
            <p>{requestNewLink}</p>
          </Notice>
        )}
        <TextField
          id="password"
          as={PasswordInput}
          label="New password"
          autoComplete="new-password"
          value={form.password}
          onChange={setField('password')}
          error={errors.password}
        />
        <PasswordStrength password={form.password} />
        <TextField
          id="confirmPassword"
          as={PasswordInput}
          label="Confirm new password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={setField('confirmPassword')}
          error={errors.confirmPassword}
        />
        <Button type="submit" loading={submitting}>
          {submitting ? 'Saving…' : 'Change password'}
        </Button>
      </form>
    </AuthCard>
  )
}
