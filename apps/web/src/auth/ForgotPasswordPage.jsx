import { useState } from 'react'
import { Link } from 'react-router'
import Button from '../components/Button.jsx'
import { TextField } from '../components/FormField.jsx'
import Notice from '../components/Notice.jsx'
import { useAuth } from './useAuth.js'
import { isValidEmail } from './validation.js'
import AuthCard from './AuthCard.jsx'
import styles from './ForgotPasswordPage.module.css'

// /forgot-password - always shows the same message after sending, whether or not the email is
// registered, so this page can't be used to find out who has an account.
export default function ForgotPasswordPage() {
  const { service } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!email.trim()) return setError('Enter your email address.')
    if (!isValidEmail(email)) return setError('Enter a valid email address, like name@example.com.')

    setSubmitting(true)
    try {
      await service.requestPasswordReset(email)
    } finally {
      // Same result even if the request failed, so nothing is revealed.
      setSubmitting(false)
      setSent(true)
    }
  }

  const backToLogin = <Link to="/login">Back to log in</Link>

  if (sent) {
    return (
      <AuthCard title="Check your email" footer={backToLogin}>
        <Notice tone="success" title="If this email exists, we sent a reset link.">
          <p>The link works for 30 minutes. Check your spam folder if you don't see it.</p>
          {import.meta.env.DEV && <p>Mock mode: the reset link is in the browser console (F12 → Console).</p>}
        </Notice>
        <Button variant="secondary" onClick={() => setSent(false)}>
          Use a different email
        </Button>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter the email you signed up with and we'll send you a link to choose a new password."
      footer={backToLogin}
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setError(null)
          }}
          error={error}
        />
        <Button type="submit" loading={submitting}>
          {submitting ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
    </AuthCard>
  )
}
