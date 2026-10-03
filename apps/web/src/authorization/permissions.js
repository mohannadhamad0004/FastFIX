import { ROLES } from './roles.js'

// Map of role -> allowed actions. Client-side checks are for UX only; apps/api enforces the real permissions.
// Read it through usePermission. TODO: extend as features are built.
export const PERMISSIONS = Object.freeze({
  [ROLES.CUSTOMER]: [
    'cars:manage',
    'diagnosis:request',
    'marketplace:search',
    'marketplace:buy',
    'tow:request',
    'requests:service',
    'requests:tow',
    'requests:part_question',
  ],
  [ROLES.MECHANIC]: ['diagnosis:review', 'marketplace:search', 'marketplace:buy', 'requests:part_question'],
  [ROLES.PARTS_SHOP]: ['inventory:manage'],
  [ROLES.TOW]: ['tow:accept'],
  [ROLES.ADMIN]: ['accounts:review', 'certifications:review', 'users:manage'],
})
