import styles from './Input.module.css'

// Shared text input. Takes every <input> prop. `invalid` draws the error border (TextField sets it
// from `error`). Textarea.jsx and Select.jsx use the same styles, so all fields look alike.
export default function Input({ invalid = false, size = 'md', className = '', ...props }) {
  return (
    <input
      className={[styles.control, styles[size], className].filter(Boolean).join(' ')}
      aria-invalid={invalid || props['aria-invalid'] || undefined}
      {...props}
    />
  )
}
