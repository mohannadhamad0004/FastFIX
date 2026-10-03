import { createContext, useContext } from 'react'

// Holds the notifications service and the logged-in user's notifications, so the navbar bell can
// show the unread count without waiting for a promise. The provider is NotificationsProvider.jsx.
export const NotificationsContext = createContext(null)

/**
 * const { items, unread, service } = useNotifications()
 * `items` are the logged-in user's notifications, newest first. `service` is notificationsService.js:
 * markRead, markAllRead (and getMyNotifications).
 */
export function useNotifications() {
  const value = useContext(NotificationsContext)
  if (!value) throw new Error('useNotifications must be used inside <NotificationsProvider>')
  return value
}
