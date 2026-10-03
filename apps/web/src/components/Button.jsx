import { Link } from 'react-router'
import styles from './Button.module.css'

/**
 * Shared button. Pass `to` to render a router link that looks like a button.
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'ghost' | 'danger'} [props.variant]
 *   primary: the main action on the page (copper gradient) · secondary: outlined · ghost: text only ·
 *   danger: destructive actions
 * @param {'sm' | 'md' | 'lg'} [props.size]
 * @param {boolean} [props.loading]   shows a spinner, disables the button and sets aria-busy
 * @param {boolean} [props.fullWidth]
 */
export default function Button({
  to,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}) {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    loading && styles.loading,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    )
  }
  return (
    <button type="button" className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {content}
    </button>
  )
}
