// TODO: replace with real API calls
//
// Everything the admin area does: overview numbers, approvals (with per-skill decisions and the
// verification method), updates to review on approved accounts (changed names and licenses, new or
// re-certified skills, new or edited trucks), users (suspend / reactivate), tags, listings (hide
// parts), reviews (reports, hide / unhide) and the request monitor. Every function returns a Promise and first checks that the
// logged-in user is an approved admin - the api must do the same on every admin endpoint.
//
// Mock: like a backend module reading the database, this service reads and writes the raw mock
// stores of the other features (accounts, marketplace, requests, tags). AdminProvider passes them in.

import { toPublicUser } from '../../auth/authService.js'
import {
  ACCOUNT_STATUS,
  REVIEW_STATUS,
  ROLES_NEEDING_APPROVAL,
  SKILL_STATUS,
  VERIFICATION_METHODS,
} from '../../auth/constants.js'
import { pendingReviewItems, REVIEW_ITEM_KINDS } from '../../auth/reviewItems.js'
import { ROLES } from '../../authorization/roles.js'
import { deepCopy } from '../../utils/deepCopy.js'
import { TAG_COLORS, TAG_NAME_MAX_LENGTH, TAG_TYPES } from './constants.js'

/** @typedef {import('../../auth/types.js').Account} Account */
/** @typedef {import('../marketplace/types.js').Part} Part */
/** @typedef {{ read: () => any, write: (next: any) => void }} MockStore */

// Thrown for problems the admin can fix. `field` names the form field it belongs to, if any.
export class AdminError extends Error {
  constructor(message, field = null) {
    super(message)
    this.name = 'AdminError'
    this.field = field
  }
}

const now = () => new Date().toISOString()
const isBlank = (value) => !String(value ?? '').trim()
const sameLocalDay = (iso, date) => new Date(iso).toDateString() === date.toDateString()

// "t-9" -> "t-10"
function nextId(items, prefix) {
  const max = items.reduce((highest, item) => Math.max(highest, Number(item.id.slice(prefix.length)) || 0), 0)
  return `${prefix}${max + 1}`
}

/**
 * @param {{ auth: MockStore, marketplace: MockStore, requests: MockStore, tags: MockStore, reviews: MockStore,
 *           orders: MockStore }} stores
 * @param {{ orders: Object }} services  the orders service: cancelling an order moves stock, refunds and notifies
 */
