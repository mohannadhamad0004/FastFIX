import { FieldError } from '../../../components/FormField.jsx'
import styles from './ServiceModePicker.module.css'

// Radio cards for the service modes a mechanic offers. `options` are { value, label, hint }.
// The fieldset has the field id, so the request form can focus it when nothing is chosen.
export default function ServiceModePicker({ id, legend, options, value, onChange, error }) {
  return (
    <fieldset
      id={id}
      tabIndex={-1}
      className={styles.picker}
      aria-describedby={error ? `${id}-error` : undefined}
      aria-invalid={error ? true : undefined}
    >
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.options}>
        {options.map((option) => (
          <label key={option.value} className={styles.option}>
            <input
              type="radio"
              name={id}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className={styles.radio}
            />
            <span className={styles.text}>
              <span className={styles.label}>{option.label}</span>
              <span className={styles.hint}>{option.hint}</span>
            </span>
          </label>
        ))}
      </div>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </fieldset>
  )
}
