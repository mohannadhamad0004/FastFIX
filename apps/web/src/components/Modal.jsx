import { useEffect, useId, useRef } from 'react'
import styles from './Modal.module.css'

// Shared modal dialog built on the native <dialog> element (focus trap and Escape come for free).
// The content only renders while open, so forms inside start fresh each time.
// `wide` fits longer forms.
export default function Modal({ open, title, onClose, wide = false, children }) {
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
      className={`${styles.dialog} ${wide ? styles.wide : ''}`}
      aria-labelledby={titleId}
      onClose={onClose}
    >
      {open && (
        <>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          {children}
        </>
      )}
    </dialog>
  )
}
