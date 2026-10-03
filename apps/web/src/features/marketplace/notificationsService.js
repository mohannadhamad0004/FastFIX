// TODO: replace with real API calls
//
// In-app notifications (the bell in the navbar). Orders and 3D scans create them:
//   buyer: every status change of their order (confirmed, preparing, ..., rejected, cancelled by admin)
//   shop:  a new order, and an order the buyer (or an admin) cancelled
//   customer: their 3D car scan is ready, or failed (features/preview3d/scanService.js)
// Each user sees only their own. `notify` is called by other services (orders, scans); in the
// real app the api creates them in the same transaction as the change, and may also send email
// according to the user's notification settings on /account.
//
// Mock: notifications live in NotificationsProvider's React state (memory only).

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} userId     who gets it
 * @property {'order' | 'scan'} type
 * @property {string} title
 * @property {string} body
 * @property {string} link       where it leads, e.g. /orders/o-4
 * @property {string} createdAt  ISO date
 * @property {boolean} read
 */

const copy = (value) => structuredClone(value)
const newestFirst = (a, b) => b.createdAt.localeCompare(a.createdAt)

/**
 * @param {{ read: () => { items: Notification[] }, write: (next: { items: Notification[] }) => void }} store
 * @param {{ getCurrentUser: () => Promise<{ id: string } | null> }} auth
 */
export function createNotificationsService(store, auth) {
  /**
   * Adds a notification for one user. Internal: called by other services, never by pages.
   * @param {string} userId
   * @param {{ title: string, body: string, link: string, type?: 'order' | 'scan' }} note
   */
  function notify(userId, { title, body, link, type = 'order' }) {
    const current = store.read()
    const number = current.items.reduce((max, item) => Math.max(max, Number(item.id.slice(2)) || 0), 0) + 1
    const created = { id: `n-${number}`, userId, type, title, body, link, createdAt: new Date().toISOString(), read: false }
    store.write({ ...current, items: [...current.items, created] })
  }

  /** @returns {Promise<Notification[]>} the logged-in user's notifications, newest first */
  async function getMyNotifications() {
    const user = await auth.getCurrentUser()
    if (!user) return []
    return copy(store.read().items.filter((item) => item.userId === user.id).sort(newestFirst))
  }

  /** @returns {Promise<void>} */
  async function markRead(notificationId) {
    const user = await auth.getCurrentUser()
    const current = store.read()
    store.write({
      ...current,
      items: current.items.map((item) =>
        item.id === notificationId && item.userId === user?.id ? { ...item, read: true } : item,
      ),
    })
  }

  /** @returns {Promise<void>} */
  async function markAllRead() {
    const user = await auth.getCurrentUser()
    if (!user) return
    const current = store.read()
    store.write({ ...current, items: current.items.map((item) => (item.userId === user.id ? { ...item, read: true } : item)) })
  }

  return { notify, getMyNotifications, markRead, markAllRead }
}
