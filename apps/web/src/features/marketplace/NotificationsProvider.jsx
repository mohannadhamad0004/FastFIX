import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/useAuth.js'
import { NotificationsContext } from './NotificationsContext.js'
import { createNotificationsService } from './notificationsService.js'

const seedData = { items: [] }
const NONE = []

// TODO: replace with real API calls
// Holds the mock notifications in React state and provides the notifications service. Memory only.
// Must be inside AuthProvider and outside OrdersProvider (orders create notifications).
export default function NotificationsProvider({ children }) {
  const { user, service: auth } = useAuth()
  const [data, setData] = useState(seedData)

  const [service] = useState(() => {
    // Latest data, so a service call made right after a write sees it before React re-renders.
    let latest = seedData
    const store = {
      read: () => latest,
      write: (next) => {
        latest = next
        setData(next)
      },
    }
    return createNotificationsService(store, auth)
  })

  const value = useMemo(() => {
    const items = user
      ? data.items.filter((item) => item.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      : NONE
    return { service, items, unread: items.filter((item) => !item.read).length }
  }, [service, data, user])

  return <NotificationsContext value={value}>{children}</NotificationsContext>
}
