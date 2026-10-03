import { useAuth } from '../../../../auth/useAuth.js'
import { ACTIVE_EMERGENCY } from '../constants.js'
import { useEmergency } from '../EmergencyContext.js'
import styles from './EmergencyButton.module.css'

const SIREN = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3l10 17H2z" />
    <path d="M12 10v4M12 17h.01" />
  </svg>
)

/**
 * The red Emergency button: small in the navbar (always visible, also on phones), large on the tow
 * companies and mechanics pages. It opens the full-screen emergency screen. Customers and visitors
 * only; tow companies, mechanics, shops and admins don't send emergencies.
 * @param {{ variant?: 'nav' | 'large' }} props
 */
export default function EmergencyButton({ variant = 'nav' }) {
  const { user } = useAuth()
  const { openScreen, mine } = useEmergency()
  if (user && user.role !== 'customer') return null

  const running = mine && ACTIVE_EMERGENCY.includes(mine.status)
  if (variant === 'large') {
    return (
      <button type="button" className={`${styles.button} ${styles.large}`} onClick={openScreen}>
        {SIREN}
        <span className={styles.text}>
          <span className={styles.main}>{running ? 'Your emergency is active' : 'Emergency: need help on the road now?'}</span>
          <span className={styles.sub}>{running ? 'Tap to see where it is' : 'Share your location and we find the nearest tow truck or mechanic'}</span>
        </span>
      </button>
    )
  }
  return (
    <button type="button" className={`${styles.button} ${styles.nav}`} onClick={openScreen} aria-label={running ? 'Emergency, active' : 'Emergency'}>
      {SIREN}
      <span>{running ? 'Active' : 'Emergency'}</span>
    </button>
  )
}
