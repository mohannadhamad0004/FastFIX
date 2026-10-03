// Quick check of the review rules and calculated ratings: node src/features/requests/reviews.check.mjs
import assert from 'node:assert/strict'
import { seedRequests } from './mockRequests.js'
import { seedReviewReports, seedReviews } from './mockReviews.js'
import { compareRatings, hasRating } from './ratings.js'
import { createReviewsService, ReviewError } from './reviewsService.js'

let reviewData = { reviews: structuredClone(seedReviews), reports: structuredClone(seedReviewReports), adminLog: [] }
let requestData = { requests: structuredClone(seedRequests) }
const reviewStore = { read: () => reviewData, write: (next) => (reviewData = next) }
const requestStore = { read: () => requestData, write: (next) => (requestData = next) }
let me = { id: 'u-2', role: 'customer', name: 'Layla Customer' }
const service = createReviewsService(reviewStore, { auth: { getCurrentUser: async () => me }, requests: requestStore })
const fails = (promise, pattern) => assert.rejects(promise, (e) => e instanceof ReviewError && pattern.test(e.message))
const entry = { rating: 5, aspects: { quality: 5, price: 4, communication: 5 }, comment: 'Great' }

// Ratings are calculated from visible reviews: Kareem 5+5+4 = 4.7 of 3; FastLane's hidden review doesn't count.
const sums = await service.getRatingSummaries()
assert.deepEqual([sums['u-10'].average, sums['u-10'].count], [4.7, 3])
assert.equal(sums['u-11'].count, 2)
assert.deepEqual(sums['u-10'].distribution, [2, 1, 0, 0, 0])
assert.ok(hasRating(sums['u-10']) && !hasRating(sums['u-11']) && !hasRating(undefined))
assert.ok(compareRatings(sums['u-10'], sums['u-11']) < 0, 'rated before "New"')
assert.ok(compareRatings(sums['u-11'], sums['u-12']) < 0, 'among "New", more reviews first')

// r-8 (part question): completed by the shop but not confirmed -> no review yet
assert.equal((await service.getReviewStatus('r-8')).state, 'unconfirmed')
await fails(service.createReview('r-8', entry), /Confirm/)
requestData = { requests: requestData.requests.map((r) => (r.id === 'r-8' ? { ...r, customerConfirmedAt: new Date().toISOString() } : r)) }
assert.equal((await service.getReviewStatus('r-8')).state, 'open')
assert.ok((await service.getReviewPrompts()).some((p) => p.id === 'r-6'), 'r-6 is waiting for a review')

// r-6 (mechanic): incomplete ratings are refused; a valid one is stored with its service label
await fails(service.createReview('r-6', { ...entry, aspects: { quality: 5 } }), /Fair price/)
await fails(service.createReview('r-6', { ...entry, comment: 'x'.repeat(1001) }), /1000/)
const review = await service.createReview('r-6', entry)
assert.equal(review.serviceLabel, 'Workshop visit · Transmission')
await fails(service.createReview('r-6', entry), /already/)
assert.equal((await service.getRatingSummaries())['u-15'].count, 2)

// Edit within 48 hours, locked afterwards; others can't edit
assert.equal((await service.updateReview(review.id, { ...entry, rating: 4 })).rating, 4)
me = { id: 'u-10', role: 'mechanic', name: 'Kareem Haddad' }
await fails(service.updateReview(review.id, entry), /author/)
reviewData = { ...reviewData, reviews: reviewData.reviews.map((r) => (r.id === review.id ? { ...r, createdAt: new Date(Date.now() - 49 * 36e5).toISOString() } : r)) }
me = { id: 'u-2', role: 'customer', name: 'Layla Customer' }
await fails(service.updateReview(review.id, entry), /48 hours/)

// The reviewed provider replies once and can't review itself
me = { id: 'u-15', role: 'mechanic', name: 'Tulkarm' }
await service.replyToReview(review.id, 'Thanks!')
await fails(service.replyToReview(review.id, 'Again'), /already/)
assert.equal((await service.editReply(review.id, 'Thanks a lot')).reply.text, 'Thanks a lot')
await fails(service.createReview('r-6', entry), /Only the sender/)

// Anyone logged in can report, once
me = { id: 'u-30', role: 'tow', name: 'Nablus Rescue Towing' }
await service.reportReview(review.id, { reason: 'fake' })
await fails(service.reportReview(review.id, { reason: 'fake' }), /already/)
await fails(service.reportReview(review.id, { reason: 'nope' }), /Choose why/)

// Reviews close 30 days after confirmation; a disputed request can't be reviewed
me = { id: 'u-2', role: 'customer', name: 'Layla Customer' }
requestData = {
  requests: requestData.requests.map((r) =>
    r.id === 'r-8' ? { ...r, customerConfirmedAt: new Date(Date.now() - 31 * 864e5).toISOString() } : r,
  ),
}
await fails(service.createReview('r-8', { ...entry, aspects: { match: 5, price: 5, communication: 5 } }), /30 days/)
requestData = { requests: requestData.requests.map((r) => (r.id === 'r-8' ? { ...r, customerConfirmedAt: null, disputedAt: 'x' } : r)) }
assert.equal((await service.getReviewStatus('r-8')).state, 'none')

console.log('reviews check passed')
