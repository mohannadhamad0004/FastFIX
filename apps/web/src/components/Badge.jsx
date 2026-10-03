import styles from './Badge.module.css'

/**
 * Small colored label for statuses, counts and categories.
 * @param {Object} props
 * @param {'neutral' | 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info'} [props.tone]
 * @param {'sm' | 'md'} [props.size]
 * @param {boolean} [props.dot]  a colored dot before the text
 */
export default function Badge({ tone = 'neutral', size = 'sm', dot = false, className = '', children, ...props }) {
  return (
    <span className={[styles.badge, styles[tone], styles[size], className].filter(Boolean).join(' ')} {...props}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  )
}
