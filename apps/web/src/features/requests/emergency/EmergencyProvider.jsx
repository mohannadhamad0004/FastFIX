import { useContext, useMemo, useState } from 'react'
import { AuthContext, useAuth } from '../../../auth/useAuth.js'
import { ACTIVE_EMERGENCY } from './constants.js'
import { EmergencyContext } from './EmergencyContext.js'
import { createDispatchService } from './mockDispatchService.js'

// TODO: replace with backend + WebSockets
// Holds the mock emergencies in React state and provides the dispatch service. Memory only: a
// page reload clears them. Must be inside AuthProvider (app/AppProviders.jsx).
export default function EmergencyProvider({ children }) {
  const auth = useContext(AuthContext)
  const { user } = useAuth()
  const [data, setData] = useState({ emergencies: [] })
  const [open, setOpen] = useState(false)
  // The emergency a visitor just sent (visitors have no account to find it by)
  const [visitorId, setVisitorId] = useState(null)
  // Finished emergencies the customer closed (completed, cancelled, nobody available)
  const [dismissed, setDismissed] = useState(() => new Set())

  const [{ service, store }] = useState(() => {
    // Latest data, so a service call made right after a write sees it before React re-renders.
    let latest = { emergencies: [] }
    const mockStore = {
      read: () => latest,
      write: (next) => {
        latest = next
        setData(next)
      },
    }
    return { service: createDispatchService(mockStore, { accounts: auth.store }), store: mockStore }
  })

  const { emergencies } = data
  const mine = useMemo(() => {
    const active = (e) => ACTIVE_EMERGENCY.includes(e.status)
    const byUser = user && emergencies.find((e) => e.customer.userId === user.id && active(e))
    const byVisitor = !user && emergencies.find((e) => e.id === visitorId)
    // The last one the customer sent, so they still see how it ended (completed, cancelled, nobody)
    const latest = user && [...emergencies].reverse().find((e) => e.customer.userId === user.id)
    const found = byUser || byVisitor || latest || null
    return found && !dismissed.has(found.id) ? found : null
  }, [emergencies, user, visitorId, dismissed])

  const value = useMemo(
    () => ({
      service,
      store,
      emergencies,
      mine,
      open,
      openScreen: () => setOpen(true),
      closeScreen: () => setOpen(false),
      rememberVisitorEmergency: setVisitorId,
      // After a finished emergency the customer can close it and start a new one
      dismiss: (id) => setDismissed((current) => new Set(current).add(id)),
    }),
    [service, store, emergencies, mine, open],
  )
  return <EmergencyContext value={value}>{children}</EmergencyContext>
}
