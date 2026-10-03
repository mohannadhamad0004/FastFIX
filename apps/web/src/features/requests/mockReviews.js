// TODO: replace with real API call
// Reviews that exist when the app starts, and the completed + confirmed requests they belong to
// (`seedReviewRequests`, added to the request list by mockRequests.js). Nothing here is a typed-in
// rating: every average on the site is calculated from these records by reviewsService.js.
//
// Two reviews are from the test customer (u-2) on its requests r-5 and r-7 (mockRequests.js); the
// others are from earlier customers whose requests are generated below. One review is hidden by an
// admin and one is reported by its provider, to try /admin/reviews. Tulkarm Transmission Works
// (mechanic@) has a review without a reply, to try replying. Review counts per provider range from 0
// to 3, to see the "New" badge (under 3 reviews) and stars (3 or more).

import { REVIEW_CRITERIA } from './constants.js'
import { describeReviewedService } from './ratings.js'

const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

const kareem = { id: 'u-10', type: 'mechanic', name: 'Kareem Auto Repair' }
const fastLane = { id: 'u-11', type: 'mechanic', name: 'FastLane Garage' }
const jenin = { id: 'u-12', type: 'mechanic', name: 'Jenin Electric Auto' }
const greenDrive = { id: 'u-14', type: 'mechanic', name: 'Green Drive Hybrid Center' }
const tulkarm = { id: 'u-15', type: 'mechanic', name: 'Tulkarm Transmission Works' }
const nablusTow = { id: 'u-30', type: 'tow', name: 'Nablus Rescue Towing' }
const albireh = { id: 'u-31', type: 'tow', name: 'Al-Bireh Road Assist' }
const jeninTow = { id: 'u-33', type: 'tow', name: 'Jenin Valley Tow' }
const part = (partName) => ({ partName })
const alquds = { id: 'alquds-auto-parts', type: 'parts_shop', name: 'Al-Quds Auto Parts' }
const ramallah = { id: 'ramallah-motors-supply', type: 'parts_shop', name: 'Ramallah Motors Supply' }
const hebron = { id: 'hebron-genuine-parts', type: 'parts_shop', name: 'Hebron Genuine Parts' }

const corolla = { make: 'Toyota', model: 'Corolla', year: 2014 }

// One row per review. `a` = the three detailed ratings in REVIEW_CRITERIA order. `topic` / `route` /
// `partName` say what the request was about. A row with `requestId` belongs to an existing request.
const rows = [
  { target: kareem, requestId: 'r-5', customerId: 'u-2', who: 'Layla Customer', label: 'Workshop visit · Engine', rating: 5, a: [5, 5, 5], days: 19,
    comment: 'Found the squeal right away, fair price, and the car was ready the same afternoon.',
    reply: 'Thank you Layla! Come back any time for the next service.' },
  { target: kareem, who: 'Ahmad K.', topic: 'Transmission', rating: 5, a: [5, 4, 5], days: 40, comment: 'Honest work on my gearbox. Explained everything.' },
  { target: kareem, who: 'Mona S.', topic: 'Engine', rating: 4, a: [4, 4, 3], days: 55, comment: 'Good repair, but I waited an hour past the booked time.',
    reported: { by: 'u-10', byName: 'Kareem Haddad', reason: 'not_about_provider', details: 'I was never late: this customer booked another workshop that day.' } },
  { target: fastLane, who: 'Yazan R.', topic: 'Brakes', rating: 4, a: [4, 5, 4], days: 15, comment: 'Quick brake job and clear prices.' },
  { target: fastLane, who: 'Rana T.', topic: 'Brakes', rating: 5, a: [5, 5, 5], days: 33, comment: 'Answered my questions in chat before I even came in.' },
  { target: fastLane, who: 'Unknown user', topic: 'Tires', rating: 1, a: [1, 1, 1], days: 8, comment: 'Visit my page for cheap tires!!! www.example.com',
    hidden: { reason: 'Advertising, not a real review.', hiddenAt: daysAgo(7), hiddenBy: 'u-1' } },
  { target: jenin, who: 'Omar B.', topic: 'Electrical', rating: 3, a: [3, 4, 3], days: 26, comment: 'Fixed the wiring, but it took two visits.' },
  { target: greenDrive, who: 'Sara H.', topic: 'Hybrid', rating: 5, a: [5, 5, 5], days: 12, comment: 'The only hybrid specialists I trust with my Prius.' },
  { target: tulkarm, who: 'Fadi N.', topic: 'Clutch', rating: 4, a: [5, 3, 4], days: 30, comment: 'Clutch feels like new. A bit expensive.' },
  { target: nablusTow, requestId: 'r-7', customerId: 'u-2', who: 'Layla Customer', label: 'Tow · Huwwara checkpoint road → Kareem Auto Repair', rating: 4, a: [4, 5, 4], days: 11,
    comment: 'Came in 25 minutes and was careful with the car.' },
  { target: nablusTow, who: 'Hani A.', route: ['Highway 60', 'Nablus'], rating: 5, a: [5, 5, 5], days: 48, comment: 'Picked me up at 2 am on the highway. Lifesavers.' },
  { target: nablusTow, who: 'Samer D.', route: ['Beita', 'Nablus'], rating: 5, a: [4, 5, 5], days: 62, comment: 'Polite driver and the car arrived without a scratch.' },
  { target: albireh, who: 'Dina M.', route: ['Al-Bireh', 'Jericho'], rating: 5, a: [5, 5, 5], days: 20, comment: 'Towed our van to Jericho without any problem.' },
  { target: albireh, who: 'Khaled J.', route: ['Ramallah', 'Al-Bireh'], rating: 3, a: [2, 4, 4], days: 44, comment: 'Took long to arrive, but the driver was kind.' },
  { target: jeninTow, who: 'Nadia F.', route: ['Jenin', 'Jenin'], rating: 4, a: [4, 4, 4], days: 17, comment: 'Fair fixed price inside Jenin.' },
  { target: alquds, who: 'Sami O.', ...part('Bosch brake disc'), rating: 5, a: [5, 5, 5], days: 14, comment: 'Had the exact Bosch disc in stock.', reply: 'Glad we could help, see you next time.' },
  { target: alquds, who: 'Lina M.', ...part('Brake pads'), rating: 4, a: [4, 5, 4], days: 37, comment: 'Good prices, parking is hard.' },
  { target: alquds, who: 'Maha Q.', ...part('Oil filter'), rating: 5, a: [5, 4, 5], days: 52, comment: 'Quick answers about which filter fits my Kia.' },
  { target: ramallah, who: 'Tariq H.', ...part('Gates timing belt'), rating: 4, a: [5, 4, 3], days: 22, comment: 'Original Gates belt, delivered next day.' },
  { target: hebron, who: 'Rami A.', ...part('VW air filter'), rating: 5, a: [5, 5, 5], days: 9, comment: 'Genuine VW parts with the invoice.' },
]

