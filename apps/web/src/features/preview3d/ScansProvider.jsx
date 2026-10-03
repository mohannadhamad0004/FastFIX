import { useContext, useMemo, useState } from 'react'
import { useAuth } from '../../auth/useAuth.js'
import { CarsContext } from '../cars/CarsContext.js'
import { NotificationsContext } from '../marketplace/NotificationsContext.js'
import { ScansContext } from './ScansContext.js'
import { createScanService } from './scanService.js'

const seedData = { scans: [] }
const NONE = []

// TODO: replace with real API calls
// Holds the mock 3D scans in React state and provides the scan service. Memory only.
// Must be inside AuthProvider, NotificationsProvider and CarsProvider (see app/AppProviders.jsx).
export default function ScansProvider({ children }) {
  const { user, service: auth } = useAuth()
  const cars = useContext(CarsContext)
  const notifications = useContext(NotificationsContext)
  const [data, setData] = useState(seedData)

  const [service] = useState(() => {
    // Latest data, so a service call (or a processing timer) right after a write sees it.
    let latest = seedData
    const store = {
      read: () => latest,
      write: (next) => {
        latest = next
        setData(next)
      },
    }
    return createScanService(store, { auth, cars: cars.service, notifications: notifications.service })
  })

  const value = useMemo(() => {
    const scans = user
      ? data.scans.filter((scan) => scan.ownerId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      : NONE
    return { service, scans }
  }, [service, data, user])

  return <ScansContext value={value}>{children}</ScansContext>
}