export function createAdminService(stores, services) {
  // --- Helpers ---------------------------------------------------------------------------------

  function requireAdmin() {
    const { users, sessionUserId } = stores.auth.read()
    const user = users.find((u) => u.id === sessionUserId)
    if (!user || user.role !== ROLES.ADMIN || user.status !== ACCOUNT_STATUS.APPROVED || user.suspended) {
      throw new AdminError('Only admins can do this.')
    }
    return user
  }

  function findUser(userId) {
    const user = stores.auth.read().users.find((u) => u.id === userId)
    if (!user) throw new AdminError('This account no longer exists.')
    return user
  }

  function updateUser(userId, changes) {
    const data = stores.auth.read()
    stores.auth.write({ ...data, users: data.users.map((u) => (u.id === userId ? { ...u, ...changes } : u)) })
  }

  function findPart(partId) {
    const part = stores.marketplace.read().parts.find((p) => p.id === partId)
    if (!part) throw new AdminError('This part no longer exists.')
    return part
  }

  function updatePart(partId, changes) {
    const data = stores.marketplace.read()
    stores.marketplace.write({ ...data, parts: data.parts.map((p) => (p.id === partId ? { ...p, ...changes } : p)) })
  }

  function findPending(userId) {
    const user = findUser(userId)
    if (user.status !== ACCOUNT_STATUS.PENDING) throw new AdminError('This account is no longer waiting for review.')
    return user
  }

  function checkMethod(method, required) {
    if (!method) {
      if (required) throw new AdminError('Choose how you verified this account before approving it.', 'method')
      return null
    }
    if (!VERIFICATION_METHODS.some((m) => m.value === method)) throw new AdminError('Unknown verification method.', 'method')
    return method
  }

  // Order totals for the overview: counts by group, and the value of every order that isn't cancelled.
  function orderStats(orders) {
    const live = orders.filter((o) => o.status !== 'cancelled')
    return {
      total: orders.length,
      new: orders.filter((o) => o.status === 'placed').length,
      inProgress: orders.filter((o) => !['placed', 'completed', 'cancelled'].includes(o.status)).length,
      completed: orders.filter((o) => o.status === 'completed').length,
      cancelled: orders.length - live.length,
      valueIls: live.reduce((sum, o) => sum + o.totalIls, 0),
      completedValueIls: orders.filter((o) => o.status === 'completed').reduce((sum, o) => sum + o.totalIls, 0),
    }
  }

  // --- Overview --------------------------------------------------------------------------------

  /** Numbers for the /admin cards, plus the 5 newest pending signups. */
  async function getOverview() {
    requireAdmin()
    const { users } = stores.auth.read()
    const { parts } = stores.marketplace.read()
    const { requests } = stores.requests.read()
    const today = new Date()

    const countBy = (predicate) =>
      Object.fromEntries(ROLES_NEEDING_APPROVAL.map((role) => [role, users.filter((u) => u.role === role && predicate(u)).length]))
    const pending = users.filter((u) => u.status === ACCOUNT_STATUS.PENDING)

    return deepCopy({
      pendingByRole: countBy((u) => u.status === ACCOUNT_STATUS.PENDING),
      updatesByRole: countBy((u) => u.status === ACCOUNT_STATUS.APPROVED && pendingReviewItems(u).length > 0),
      approvedByRole: countBy((u) => u.status === ACCOUNT_STATUS.APPROVED && !u.suspended),
      partsListed: parts.filter((p) => !p.hidden).length,
      partsHidden: parts.filter((p) => p.hidden).length,
      requestsToday: requests.filter((r) => sameLocalDay(r.createdAt, today)).length,
      suspendedUsers: users.filter((u) => u.suspended).length,
      orders: orderStats(stores.orders.read().orders),
      newestPending: pending
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5)
        .map(({ id, name, role, city, createdAt }) => ({ id, name, role, city, createdAt })),
    })
  }

  // --- Approvals -------------------------------------------------------------------------------

  /** @returns {Promise<Account[]>} pending accounts (optionally one role), oldest first */
  async function getPendingAccounts(role = null) {
    requireAdmin()
    return stores.auth
      .read()
      .users.filter((u) => u.status === ACCOUNT_STATUS.PENDING && (!role || u.role === role))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(toPublicUser)
  }

  /** Approved and rejected signups, newest decision first, with how they were verified. */
  async function getReviewHistory() {
    requireAdmin()
    const { users } = stores.auth.read()
    const nameOf = (id) => users.find((u) => u.id === id)?.name ?? 'Unknown admin'
    return users
      .filter(
        (u) =>
          ROLES_NEEDING_APPROVAL.includes(u.role) &&
          u.reviewedAt &&
          [ACCOUNT_STATUS.APPROVED, ACCOUNT_STATUS.REJECTED].includes(u.status),
      )
      .sort((a, b) => b.reviewedAt.localeCompare(a.reviewedAt))
      .map((u) =>
        deepCopy({
          id: u.id,
          name: u.name,
          role: u.role,
          status: u.status,
          reviewedAt: u.reviewedAt,
          method: u.verification?.method ?? null,
          note: u.verification?.note ?? '',
          reviewedByName: u.verification ? nameOf(u.verification.reviewedBy) : '',
          rejectionReason: u.rejectionReason,
          skills: (u.skills ?? []).map(({ skill, status }) => ({ skill, status })),
        }),
      )
  }

  /**
   * @param {string} userId
   * @param {{ method: string, note?: string, skillDecisions?: Object<string, 'approved' | 'rejected'>,
   *   skillReasons?: Object<string, string> }} review
   *   method is required. Mechanics need a decision for every skill (by skill id), at least one
   *   approved skill, and a reason for each rejected skill (the mechanic sees it on /profile); only
   *   approved skills are shown publicly. A tow company's signup trucks are approved with it.
   * @returns {Promise<Account>}
   */
  async function approveAccount(userId, { method, note = '', skillDecisions = {}, skillReasons = {} } = {}) {
    const admin = requireAdmin()
    const user = findPending(userId)
    const checkedMethod = checkMethod(method, true)

    const changes = {
      status: ACCOUNT_STATUS.APPROVED,
      rejectionReason: null,
      reviewedAt: now(),
      verification: { method: checkedMethod, note: note.trim(), reviewedBy: admin.id },
    }

    if (user.role === ROLES.MECHANIC) {
      const decisions = user.skills.map((skill) => skillDecisions[skill.id])
      if (decisions.some((d) => d !== SKILL_STATUS.APPROVED && d !== SKILL_STATUS.REJECTED)) {
        throw new AdminError('Approve or reject every skill first.', 'skills')
      }
      if (!decisions.includes(SKILL_STATUS.APPROVED)) {
        throw new AdminError('Approve at least one skill, or reject the whole account instead.', 'skills')
      }
      const unexplained = user.skills.find(
        (skill) => skillDecisions[skill.id] === SKILL_STATUS.REJECTED && isBlank(skillReasons[skill.id]),
      )
      if (unexplained) throw new AdminError(`Write why ${unexplained.skill} is rejected.`, 'skills')
      changes.skills = user.skills.map((skill) => ({
        ...skill,
        status: skillDecisions[skill.id],
        rejectionReason: skillDecisions[skill.id] === SKILL_STATUS.REJECTED ? skillReasons[skill.id].trim() : null,
      }))
    }
    if (user.role === ROLES.TOW) {
      changes.trucks = user.trucks.map((truck) => ({ ...truck, reviewStatus: REVIEW_STATUS.APPROVED }))
    }

    updateUser(userId, changes)
    return toPublicUser({ ...user, ...changes })
  }

  /**
   * @param {string} userId
   * @param {{ reason: string, method?: string, note?: string }} review  the reason is shown to the user
   * @returns {Promise<Account>}
   */
  async function rejectAccount(userId, { reason, method = null, note = '' } = {}) {
    const admin = requireAdmin()
    const user = findPending(userId)
    if (isBlank(reason)) throw new AdminError('Write the reason for rejecting this account.', 'reason')
    const checkedMethod = checkMethod(method, false)

    const changes = {
      status: ACCOUNT_STATUS.REJECTED,
      rejectionReason: reason.trim(),
      reviewedAt: now(),
      verification: { method: checkedMethod, note: note.trim(), reviewedBy: admin.id },
    }
    updateUser(userId, changes)
    return toPublicUser({ ...user, ...changes })
  }

  // --- Updates to review (approved accounts) ---------------------------------------------------
  // After approval, these are reviewed one by one: a changed business name, workshop name or
  // business license (account.pendingChanges), a new or re-certified skill, a new or edited truck.
  // No verification method is needed; rejecting needs a reason, which the owner sees.

  /**
   * Approved accounts (optionally one role) with something waiting, the longest waiting first.
   * Each has `reviewItems`: [{ kind, id, label, submittedAt }] (see auth/reviewItems.js).
   * @returns {Promise<Array<Account & { reviewItems: Object[] }>>}
   */
  async function getUpdatesToReview(role = null) {
    requireAdmin()
    return stores.auth
      .read()
      .users.filter((u) => u.status === ACCOUNT_STATUS.APPROVED && (!role || u.role === role))
      .map((u) => ({ user: u, items: pendingReviewItems(u) }))
      .filter(({ items }) => items.length > 0)
      .sort((a, b) => a.items[0].submittedAt.localeCompare(b.items[0].submittedAt))
      .map(({ user, items }) => ({ ...toPublicUser(user), reviewItems: items }))
  }

  // The waiting item, or an error if it was already decided (or withdrawn by its owner).
  function findWaitingItem(user, kind, itemId) {
    const item = pendingReviewItems(user).find((i) => i.kind === kind && i.id === itemId)
    if (!item) throw new AdminError('This item is no longer waiting for review.')
    return item
  }

  /**
   * @param {string} userId
   * @param {'change' | 'skill' | 'truck'} kind
   * @param {string} itemId  the field name for changes, otherwise the skill or truck id
   * @returns {Promise<Account>}
   */
  async function approveUpdate(userId, kind, itemId) {
    requireAdmin()
    const user = findUser(userId)
    findWaitingItem(user, kind, itemId)

    let changes
    if (kind === REVIEW_ITEM_KINDS.CHANGE) {
      const change = user.pendingChanges.find((c) => c.field === itemId)
      changes = { [itemId]: change.value, pendingChanges: user.pendingChanges.filter((c) => c.field !== itemId) }
      // The marketplace reads shop names from the accounts; keep the admin listings' copy in step.
      if (user.role === ROLES.PARTS_SHOP && itemId === 'name') {
        const data = stores.marketplace.read()
        stores.marketplace.write({
          ...data,
          shops: data.shops.map((shop) => (shop.id === userId ? { ...shop, name: change.value } : shop)),
        })
      }
    } else if (kind === REVIEW_ITEM_KINDS.SKILL) {
      changes = {
        skills: user.skills.map((s) =>
          s.id === itemId ? { ...s, status: REVIEW_STATUS.APPROVED, rejectionReason: null } : s,
        ),
      }
    } else {
      changes = {
        trucks: user.trucks.map((t) =>
          t.id === itemId ? { ...t, reviewStatus: REVIEW_STATUS.APPROVED, rejectionReason: null } : t,
        ),
      }
    }
    updateUser(userId, changes)
    return toPublicUser({ ...user, ...changes })
  }

  /**
   * Rejects one item. A rejected name or license change keeps the approved value; a rejected skill
   * or truck stays off the public profile. The owner sees `reason` on /profile or /tow/trucks.
   * @returns {Promise<Account>}
   */
  async function rejectUpdate(userId, kind, itemId, reason) {
    requireAdmin()
    const user = findUser(userId)
    const item = findWaitingItem(user, kind, itemId)
    if (isBlank(reason)) throw new AdminError(`Write why the ${item.label.toLowerCase()} is rejected.`, 'reason')
    const rejected = { rejectionReason: reason.trim() }

    let changes
    if (kind === REVIEW_ITEM_KINDS.CHANGE) {
      changes = {
        pendingChanges: user.pendingChanges.map((c) =>
          c.field === itemId ? { ...c, ...rejected, status: REVIEW_STATUS.REJECTED } : c,
        ),
      }
    } else if (kind === REVIEW_ITEM_KINDS.SKILL) {
      changes = {
        skills: user.skills.map((s) => (s.id === itemId ? { ...s, ...rejected, status: REVIEW_STATUS.REJECTED } : s)),
      }
    } else {
      changes = {
        trucks: user.trucks.map((t) =>
          t.id === itemId ? { ...t, ...rejected, reviewStatus: REVIEW_STATUS.REJECTED } : t,
        ),
      }
    }
    updateUser(userId, changes)
    return toPublicUser({ ...user, ...changes })
  }

  // --- Users -----------------------------------------------------------------------------------

  /** @returns {Promise<Account[]>} every account, newest first */
  async function getUsers() {
    requireAdmin()
    return [...stores.auth.read().users].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(toPublicUser)
  }

  /** @returns {Promise<Account>} */
  async function getUser(userId) {
    requireAdmin()
    return toPublicUser(findUser(userId))
  }

  /**
   * Suspended accounts can't log in and disappear from public pages (a parts shop's shop page and
   * parts too). Reactivating restores everything. Admin accounts can't be suspended here.
   * @returns {Promise<Account>}
   */
  async function setUserSuspended(userId, suspended, reason = '') {
    const admin = requireAdmin()
    const user = findUser(userId)
    if (user.id === admin.id) throw new AdminError("You can't suspend your own account.")
    if (user.role === ROLES.ADMIN) throw new AdminError("Admin accounts can't be suspended here.")

    const changes = suspended
      ? { suspended: true, suspendedAt: now(), suspensionReason: reason.trim() || null }
      : { suspended: false, suspendedAt: null, suspensionReason: null }
    updateUser(userId, changes)

    if (user.role === ROLES.PARTS_SHOP) {
      const data = stores.marketplace.read()
      stores.marketplace.write({
        ...data,
        shops: data.shops.map((shop) => (shop.id === userId ? { ...shop, suspended: Boolean(suspended) } : shop)),
      })
    }
    return toPublicUser({ ...user, ...changes })
  }

  // --- Tags ------------------------------------------------------------------------------------

  function checkTagFields({ type, name, color }, existingId = null) {
    const trimmed = String(name ?? '').trim()
    if (!trimmed) throw new AdminError('Give the tag a name.', 'name')
    if (trimmed.length > TAG_NAME_MAX_LENGTH) {
      throw new AdminError(`Keep the name under ${TAG_NAME_MAX_LENGTH} characters.`, 'name')
    }
    const duplicate = stores.tags
      .read()
      .tags.some((t) => t.type === type && t.id !== existingId && t.name.toLowerCase() === trimmed.toLowerCase())
    if (duplicate) throw new AdminError(`There is already a tag called "${trimmed}" here.`, 'name')
    if (!TAG_COLORS.some((c) => c.value === color)) throw new AdminError('Choose one of the colors.', 'color')
    return trimmed
  }

  /** @returns {Promise<Array<{ id, type, name, color, usage }>>} usage = how many items have it */
  async function getTags() {
    requireAdmin()
    const { users } = stores.auth.read()
    const { parts } = stores.marketplace.read()
    const usage = (tagId) =>
      users.filter((u) => u.tagIds?.includes(tagId)).length + parts.filter((p) => p.tagIds?.includes(tagId)).length
    return stores.tags.read().tags.map((tag) => ({ ...tag, usage: usage(tag.id) }))
  }

  async function createTag({ type, name, color }) {
    requireAdmin()
    if (!TAG_TYPES.some((t) => t.value === type)) throw new AdminError('Unknown tag type.', 'type')
    const cleanName = checkTagFields({ type, name, color })
    const data = stores.tags.read()
    const tag = { id: nextId(data.tags, 't-'), type, name: cleanName, color }
    stores.tags.write({ ...data, tags: [...data.tags, tag] })
    return { ...tag }
  }

  /** Rename and/or recolor a tag. */
  async function updateTag(tagId, { name, color }) {
    requireAdmin()
    const data = stores.tags.read()
    const tag = data.tags.find((t) => t.id === tagId)
    if (!tag) throw new AdminError('This tag no longer exists.')
    const cleanName = checkTagFields({ type: tag.type, name, color }, tagId)
    const updated = { ...tag, name: cleanName, color }
    stores.tags.write({ ...data, tags: data.tags.map((t) => (t.id === tagId ? updated : t)) })
    return { ...updated }
  }

  /** Deletes the tag and removes it from every part, mechanic and tow company. */
  async function deleteTag(tagId) {
    requireAdmin()
    const without = (item) => (item.tagIds?.includes(tagId) ? { ...item, tagIds: item.tagIds.filter((id) => id !== tagId) } : item)
    const tagsData = stores.tags.read()
    stores.tags.write({ ...tagsData, tags: tagsData.tags.filter((t) => t.id !== tagId) })
    const authData = stores.auth.read()
    stores.auth.write({ ...authData, users: authData.users.map(without) })
    const marketData = stores.marketplace.read()
    stores.marketplace.write({ ...marketData, parts: marketData.parts.map(without) })
  }

  /**
   * Sets the tags of one part, mechanic or tow company. Only tags of the matching type are allowed.
   * @param {'part' | 'mechanic' | 'tow'} targetType
   */
  async function setTags(targetType, targetId, tagIds) {
    requireAdmin()
    const { tags } = stores.tags.read()
    const unique = [...new Set(tagIds)]
    if (unique.some((id) => tags.find((t) => t.id === id)?.type !== targetType)) {
      throw new AdminError('Only tags of the matching type can be assigned here.')
    }
    if (targetType === 'part') {
      findPart(targetId)
      updatePart(targetId, { tagIds: unique })
    } else {
      const user = findUser(targetId)
      const role = targetType === 'mechanic' ? ROLES.MECHANIC : ROLES.TOW
      if (user.role !== role) throw new AdminError('These tags are for a different kind of account.')
      updateUser(targetId, { tagIds: unique })
    }
    return unique
  }

  // --- Listings --------------------------------------------------------------------------------

  const withShop = (part, shops) => {
    const shop = shops.find((s) => s.id === part.shopId)
    return deepCopy({ ...part, shopName: shop?.name ?? part.shopId, shopSuspended: Boolean(shop?.suspended) })
  }

  /** Every part from every shop, including hidden ones, newest first. */
  async function getListings() {
    requireAdmin()
    const { parts, shops } = stores.marketplace.read()
    return [...parts].sort((a, b) => b.addedAt.localeCompare(a.addedAt)).map((part) => withShop(part, shops))
  }

  async function getListing(partId) {
    requireAdmin()
    return withShop(findPart(partId), stores.marketplace.read().shops)
  }

  /** Hides a part from the marketplace. The shop sees the reason on its dashboard. */
  async function hidePart(partId, reason) {
    const admin = requireAdmin()
    findPart(partId)
    if (isBlank(reason)) throw new AdminError('Write why the part is hidden - the shop will see it.', 'reason')
    updatePart(partId, { hidden: { reason: reason.trim(), hiddenAt: now(), hiddenBy: admin.id } })
  }

  async function unhidePart(partId) {
    requireAdmin()
    findPart(partId)
    updatePart(partId, { hidden: null })
  }

  // --- Reviews -----------------------------------------------------------------------------------
  // Reported reviews wait here (/admin/reviews). Hiding a review (with a reason the reviewer sees),
  // unhiding it and dismissing its reports are written to the admin action log.

  /** Every review, hidden ones too, newest first, each with its open reports. */
  async function getReviews() {
    requireAdmin()
    const { reviews, reports } = stores.reviews.read()
    return deepCopy(
      [...reviews]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((review) => ({ ...review, reports: reports.filter((r) => r.reviewId === review.id && r.status === 'open') })),
    )
  }

  /** What admins did to reviews, newest first. */
  async function getReviewActionLog() {
    requireAdmin()
    return deepCopy([...stores.reviews.read().adminLog].reverse())
  }

  // Applies the change to a review, settles its open reports (`reportStatus`) and logs it.
  function changeReview(admin, reviewId, { changes = {}, reportStatus = null, action, reason = '' }) {
    const data = stores.reviews.read()
    const review = data.reviews.find((r) => r.id === reviewId)
    if (!review) throw new AdminError('This review no longer exists.')
    const entry = {
      id: `al-${data.adminLog.length + 1}`,
      at: now(),
      adminId: admin.id,
      adminName: admin.name,
      action,
      reviewId,
      targetName: review.targetName,
      reason,
    }
    stores.reviews.write({
      ...data,
      reviews: data.reviews.map((r) => (r.id === reviewId ? { ...r, ...changes } : r)),
      reports: reportStatus
        ? data.reports.map((r) => (r.reviewId === reviewId && r.status === 'open' ? { ...r, status: reportStatus } : r))
        : data.reports,
      adminLog: [...data.adminLog, entry],
    })
  }

  /** Hides a review from every public page and from the averages. The reviewer sees the reason. */
  async function hideReview(reviewId, reason) {
    const admin = requireAdmin()
    if (isBlank(reason)) throw new AdminError('Write why the review is hidden.', 'reason')
    const text = reason.trim()
    changeReview(admin, reviewId, {
      changes: { hidden: { reason: text, hiddenAt: now(), hiddenBy: admin.id } },
      reportStatus: 'actioned',
      action: 'review_hidden',
      reason: text,
    })
  }

  async function unhideReview(reviewId) {
    const admin = requireAdmin()
    changeReview(admin, reviewId, { changes: { hidden: null }, action: 'review_unhidden' })
  }

  /** The review stays visible; its open reports are closed. */
  async function dismissReports(reviewId) {
    const admin = requireAdmin()
    changeReview(admin, reviewId, { reportStatus: 'dismissed', action: 'reports_dismissed' })
  }

  // --- Requests monitor (read-only) --------------------------------------------------------------

  /** Every request on the platform, newest first. */
  async function getAllRequests() {
    requireAdmin()
    return deepCopy([...stores.requests.read().requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
  }

  // --- Orders ----------------------------------------------------------------------------------

  /** @returns {Promise<import('../marketplace/ordersService.js').Order[]>} every order of every shop, newest first */
  async function getAllOrders() {
    requireAdmin()
    return deepCopy([...stores.orders.read().orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
  }

  /** @returns {Promise<import('../marketplace/ordersService.js').Order | null>} */
  async function getOrder(orderId) {
    requireAdmin()
    const order = stores.orders.read().orders.find((o) => o.id === orderId)
    return order ? deepCopy(order) : null
  }

  /**
   * Cancels an order that has a problem (needs a reason). Stock goes back, a payment is refunded,
   * the buyer and the shop are notified. Completed or already cancelled orders can't be cancelled.
   */
  async function cancelOrder(orderId, reason) {
    requireAdmin()
    if (isBlank(reason)) throw new AdminError('Write the reason for cancelling this order.', 'reason')
    return services.orders.cancelOrderAsAdmin(orderId, reason)
  }

  return {
    getOverview,
    getAllOrders,
    getOrder,
    cancelOrder,
    getPendingAccounts,
    getReviewHistory,
    approveAccount,
    rejectAccount,
    getUpdatesToReview,
    approveUpdate,
    rejectUpdate,
    getUsers,
    getUser,
    setUserSuspended,
    getTags,
    createTag,
    updateTag,
    deleteTag,
    setTags,
    getListings,
    getListing,
    hidePart,
    unhidePart,
    getReviews,
    getReviewActionLog,
    dismissReports,
    hideReview,
    unhideReview,
    getAllRequests,
  }
}
