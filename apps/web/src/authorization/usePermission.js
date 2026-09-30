import { ACCOUNT_STATUS } from '../auth/constants.js'
import { useAuth } from '../auth/useAuth.js'
import { PERMISSIONS } from './permissions.js'

// Whether the logged-in user may do `action` (e.g. 'accounts:review'). False when logged out or
// not approved yet. Use it to show or hide UI; apps/api enforces the real permissions.
export function usePermission(action) {
  const { user } = useAuth()
  if (!user || user.status !== ACCOUNT_STATUS.APPROVED) return false
  return PERMISSIONS[user.role]?.includes(action) ?? false
}
