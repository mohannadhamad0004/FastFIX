import { ACCOUNT_STATUS } from '../../auth/constants.js'
import { ROLES } from '../../authorization/roles.js'

// A parts shop manages only its own parts: a part belongs to the account whose id is part.shopId.
// marketplaceService.js enforces this for every write; the UI uses the same check to decide
// whether to show Edit/Delete. apps/api must enforce it too - these checks are only for UX.

export const OWN_PARTS_ONLY = 'You can only manage your own parts'

/** Whether `user` may manage the parts of the shop with id `shopId`. */
export function ownsShop(user, shopId) {
  return (
    Boolean(user) &&
    user.role === ROLES.PARTS_SHOP &&
    user.status === ACCOUNT_STATUS.APPROVED &&
    user.id === shopId
  )
}

/** Whether `user` may edit or delete `part`. */
export const canManagePart = (user, part) => ownsShop(user, part.shopId)
