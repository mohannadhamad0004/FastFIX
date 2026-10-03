import { createContext, useContext, useEffect, useState } from 'react'

// Holds the admin service and a `version` that changes whenever any data the admin area shows
// changes (accounts, parts, requests, tags). The provider is AdminProvider.jsx.
export const AdminContext = createContext(null)

function useAdminContext() {
  const value = useContext(AdminContext)
  if (!value) throw new Error('Admin hooks must be used inside <AdminProvider>')
  return value
}

// The service from adminService.js.
export function useAdminService() {
  return useAdminContext().service
}

// Loads data through the admin service, like useMarketplaceQuery: `load` must keep the same
// identity between renders. Reloads whenever the underlying data changes.
export function useAdminQuery(load) {
  const { service, version } = useAdminContext()
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
