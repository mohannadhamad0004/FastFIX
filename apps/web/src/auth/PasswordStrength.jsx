import { PASSWORD_RULES, passwordStrength } from './validation.js'
import styles from './PasswordStrength.module.css'

const TONES = ['', styles.weak, styles.fair, styles.good, styles.strong]

// Strength meter plus the password rules, each ticked off as it is met.
export default function PasswordStrength({ password }) {
  const { score, label } = passwordStrength(password)

  return (
    <div className={styles.strength}>
      <div className={styles.meterRow}>
        <div className={`${styles.meter} ${TONES[score]}`} aria-hidden="true">
          {[1, 2, 3, 4].map((segment) => (
            <span key={segment} className={segment <= score ? styles.filled : styles.segment} />
          ))}
        </div>
        <span className={styles.label} aria-live="polite">
          {label && `Strength: ${label}`}
        </span>
      </div>
      <ul className={styles.rules}>
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(password)
          return (
            <li key={rule.id} className={met ? styles.met : styles.unmet}>
              <span aria-hidden="true">{met ? '✓' : '○'}</span> {rule.label}
              <span className={styles.srOnly}>{met ? ' (done)' : ' (missing)'}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
