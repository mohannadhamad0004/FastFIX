export const REQUEST_TYPES = Object.freeze({
  SERVICE: 'service', // customer -> mechanic
  TOW: 'tow', // customer -> tow company
  PART_QUESTION: 'part_question', // customer or mechanic -> parts shop
})

// New requests are pending. A tow company that takes a tow request puts one of its trucks on it
// (request.assignedTruckId) and the request is in progress until the job ends. The mechanic, tow
// company or shop marks it completed from the chat, with the final details (request.completion);
// then the customer can review them and gets a report (/reports).
// TODO: accepting requests (tow and mechanic dashboards) is not built yet.
export const REQUEST_STATUS = Object.freeze({ PENDING: 'pending', IN_PROGRESS: 'in_progress', COMPLETED: 'completed' })

// Requests that still need their truck: the truck can't be removed meanwhile.
export const ACTIVE_REQUEST_STATUSES = Object.freeze([REQUEST_STATUS.PENDING, REQUEST_STATUS.IN_PROGRESS])

export const REQUEST_STATUS_BADGES = Object.freeze({
  [REQUEST_STATUS.PENDING]: { label: 'Pending', tone: 'warning' },
  [REQUEST_STATUS.IN_PROGRESS]: { label: 'In progress', tone: 'info' },
  [REQUEST_STATUS.COMPLETED]: { label: 'Completed', tone: 'success' },
})

// Short names for chat lists and reports.
export const REQUEST_TYPE_SHORT = Object.freeze({
  service: 'Service',
  tow: 'Tow',
  part_question: 'Part question',
})

// Request types that end with a printable report on /reports.
export const REPORT_TYPES = Object.freeze(['service', 'tow'])

export const requestStatusBadge = (status) => REQUEST_STATUS_BADGES[status] ?? { label: status, tone: 'neutral' }

// The permission (authorization/permissions.js) needed to send each type.
// Customers have all three; mechanics only part_question.
export const REQUEST_PERMISSIONS = Object.freeze({
  [REQUEST_TYPES.SERVICE]: 'requests:service',
  [REQUEST_TYPES.TOW]: 'requests:tow',
  [REQUEST_TYPES.PART_QUESTION]: 'requests:part_question',
})

export const REQUEST_TYPE_LABELS = Object.freeze({
  [REQUEST_TYPES.SERVICE]: 'Service request',
  [REQUEST_TYPES.TOW]: 'Tow request',
  [REQUEST_TYPES.PART_QUESTION]: 'Question about a part',
})

// The provider's button that ends a request.
export const completeLabel = (request) => (request.type === REQUEST_TYPES.PART_QUESTION ? 'Sale completed' : 'Mark as completed')

// --- Reviews ---------------------------------------------------------------------------------
// The three detailed ratings (1-5) of each kind of provider, in the order of the database columns
// rating_1, rating_2, rating_3.
export const REVIEW_CRITERIA = Object.freeze({
  mechanic: [
    { key: 'quality', label: 'Quality of work' },
    { key: 'price', label: 'Fair price' },
    { key: 'communication', label: 'Communication' },
  ],
  tow: [
    { key: 'arrival', label: 'Arrival time' },
    { key: 'care', label: 'Care of the car' },
    { key: 'professionalism', label: 'Professionalism' },
  ],
  parts_shop: [
    { key: 'match', label: 'Part matched the description' },
    { key: 'price', label: 'Fair price' },
    { key: 'communication', label: 'Communication' },
  ],
})

export const REVIEW_REPORT_REASONS = Object.freeze([
  { value: 'spam', label: 'Spam' },
  { value: 'abusive', label: 'Abusive or insulting' },
  { value: 'fake', label: 'Fake review' },
  { value: 'not_about_provider', label: 'Not about this provider' },
])

export const REVIEW_WINDOW_DAYS = 30 // reviews open when the sender confirms, and close after this
export const EDIT_WINDOW_HOURS = 48 // the reviewer can edit a review, the provider a reply, for this long
export const MIN_REVIEWS_FOR_RATING = 3 // fewer reviews: "New" instead of stars

export const REQUEST_SENT_MESSAGE = 'Request sent. You can chat with them about it in Chats (account menu).'
