import styles from './CheckoutProgress.module.css'

// Progress bar and numbered steps for the checkout. Finished steps are buttons that go back.
export default function CheckoutProgress({ steps, current, onGoTo }) {
  const percent = Math.round(((current + 1) / steps.length) * 100)
  return (
    <nav className={styles.progress} aria-label="Checkout progress">
      <p className={styles.count}>
        Step {current + 1} of {steps.length}: <strong>{steps[current].title}</strong>
      </p>
      <div className={styles.bar} aria-hidden="true">
        <span className={styles.fill} style={{ width: `${percent}%` }} />
      </div>
      <ol className={styles.steps}>
        {steps.map((step, index) => {
          const done = index < current
          const state = done ? styles.done : index === current ? styles.current : styles.upcoming
          return (
            <li key={step.id} className={`${styles.step} ${state}`}>
              <button
                type="button"
                className={styles.stepButton}
                disabled={!done}
                onClick={() => onGoTo(index)}
                aria-current={index === current ? 'step' : undefined}
                aria-label={done ? `Go back to step ${index + 1}: ${step.title}` : undefined}
              >
                <span className={styles.number} aria-hidden="true">
                  {done ? '✓' : index + 1}
                </span>
                <span className={styles.label}>{step.title}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
