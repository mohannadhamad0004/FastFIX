import { serviceModeLabel } from '../../auth/signup/constants.js'
import { ROLES } from '../../authorization/roles.js'
import { formatCar } from './carDetails.js'
import { REQUEST_TYPES } from './constants.js'

// ISO date (or "2026-10-06T09:30") -> "6 Oct 2026, 09:30"
export const formatDateTime = (value) =>
  new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

// A workshop visit's preferred time, "2026-10-06T09:30" -> "6 Oct 2026, 09:30"
export const formatPreferredTime = formatDateTime

// "Workshop visit, 6 Oct 2026, 09:30" / "On-site at Rafidia Street" / "Online consultation"
export function describeServiceMode({ mode, location, preferredAt }) {
  if (mode === 'on_site' && location) return `${serviceModeLabel(mode)} at ${location}`
  if (mode === 'workshop' && preferredAt) return `${serviceModeLabel(mode)}, ${formatPreferredTime(preferredAt)}`
  return mode ? serviceModeLabel(mode) : ''
}

// Public page of a request's target (mechanic, tow company or shop).
export const TARGET_PATHS = Object.freeze({
  [ROLES.MECHANIC]: (id) => `/mechanics/${id}`,
  [ROLES.TOW]: (id) => `/tow-companies/${id}`,
  [ROLES.PARTS_SHOP]: (id) => `/shops/${id}`,
})

// One line describing what was asked.
export function summarizeRequest(request) {
  const { details } = request
  if (request.type === REQUEST_TYPES.SERVICE) {
    const subject = [describeServiceMode(details), details.car && formatCar(details.car)].filter(Boolean).join(' · ')
    return subject ? `${subject}: ${details.problem}` : details.problem
  }
  if (request.type === REQUEST_TYPES.TOW) return `${details.pickup} → ${details.destination} (${formatCar(details.car)})`
  return `${request.target.partName} × ${details.quantity}: ${details.message}`
}
