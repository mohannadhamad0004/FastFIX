import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ToastContext } from './ToastContext.js'
import styles from './Toast.module.css'

const DEFAULT_DURATION = 5000
const MAX_TOASTS = 4
const ICONS = { success: '✓', error: '!', warning: '!', info: 'i' }

// Holds the visible toasts and renders them in a corner of the screen. Screen readers announce
// them through a live region: errors interrupt (assertive), the others wait (polite).
export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const dismiss = useCallback((id) => setToasts((current) => current.filter((t) => t.id !== id)), [])

  const show = useCallback((tone, message, { title, duration = DEFAULT_DURATION } = {}) => {
    const id = ++nextId.current
    setToasts((current) => [...current, { id, tone, message, title, duration }].slice(-MAX_TOASTS))
  }, [])

  const api = useMemo(
    () => ({
      success: (message, options) => show('success', message, options),
      error: (message, options) => show('error', message, options),
      warning: (message, options) => show('warning', message, options),
      info: (message, options) => show('info', message, options),
    }),
    [show],
  )

  return (
    <ToastContext value={api}>
      {children}
      <div className={styles.region} aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} dismiss={dismiss} />
        ))}
      </div>
    </ToastContext>
  )
}

function Toast({ toast, dismiss }) {
  const [paused, setPaused] = useState(false)
  const onDismiss = () => dismiss(toast.id)

  // Auto-dismiss, paused while the pointer or keyboard focus is on the toast
  useEffect(() => {
    if (paused) return undefined
    const timer = setTimeout(() => dismiss(toast.id), toast.duration)
    return () => clearTimeout(timer)
  }, [paused, toast.id, toast.duration, dismiss])

  return (
    <div
      className={`${styles.toast} ${styles[toast.tone]}`}
      role={toast.tone === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className={styles.icon} aria-hidden="true">
        {ICONS[toast.tone]}
      </span>
      <div className={styles.text}>
        {toast.title && <p className={styles.title}>{toast.title}</p>}
        <p>{toast.message}</p>
      </div>
      <button type="button" className={styles.close} onClick={onDismiss} aria-label="Dismiss notification">
        ×
      </button>
    </div>
  )
}
