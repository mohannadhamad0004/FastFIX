// TODO: replace with real API calls
//
// Ratings and reviews of mechanics, parts shops and tow companies. Every function returns a
// Promise. Rules (the api must enforce the same):
//   - Only the sender of a completed request the sender confirmed (request.customerConfirmedAt) can
//     review the mechanic / company / shop it went to: once per request, never themselves. Reviews
//     open when the sender confirms and close 30 days later. A request the sender disputed
//     ("This didn't happen") can't be reviewed.
//   - A review has an overall rating (1-5), three detailed ratings (1-5, see REVIEW_CRITERIA) and an
//     optional comment. The reviewer can edit it for 48 hours; nobody can delete it. Providers can't
//     edit or delete reviews about them.
//   - The reviewed account can post one public reply per review and edit it for 48 hours.
//   - Anyone logged in can report a review; admins hide it with a reason or dismiss the report
//     (features/admin/adminService.js). Hidden reviews don't count in averages and aren't public.
//   - Ratings are never stored on a provider: they are calculated here from the visible reviews.
//
// Mock: reviews and reports live in ReviewsProvider's React state (memory only). The provider also
// passes the raw requests and orders stores, to check that a request is confirmed and whose it is.

import { EDIT_WINDOW_HOURS, REVIEW_CRITERIA, REVIEW_REPORT_REASONS, REVIEW_WINDOW_DAYS } from './constants.js'
import { compareRatings, describeReviewedService, editDeadline, isBefore, reviewDeadline, summarize } from './ratings.js'

/** @typedef {import('./types.js').Review} Review */

export const COMMENT_MAX_LENGTH = 1000
export const REPLY_MAX_LENGTH = 500
export const REPORT_DETAILS_MAX_LENGTH = 500

// Thrown for problems the user can fix. `field` names the form field it belongs to, if any.
export class ReviewError extends Error {
  constructor(message, field = null) {
    super(message)
    this.name = 'ReviewError'
    this.field = field
  }
}

/**
 * Providers with enough reviews first (highest average, then most reviews), the rest after them.
 * @template {{ id: string }} T
 * @param {T[]} items
 * @param {Object<string, { average: number, count: number }>} ratings  from getRatingSummaries
 * @returns {T[]}
 */
export function sortByRating(items, ratings) {
  return [...items].sort((a, b) => compareRatings(ratings[a.id], ratings[b.id]))
}

const copy = (value) => structuredClone(value)
const newestFirst = (a, b) => b.createdAt.localeCompare(a.createdAt)
const isVisible = (review) => !review.hidden
const isStars = (value) => Number.isInteger(value) && value >= 1 && value <= 5

// Public view: the admin's hiding details stay private.
function toPublicReview(review) {
  const result = copy(review)
  delete result.hidden
  return result
}

// The reviewer's own view also says why an admin hid the review.
const toOwnReview = (review) => ({ ...toPublicReview(review), hiddenReason: review.hidden?.reason ?? null })

/**
 * @param {{ read: () => { reviews: Review[], reports: Object[], adminLog: Object[] }, write: (next: Object) => void }} store
 * @param {{ auth: { getCurrentUser: () => Promise<Object | null> }, requests: { read: () => { requests: Object[] } },
 *           orders?: { read: () => { orders: Object[] } } }} deps
 *   the auth service and the raw requests and orders stores
 */
