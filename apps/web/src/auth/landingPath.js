import { ROLE_HOME_PATHS } from '../authorization/roles.js'
import { ACCOUNT_STATUS } from './constants.js'

// Where to send a user after login or signup: their dashboard, or the approval status page
// while an admin hasn't approved them yet.
export function landingPathFor(user) {
  if (user.status !== ACCOUNT_STATUS.APPROVED) return '/pending-approval'
  return ROLE_HOME_PATHS[user.role]
}
