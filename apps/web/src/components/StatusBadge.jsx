import styles from './StatusBadge.module.css'

// Small colored pill for statuses and urgency levels.
// tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
export default function StatusBadge({ label, tone = 'neutral' }) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{label}</span>
}
