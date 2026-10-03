import styles from './Notice.module.css'

// Message box for a whole form or page (not for single fields - use FieldError for those).
// tone: 'success' | 'warning' | 'danger' | 'info'
export default function Notice({ tone = 'info', title, children }) {
  return (
    <div className={`${styles.notice} ${styles[tone]}`} role={tone === 'danger' ? 'alert' : 'status'}>
      {title && <p className={styles.title}>{title}</p>}
      {children && <div className={styles.body}>{children}</div>}
    </div>
  )
}
