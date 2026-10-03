import styles from './QuantityStepper.module.css'

// − [ 3 ] + for choosing how many. Can't go below 1 or above `max` (the stock). `name` says what
// the quantity is for, so screen readers hear "Decrease quantity of Front brake pad set".
export default function QuantityStepper({ value, max, onChange, name, disabled = false, size = 'md' }) {
  const set = (next) => onChange(Math.min(Math.max(next, 1), max))
  return (
    <div className={`${styles.stepper} ${styles[size]}`} role="group" aria-label={`Quantity of ${name}`}>
      <button
        type="button"
        className={styles.button}
        aria-label={`Decrease quantity of ${name}`}
        disabled={disabled || value <= 1}
        onClick={() => set(value - 1)}
      >
        −
      </button>
      <output className={styles.value} aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        className={styles.button}
        aria-label={`Increase quantity of ${name}`}
        disabled={disabled || value >= max}
        onClick={() => set(value + 1)}
      >
        +
      </button>
    </div>
  )
}
