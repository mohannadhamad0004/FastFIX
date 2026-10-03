import { useEffect, useRef } from 'react'
import Button from '../../../../components/Button.jsx'
import { SAFETY_NOTICE } from '../constants.js'
import { useEmergency } from '../EmergencyContext.js'
import EmergencyForm from './EmergencyForm.jsx'
import EmergencyTracker from './EmergencyTracker.jsx'
import styles from './EmergencyOverlay.module.css'

/**
 * The full-screen emergency screen (a native <dialog>: focus stays inside, Escape closes it). It
 * shows the form until an emergency is sent, then the tracker. Closing the screen never cancels an
 * emergency: it keeps running and the Emergency button shows it as active.
 */
export default function EmergencyOverlay() {
  const { open, closeScreen, mine } = useEmergency()
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog ref={ref} className={styles.screen} aria-labelledby="emergency-title" onClose={closeScreen}>
      {open && (
        <div className={styles.content}>
          <header className={styles.header}>
            <h1 id="emergency-title" className={styles.title}>
              Emergency
            </h1>
            <Button variant="secondary" onClick={closeScreen} aria-label="Close the emergency screen">
              Close
            </Button>
          </header>
          <p className={styles.safety} role="note">
            <strong>⚠ {SAFETY_NOTICE}</strong>
          </p>
          <div className={styles.body}>{mine ? <EmergencyTracker emergency={mine} /> : <EmergencyForm />}</div>
        </div>
      )}
    </dialog>
  )
}