export function createReviewsService(store, { auth, requests, orders }) {
  // What a review is about: a request (r-...) or a parts order (o-..., features/marketplace). A parts
  // order has its own flow: it counts as confirmed when its shop completes it.
  // -> { ownerId, completed, confirmedAt, disputed, target, label } or null.
  function findSubject(id) {
    const order = orders?.read().orders.find((o) => o.id === id)
    if (order) {
      const completedAt = order.timeline?.find((step) => step.status === 'completed')?.at ?? order.createdAt
      return {
        ownerId: order.buyerId,
        completed: order.status === 'completed',
        confirmedAt: order.status === 'completed' ? completedAt : null,
        disputed: false,
        target: { id: order.shopId, type: 'parts_shop', name: order.shopName },
        label: `Part · ${order.items.map((item) => item.name).slice(0, 2).join(', ')}`,
        link: `/orders/${order.id}`,
      }
    }
    const request = requests.read().requests.find((r) => r.id === id)
    if (!request) return null
    return {
      ownerId: request.sender.id,
      completed: request.status === 'completed',
      confirmedAt: request.customerConfirmedAt ?? null,
      disputed: Boolean(request.disputedAt),
      target: request.target,
      label: describeReviewedService(request),
      link: `/chats/${request.id}`,
    }
  }

  const reviewOf = (subjectId, userId) => store.read().reviews.find((r) => r.requestId === subjectId && r.customerId === userId)

  // Can `user` review this subject now? { state, ... } - the same check createReview enforces.
  function statusFor(user, subjectId) {
    const subject = findSubject(subjectId)
    if (!user || !subject || subject.ownerId !== user.id || subject.target.id === user.id) return { state: 'none' }
    const mine = reviewOf(subjectId, user.id)
    if (mine) return { state: 'reviewed', targetType: mine.targetType, review: toOwnReview(mine), editUntil: editDeadline(mine.createdAt), canEdit: isBefore(editDeadline(mine.createdAt)) }
    if (!subject.completed || subject.disputed) return { state: 'none' }
    if (!subject.confirmedAt) return { state: 'unconfirmed' }
    const closesAt = reviewDeadline(subject.confirmedAt)
    return isBefore(closesAt) ? { state: 'open', closesAt, targetType: subject.target.type, subject } : { state: 'closed', closesAt }
  }

  function cleanEntry(type, { rating, aspects = {}, comment = '' }) {
    if (!isStars(Number(rating))) throw new ReviewError('Choose 1 to 5 stars.', 'rating')
    const cleanAspects = {}
    for (const { key, label } of REVIEW_CRITERIA[type]) {
      if (!isStars(Number(aspects[key]))) throw new ReviewError(`Rate "${label}" from 1 to 5.`, `aspects.${key}`)
      cleanAspects[key] = Number(aspects[key])
    }
    const text = String(comment ?? '').trim()
    if (text.length > COMMENT_MAX_LENGTH) throw new ReviewError(`Keep your comment under ${COMMENT_MAX_LENGTH} characters.`, 'comment')
    return { rating: Number(rating), aspects: cleanAspects, comment: text }
  }

  function saveReview(updated) {
    const current = store.read()
    store.write({ ...current, reviews: current.reviews.map((r) => (r.id === updated.id ? updated : r)) })
    return updated
  }

  /** Visible reviews of one mechanic, tow company or shop, newest first. @returns {Promise<Review[]>} */
  async function getReviewsFor(targetId) {
    return store
      .read()
      .reviews.filter((r) => r.targetId === targetId && isVisible(r))
      .sort(newestFirst)
      .map(toPublicReview)
  }

  /**
   * Calculated from the visible reviews: per mechanic / company / shop id { average, count,
   * distribution, aspects } (see ratings.js summarize). Ids without reviews are left out.
   * @returns {Promise<Object<string, ReturnType<typeof summarize>>>}
   */
  async function getRatingSummaries() {
    const byTarget = {}
    for (const review of store.read().reviews.filter(isVisible)) (byTarget[review.targetId] ??= []).push(review)
    return Object.fromEntries(Object.entries(byTarget).map(([id, list]) => [id, summarize(list)]))
  }

  /**
   * Whether the logged-in user can review a request or order, or what they already wrote.
   * state: 'open' (can review until closesAt) | 'reviewed' (review, canEdit) | 'closed' | 'unconfirmed'
   * (the sender hasn't confirmed completion yet) | 'none' (not theirs, not completed, disputed...)
   */
  async function getReviewStatus(subjectId) {
    const status = statusFor(await auth.getCurrentUser(), subjectId)
    delete status.subject
    return status
  }

  /** Ids of the requests the logged-in user already reviewed. @returns {Promise<string[]>} */
  async function getMyReviewedRequestIds() {
    const user = await auth.getCurrentUser()
    if (!user) return []
    return store.read().reviews.filter((r) => r.customerId === user.id).map((r) => r.requestId)
  }

  /**
   * "Rate your experience" prompts: confirmed requests and completed orders of the logged-in user
   * that still have no review and whose 30 days are not over. Newest first.
   * @returns {Promise<{ id: string, targetName: string, label: string, closesAt: string, link: string }[]>}
   */
  async function getReviewPrompts() {
    const user = await auth.getCurrentUser()
    if (!user) return []
    const ids = [
      ...requests.read().requests.filter((r) => r.sender.id === user.id).map((r) => r.id),
      ...(orders?.read().orders.filter((o) => o.buyerId === user.id).map((o) => o.id) ?? []),
    ]
    return ids
      .map((id) => ({ id, status: statusFor(user, id) }))
      .filter(({ status }) => status.state === 'open')
      .map(({ id, status }) => ({
        id,
        targetName: status.subject.target.name,
        label: status.subject.label,
        confirmedAt: status.subject.confirmedAt,
        closesAt: status.closesAt,
        link: status.subject.link,
      }))
      .sort((a, b) => b.confirmedAt.localeCompare(a.confirmedAt))
  }

  /**
   * @param {string} requestId  a confirmed request the logged-in user sent, or their completed order
   * @param {{ rating: number, aspects: Object<string, number>, comment?: string }} entry
   *   overall 1-5 stars, the three detailed ratings by key (REVIEW_CRITERIA), optional comment
   * @returns {Promise<Review>}
   */
  async function createReview(requestId, entry) {
    const user = await auth.getCurrentUser()
    const subject = findSubject(requestId)
    if (!user || !subject || subject.ownerId !== user.id) throw new ReviewError('Only the sender of this request can review it.')
    if (subject.target.id === user.id) throw new ReviewError("You can't review yourself.")
    if (reviewOf(requestId, user.id)) throw new ReviewError('You already reviewed this request.')
    if (!subject.completed) throw new ReviewError('You can leave a review once the request is completed.')
    if (subject.disputed) throw new ReviewError("You said this request didn't happen, so it can't be reviewed.")
    if (!subject.confirmedAt) throw new ReviewError('Confirm that the request was completed first.')
    if (!isBefore(reviewDeadline(subject.confirmedAt))) {
      throw new ReviewError(`Reviews close ${REVIEW_WINDOW_DAYS} days after you confirm completion.`)
    }
    const clean = cleanEntry(subject.target.type, entry)

    const current = store.read()
    const number = current.reviews.reduce((max, r) => Math.max(max, Number(r.id.slice(3)) || 0), 0) + 1
    const review = {
      id: `rv-${number}`,
      requestId,
      targetId: subject.target.id,
      targetType: subject.target.type,
      targetName: subject.target.name,
      customerId: user.id,
      customerName: user.name,
      ...clean,
      serviceLabel: subject.label,
      createdAt: new Date().toISOString(),
      editedAt: null,
      reply: null,
      hidden: null,
    }
    store.write({ ...current, reviews: [...current.reviews, review] })
    return toOwnReview(review)
  }

  /** The reviewer edits their review, within 48 hours of writing it. @returns {Promise<Review>} */
  async function updateReview(reviewId, entry) {
    const user = await auth.getCurrentUser()
    const review = store.read().reviews.find((r) => r.id === reviewId)
    if (!review || !user || review.customerId !== user.id) throw new ReviewError('Only the author can edit a review.')
    if (!isBefore(editDeadline(review.createdAt))) throw new ReviewError(`Reviews can only be edited for ${EDIT_WINDOW_HOURS} hours.`)
    return toOwnReview(saveReview({ ...review, ...cleanEntry(review.targetType, entry), editedAt: new Date().toISOString() }))
  }

  function cleanReply(text) {
    const reply = String(text ?? '').trim()
    if (!reply) throw new ReviewError('Write your reply.', 'reply')
    if (reply.length > REPLY_MAX_LENGTH) throw new ReviewError(`Keep your reply under ${REPLY_MAX_LENGTH} characters.`, 'reply')
    return reply
  }

  /** One public reply per review, by the mechanic / company / shop that was reviewed. @returns {Promise<Review>} */
  async function replyToReview(reviewId, text) {
    const user = await auth.getCurrentUser()
    const review = store.read().reviews.find((r) => r.id === reviewId)
    if (!review || !user || review.targetId !== user.id) throw new ReviewError('Only the reviewed account can reply.')
    if (review.reply) throw new ReviewError('You already replied to this review.')
    const reply = cleanReply(text)
    return toPublicReview(saveReview({ ...review, reply: { text: reply, createdAt: new Date().toISOString(), editedAt: null } }))
  }

  /** The provider edits its reply, within 48 hours of posting it. @returns {Promise<Review>} */
  async function editReply(reviewId, text) {
    const user = await auth.getCurrentUser()
    const review = store.read().reviews.find((r) => r.id === reviewId)
    if (!review?.reply || !user || review.targetId !== user.id) throw new ReviewError('Only the reviewed account can edit its reply.')
    if (!isBefore(editDeadline(review.reply.createdAt))) throw new ReviewError(`Replies can only be edited for ${EDIT_WINDOW_HOURS} hours.`)
    const reply = cleanReply(text)
    return toPublicReview(saveReview({ ...review, reply: { ...review.reply, text: reply, editedAt: new Date().toISOString() } }))
  }

  /**
   * Anyone logged in can report a review to the admins (once each).
   * @param {{ reason: 'spam' | 'abusive' | 'fake' | 'not_about_provider', details?: string }} report
   * @returns {Promise<void>}
   */
  async function reportReview(reviewId, { reason, details = '' }) {
    const user = await auth.getCurrentUser()
    const current = store.read()
    if (!user) throw new ReviewError('Log in to report a review.')
    if (!current.reviews.some((r) => r.id === reviewId && isVisible(r))) throw new ReviewError('This review no longer exists.')
    if (!REVIEW_REPORT_REASONS.some((r) => r.value === reason)) throw new ReviewError('Choose why you are reporting this review.', 'reason')
    const text = String(details ?? '').trim()
    if (text.length > REPORT_DETAILS_MAX_LENGTH) throw new ReviewError(`Keep the details under ${REPORT_DETAILS_MAX_LENGTH} characters.`, 'details')
    if (current.reports.some((r) => r.reviewId === reviewId && r.reporterId === user.id)) {
      throw new ReviewError('You already reported this review.')
    }
    const number = current.reports.reduce((max, r) => Math.max(max, Number(r.id.slice(3)) || 0), 0) + 1
    const report = { id: `rr-${number}`, reviewId, reporterId: user.id, reporterName: user.name, reason, details: text, status: 'open', createdAt: new Date().toISOString() }
    store.write({ ...current, reports: [...current.reports, report] })
  }

  /** Ids of the reviews the logged-in user already reported. @returns {Promise<string[]>} */
  async function getMyReportedReviewIds() {
    const user = await auth.getCurrentUser()
    return user ? store.read().reports.filter((r) => r.reporterId === user.id).map((r) => r.reviewId) : []
  }

  return {
    getReviewsFor,
    getRatingSummaries,
    getReviewStatus,
    getMyReviewedRequestIds,
    getReviewPrompts,
    createReview,
    updateReview,
    replyToReview,
    editReply,
    reportReview,
    getMyReportedReviewIds,
  }
}
