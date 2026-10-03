import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/useAuth.js'
import { CarsContext } from './CarsContext.js'
import { createCarsService } from './carsService.js'
import { seedCars } from './mockCars.js'

const seedData = { cars: seedCars }

// TODO: replace with real API calls
// Holds the mock cars in React state and provides the cars service. Memory only.
// Must be inside AuthProvider (see app/AppProviders.jsx).
export default function CarsProvider({ children }) {
  const { service: auth } = useAuth()
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
    return createCarsService(store, auth)
  })

  const value = useMemo(() => ({ service, version: data }), [service, data])
  return <CarsContext value={value}>{children}</CarsContext>
}
