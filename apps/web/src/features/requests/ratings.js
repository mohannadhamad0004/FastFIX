// Ratings are always calculated from review records, never stored on a provider.
// Pure functions, used by reviewsService and the directories' "sort by rating".

import { SERVICE_MODES } from '../../auth/signup/constants.js'
import { EDIT_WINDOW_HOURS, MIN_REVIEWS_FOR_RATING, REVIEW_CRITERIA, REVIEW_WINDOW_DAYS } from './constants.js'

const HOUR = 60 * 60 * 1000
const round1 = (value) => Math.round(value * 10) / 10

export const reviewDeadline = (confirmedAt) => new Date(new Date(confirmedAt).getTime() + REVIEW_WINDOW_DAYS * 24 * HOUR).toISOString()
export const editDeadline = (createdAt) => new Date(new Date(createdAt).getTime() + EDIT_WINDOW_HOURS * HOUR).toISOString()
export const isBefore = (deadlineIso, at = new Date()) => at < new Date(deadlineIso)

/** True when there are enough reviews to show stars (otherwise the provider is "New"). */
export const hasRating = (summary) => (summary?.count ?? 0) >= MIN_REVIEWS_FOR_RATING

/**
 * Average, count, 5->1 distribution and the average of each detailed rating of one provider's reviews.
 * Pass visible (not hidden) reviews only. @returns {{ average: number, count: number, distribution: number[],
 * aspects: Object<string, number> }} distribution[0] is the number of 5-star reviews, [4] of 1-star
 */
export function summarize(reviews) {
  const count = reviews.length
  const distribution = [5, 4, 3, 2, 1].map((stars) => reviews.filter((r) => r.rating === stars).length)
  const keys = REVIEW_CRITERIA[reviews[0]?.targetType]?.map((c) => c.key) ?? []
  const aspects = Object.fromEntries(
    keys.map((key) => [key, round1(reviews.reduce((sum, r) => sum + (r.aspects?.[key] ?? 0), 0) / count)]),
  )
  return { average: round1(reviews.reduce((sum, r) => sum + r.rating, 0) / count), count, distribution, aspects }
}

/**
 * Sort comparator for summaries (or undefined): providers with enough reviews first, highest average
 * first, then more reviews; providers under the minimum after them, most reviews first.
 */
export function compareRatings(a, b) {
  const ratedA = hasRating(a)
  if (ratedA !== hasRating(b)) return ratedA ? -1 : 1
  return (ratedA ? b.average - a.average : 0) || (b?.count ?? 0) - (a?.count ?? 0)
}

const shortPlace = (text) => String(text ?? '').split(',')[0].trim()

/** The type of service a review is about: "Workshop visit · Brakes", "Tow · Nablus → Ramallah", "Part · Brake pads". */
export function describeReviewedService(request) {
  const { details } = request
  if (request.type === 'tow') return `Tow · ${shortPlace(details.pickup)} → ${shortPlace(details.destination)}`
  if (request.type === 'part_question') return `Part · ${request.target.partName ?? 'Parts'}`
  const mode = SERVICE_MODES.find((m) => m.value === details.mode)?.label ?? 'Service'
  const topic = details.diagnosis?.suggestedSkill ?? details.topic
  return topic ? `${mode} · ${topic}` : mode
}
