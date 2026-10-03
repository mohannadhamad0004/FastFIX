import styles from './AdminPage.module.css'

// Title, short description and optional actions at the top of an admin page, then the content.
export default function AdminPage({ title, description, actions, children }) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{title}</h1>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </header>
      {children}
    </div>
  )
}
