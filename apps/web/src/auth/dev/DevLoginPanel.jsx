import { useState } from 'react'
import { useAuth } from '../useAuth.js'
import { clearAuthState } from '../sessionPersistence.js'
import { DEV_ACCOUNTS } from './devAccounts.js'
import styles from './DevLoginPanel.module.css'

// DEVELOPMENT ONLY. One-click login for each test account, on /login.
// LoginPage loads this file only when import.meta.env.DEV is true, so production builds don't
// contain it (Vite replaces import.meta.env.DEV with false and drops the import).
export default function DevLoginPanel() {
  const { service } = useAuth()
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  async function loginAs(account) {
    setBusy(account.email)
    setError(null)
    try {
      // Same path as the form: after login, LoginPage redirects (to ?redirect=... if present).
      await service.login(account.email, account.password)
    } catch (err) {
      setError(`${account.label}: ${err.message}`)
      setBusy(null)
    }
  }

  function resetMockData() {
    clearAuthState()
    window.location.reload()
  }

  return (
    <details className={styles.panel}>
      <summary className={styles.summary}>
        Developer shortcuts <span className={styles.badge}>development only</span>
      </summary>
      <p className={styles.hint}>Log in instantly as a test account. Not shown in production builds.</p>
      <ul className={styles.accounts}>
        {DEV_ACCOUNTS.map((account) => (
          <li key={account.email}>
            <button
              type="button"
              className={styles.account}
              onClick={() => loginAs(account)}
              disabled={busy !== null}
            >
              <span className={styles.label}>{busy === account.email ? 'Logging in…' : account.label}</span>
              <span className={styles.email}>{account.email}</span>
              <span className={styles.note}>{account.note}</span>
            </button>
          </li>
        ))}
      </ul>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button type="button" className={styles.reset} onClick={resetMockData}>
        Reset mock data (clears the saved session and reloads)
      </button>
    </details>
  )
}
