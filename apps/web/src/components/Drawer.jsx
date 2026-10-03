import { useEffect, useId, useRef } from 'react'
import styles from './Drawer.module.css'

// Large panel that slides in from the right, built on the native <dialog> element (focus trap,
// Escape to close, backdrop). The content only renders while open.
export default function Drawer({ open, title, onClose, narrow = false, children }) {
  const dialogRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className={narrow ? `${styles.drawer} ${styles.narrow}` : styles.drawer}
      aria-labelledby={titleId}
      onClose={onClose}
      // A click on the backdrop lands on the <dialog> itself.
      onClick={(event) => event.target === dialogRef.current && onClose()}
    >
      {open && (
        <div className={styles.panel}>
          <header className={styles.header}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
              ×
            </button>
          </header>
          <div className={styles.body}>{children}</div>
        </div>
      )}
    </dialog>
  )
}
