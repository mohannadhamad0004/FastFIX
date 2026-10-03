import { createContext, useContext, useEffect, useState } from 'react'

// Holds the cars service and a `version` that changes whenever a car is added, edited or deleted.
// The provider is CarsProvider.jsx.
export const CarsContext = createContext(null)

function useCarsContext() {
  const value = useContext(CarsContext)
  if (!value) throw new Error('Cars hooks must be used inside <CarsProvider>')
  return value
}

// The service from carsService.js: getMyCars, getCar, addCar, updateCar, deleteCar.
export function useCarsService() {
  return useCarsContext().service
}

// Loads data through the service, like useMarketplaceQuery: `load` must keep the same identity
// between renders. Reloads whenever the cars change.
export function useCarsQuery(load) {
  const { service, version } = useCarsContext()
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
