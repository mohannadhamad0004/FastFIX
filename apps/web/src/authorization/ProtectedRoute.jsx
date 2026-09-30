import { Navigate, Outlet, useLocation } from 'react-router'
import { ACCOUNT_STATUS } from '../auth/constants.js'
import { loginPathFor } from '../auth/redirect.js'
import { useAuth } from '../auth/useAuth.js'
import { ROLE_HOME_PATHS } from './roles.js'

// Renders its child routes (or `children`) only for a logged-in, approved user whose role is in
// `roles` (any role when `roles` is left out). Everyone else is redirected:
//   not logged in      -> /login (and back here after logging in)
//   not approved yet   -> /pending-approval
//   another role       -> their own dashboard
// UX only - apps/api enforces the real permissions.
export default function ProtectedRoute({ roles, children }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) return <Navigate to={loginPathFor(location)} replace />
  if (user.status !== ACCOUNT_STATUS.APPROVED) return <Navigate to="/pending-approval" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={ROLE_HOME_PATHS[user.role]} replace />

  return children ?? <Outlet />
}
