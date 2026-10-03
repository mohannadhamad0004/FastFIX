import styles from './EmptyState.module.css'

/**
 * Shown when a list has nothing to display, or loading it failed.
 * @param {Object} props
 * @param {React.ReactNode} [props.icon]   an emoji or small SVG
 * @param {React.ReactNode} props.title
 * @param {React.ReactNode} [props.description]
 * @param {React.ReactNode} [props.action] usually a Button
 * @param {'h2' | 'h3'} [props.headingLevel]
 * @param {boolean} [props.compact]  less padding, for use inside cards and tables
 */
export default function EmptyState({ icon, title, description, action, headingLevel = 'h2', compact = false }) {
  const Heading = headingLevel
  return (
    <div className={`${styles.empty} ${compact ? styles.compact : ''}`.trim()} aria-live="polite">
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      <Heading className={styles.title}>{title}</Heading>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
