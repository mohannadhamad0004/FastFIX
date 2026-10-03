import { REVIEW_STATUS, REVIEWED_FIELD_LABELS } from './constants.js'

// After an account is approved, some of its parts are still reviewed one by one: a changed
// business name or license (account.pendingChanges), a new or re-certified skill, and a new or
// edited truck. These helpers list them for the admin approvals page and the owner's profile.

export const REVIEW_ITEM_KINDS = Object.freeze({ CHANGE: 'change', SKILL: 'skill', TRUCK: 'truck' })

/**
 * Everything of `account` waiting for an admin, oldest first.
 * @param {import('./types.js').Account} account
 * @returns {{ kind: 'change' | 'skill' | 'truck', id: string, label: string, submittedAt: string }[]}
 *   id is the field name for changes, otherwise the skill or truck id
 */
export function pendingReviewItems(account) {
  const isPending = (status) => status === REVIEW_STATUS.PENDING
  const items = [
    ...(account.pendingChanges ?? [])
      .filter((change) => isPending(change.status))
      .map((change) => ({
        kind: REVIEW_ITEM_KINDS.CHANGE,
        id: change.field,
        label: REVIEWED_FIELD_LABELS[change.field],
        submittedAt: change.submittedAt,
      })),
    ...(account.skills ?? [])
      .filter((skill) => isPending(skill.status))
      .map((skill) => ({
        kind: REVIEW_ITEM_KINDS.SKILL,
        id: skill.id,
        label: `Skill: ${skill.skill}`,
        submittedAt: skill.submittedAt ?? account.createdAt,
      })),
    ...(account.trucks ?? [])
      .filter((truck) => isPending(truck.reviewStatus))
      .map((truck) => ({
        kind: REVIEW_ITEM_KINDS.TRUCK,
        id: truck.id,
        label: `Truck ${truck.plateNumber}`,
        submittedAt: truck.submittedAt ?? account.createdAt,
      })),
  ]
  return items.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
}

/** The pending or rejected change of one reviewed field, or null. */
export const changeOf = (account, field) => account.pendingChanges?.find((change) => change.field === field) ?? null

/** Only approved trucks are shown publicly and can take tow requests. */
export const isApprovedTruck = (truck) => truck.reviewStatus === REVIEW_STATUS.APPROVED
