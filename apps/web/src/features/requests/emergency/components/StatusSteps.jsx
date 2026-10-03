import { EMERGENCY_STEPS } from '../constants.js'
import styles from './StatusSteps.module.css'

/** Searching → Accepted → On the way → Arrived → Completed, with the current step marked. */
export default function StatusSteps({ status }) {
  const current = Math.max(0, EMERGENCY_STEPS.findIndex((step) => step.value === status))
  return (
    <ol className={styles.steps} aria-label="Progress">
      {EMERGENCY_STEPS.map((step, index) => (
        <li
          key={step.value}
          className={`${styles.step} ${index < current ? styles.done : ''} ${index === current ? styles.current : ''}`}
          aria-current={index === current ? 'step' : undefined}
        >
          <span className={styles.dot} aria-hidden="true">
            {index < current ? '✓' : index + 1}
          </span>
          <span className={styles.label}>{step.label}</span>
        </li>
      ))}
    </ol>
  )
}
