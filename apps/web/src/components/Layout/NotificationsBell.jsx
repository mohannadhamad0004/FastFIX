import { useEffect, useId, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useNotifications } from '../../features/marketplace/NotificationsContext.js'
import { formatDateTime } from '../../features/requests/format.js'
import styles from './NotificationsBell.module.css'

// The bell in the navbar: the logged-in user's notifications (order updates), newest first, with
// the unread count on the bell. Opening a notification marks it read and goes to its page.
// Closes on Escape, on a click outside, and when the page changes.
export default function NotificationsBell() {
  const { items, unread, service } = useNotifications()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const buttonRef = useRef(null)
  const panelId = useId()

  const [lastPath, setLastPath] = useState(location.pathname)
  if (location.pathname !== lastPath) {
    setLastPath(location.pathname)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return undefined
    function handlePointer(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    function handleKey(event) {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('pointerdown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  async function openNotification(notification) {
    setOpen(false)
    await service.markRead(notification.id)
    navigate(notification.link)
  }

  return (
    <div className={styles.bell} ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        onClick={() => setOpen((value) => !value)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {unread > 0 && (
          <span className={styles.count} aria-hidden="true">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div id={panelId} className={styles.panel} role="region" aria-label="Notifications">
          <div className={styles.header}>
            <p className={styles.heading}>Notifications</p>
            {unread > 0 && (
              <button type="button" className={styles.markAll} onClick={() => service.markAllRead()}>
                Mark all as read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className={styles.empty}>Nothing yet. Order updates show up here.</p>
          ) : (
            <ul className={styles.list}>
              {items.slice(0, 20).map((item) => (
                <li key={item.id}>
                  <button type="button" className={`${styles.item} ${item.read ? '' : styles.unread}`} onClick={() => openNotification(item)}>
                    <span className={styles.title}>
                      {!item.read && <span className={styles.srOnly}>Unread: </span>}
                      {item.title}
                    </span>
                    <span className={styles.body}>{item.body}</span>
                    <span className={styles.time}>{formatDateTime(item.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
