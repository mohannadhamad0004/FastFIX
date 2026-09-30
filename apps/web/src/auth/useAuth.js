import { createContext, useContext, useEffect, useState } from 'react'

// Holds { user, service, version, store }. The provider is AuthProvider in AuthContext.jsx.
// `store` is the raw mock data - only features/admin/AdminProvider.jsx may use it.
export const AuthContext = createContext(null)

function useAuthContext() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('Auth hooks must be used inside <AuthProvider>')
  return value
}

// `user` is the logged-in account (see Account in types.js) or null. It updates right after
// login, logout, signup and approval.
// `service` is authService.js: register, login, logout, getCurrentUser, requestPasswordReset,
// resetPassword, and the public directory calls getDirectory(role), getDirectoryEntry(role, id)
// for mechanics and tow companies. Admin calls are in features/admin (useAdminService).
export function useAuth() {
  const { user, service } = useAuthContext()
  return { user, service }
}

// Loads data through the auth service, like useMarketplaceQuery: useAuthQuery(loadMechanics) with
// `const loadMechanics = (service) => service.getDirectory('mechanic')` defined outside the component.
// Reloads whenever account data changes (e.g. an admin approves or suspends someone).
export function useAuthQuery(load) {
  const { service, version } = useAuthContext()
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
