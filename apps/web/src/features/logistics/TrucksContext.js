import { createContext, useContext, useEffect, useState } from 'react'

// Holds the trucks service and a `version` that changes whenever the accounts or the requests
// change. The provider is TrucksProvider.jsx, mounted by the /tow/trucks page.
export const TrucksContext = createContext(null)

function useTrucksContext() {
  const value = useContext(TrucksContext)
  if (!value) throw new Error('Trucks hooks must be used inside <TrucksProvider>')
  return value
}

// The service from trucksService.js: getMyTrucks, addTruck, updateTruck, setTruckStatus, removeTruck.
export function useTrucksService() {
  return useTrucksContext().service
}

// Loads data through the service, like useMarketplaceQuery: `load` must keep the same identity
// between renders. Reloads whenever trucks or tow requests change.
export function useTrucksQuery(load) {
  const { service, version } = useTrucksContext()
  const [state, setState] = useState({ data: undefined, error: null, loading: true })

  useEffect(() => {
    let ignore = false
    load(service).then(
      (data) => !ignore && setState({ data, error: null, loading: false }),
      (error) => !ignore && setState({ data: undefined, error, loading: false }),
    )
    return () => {
      ignore = true
    }
  }, [load, service, version])

  return state
}
