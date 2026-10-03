import styles from './Input.module.css'

// Shared multi-line text input, styled like Input.
export default function Textarea({ invalid = false, className = '', rows = 4, ...props }) {
  return (
    <textarea
      rows={rows}
      className={[styles.control, styles.textarea, className].filter(Boolean).join(' ')}
      aria-invalid={invalid || props['aria-invalid'] || undefined}
      {...props}
    />
  )
}
