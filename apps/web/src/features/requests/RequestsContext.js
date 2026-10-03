import { createContext, useContext, useEffect, useState } from 'react'

// Holds the requests service and a `version` that changes whenever a request is sent.
// The provider is RequestsProvider.jsx.
export const RequestsContext = createContext(null)

function useRequestsContext() {
  const value = useContext(RequestsContext)
  if (!value) throw new Error('Requests hooks must be used inside <RequestsProvider>')
  return value
}

// The service from requestsService.js: createRequest, getMyRequests, getRequest, getMyReports,
// getCarHistory, completeRequest.
export function useRequestsService() {
  return useRequestsContext().service
}

// Loads data through the service, like useMarketplaceQuery: `load` must keep the same identity
// between renders. Reloads whenever a request is sent.
export function useRequestsQuery(load) {
  const { service, version } = useRequestsContext()
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
