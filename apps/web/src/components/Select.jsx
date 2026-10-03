import styles from './Input.module.css'

// Shared <select>, styled like Input, with a custom arrow. Pass <option>s as children.
export default function Select({ invalid = false, size = 'md', className = '', ...props }) {
  return (
    <select
      className={[styles.control, styles.select, styles[size], className].filter(Boolean).join(' ')}
      aria-invalid={invalid || props['aria-invalid'] || undefined}
      {...props}
    />
  )
}