function requestFor(row, n) {
  const { target, days } = row
  const sender = { id: `c-old-${n}`, role: 'customer', name: row.who }
  const base = {
    id: `r-old-${n}`,
    status: 'completed',
    createdAt: daysAgo(days + 4),
    sender,
    target: { ...target, ...(target.type === 'parts_shop' && { partName: row.partName }) },
    customerConfirmedAt: daysAgo(days + 0.5),
  }
  const completedAt = daysAgo(days + 2)
  if (target.type === 'tow') {
    const [pickup, destination] = row.route
    return { ...base, type: 'tow', arrivedAt: daysAgo(days + 3), details: { pickup, destination, car: corolla, note: '' }, completion: { completedAt, totalIls: 180 } }
  }
  if (target.type === 'parts_shop') {
    return {
      ...base,
      type: 'part_question',
      details: { partId: null, message: `Do you have ${row.partName} in stock?`, quantity: 1 },
      completion: { completedAt, note: 'Picked up at the shop.', totalIls: 120 },
    }
  }
  return {
    ...base,
    type: 'service',
    details: { mode: 'workshop', preferredAt: daysAgo(days + 3).slice(0, 16), car: corolla, problem: `${row.topic} problem.`, media: [], topic: row.topic },
    completion: { completedAt, confirmedDiagnosis: `${row.topic} fault.`, workDone: 'Repaired and road tested.', partsUsed: [], laborIls: 200, totalIls: 200 },
  }
}

const generated = rows.map((row, i) => ({ row, n: i + 1, request: row.requestId ? null : requestFor(row, i + 1) }))

/** Completed + confirmed requests of earlier customers (r-5 and r-7 live in mockRequests.js). */
export const seedReviewRequests = generated.flatMap(({ request }) => (request ? [request] : []))

export const seedReviews = generated.map(({ row, n, request }) => ({
  id: `rv-${n}`,
  requestId: row.requestId ?? request.id,
  targetId: row.target.id,
  targetType: row.target.type,
  targetName: row.target.name,
  customerId: row.customerId ?? `c-old-${n}`,
  customerName: row.who,
  rating: row.rating,
  aspects: Object.fromEntries(REVIEW_CRITERIA[row.target.type].map((c, i) => [c.key, row.a[i]])),
  comment: row.comment,
  serviceLabel: row.label ?? describeReviewedService(request),
  createdAt: daysAgo(row.days),
  editedAt: null,
  reply: row.reply ? { text: row.reply, createdAt: daysAgo(row.days - 1), editedAt: null } : null,
  hidden: row.hidden ?? null,
}))

export const seedReviewReports = generated.flatMap(({ row, n }) =>
  row.reported
    ? [{
        id: `rr-${n}`,
        reviewId: `rv-${n}`,
        reporterId: row.reported.by,
        reporterName: row.reported.byName,
        reason: row.reported.reason,
        details: row.reported.details,
        status: 'open',
        createdAt: daysAgo(2),
      }]
    : [],
)
