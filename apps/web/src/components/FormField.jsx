import Input from './Input.jsx'
import Select from './Select.jsx'
import Textarea from './Textarea.jsx'
import styles from './FormField.module.css'

const CONTROLS = { input: Input, select: Select, textarea: Textarea }

// Label, control, optional hint and error message, stacked.
// Use TextField for inputs, selects and textareas. For any other control, wrap it in FormField
// and give it the same `id` so the label points at it.
export default function FormField({ id, label, hint, optional = false, error, className = '', children }) {
  return (
    <div className={`${styles.field} ${className}`.trim()}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {optional && <small className={styles.optional}> (optional)</small>}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  )
}

// A labelled input with its hint and error wired up for screen readers.
// `as` swaps the control: 'select', 'textarea', or a component such as PasswordInput (which
// renders its own <input> with the Input styles).
export function TextField({ id, label, hint, optional, error, className, as = 'input', ...controlProps }) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ')
  const Control = CONTROLS[as] ?? as
  return (
    <FormField id={id} label={label} hint={hint} optional={optional} error={error} className={className}>
      <Control
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        {...controlProps}
      />
    </FormField>
  )
}

// Red error line under a field. Renders nothing when there is no error.
export function FieldError({ id, children }) {
  if (!children) return null
  return (
    <p id={id} className={styles.error}>
      {children}
    </p>
  )
}
