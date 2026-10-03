// JSDoc type definitions for emergency requests.

/**
 * @typedef {Object} EmergencyOffer  the request, offered to one responder
 * @property {string} responderId
 * @property {'tow' | 'mechanic'} role
 * @property {string} name          company or workshop
 * @property {number} distanceKm    straight-line, from the responder's base
 * @property {number} wave          1 (15 km), 2 (30 km) or 3 (50 km)
 * @property {string} sentAt        ISO date
 * @property {string} expiresAt     ISO date: when the search widens
 * @property {'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired'} status
 */

/**
 * @typedef {Object} EmergencyResponder  who accepted
 * @property {string} id
 * @property {'tow' | 'mechanic'} role
 * @property {string} company
 * @property {string} name          driver or mechanic
 * @property {string} phone
 * @property {{ type: string, plate: string } | null} truck
 * @property {{ lat: number, lng: number }} location   moves while the job is active
 * @property {boolean} simulated    a mock driver
 * @property {boolean} sharing      location sharing is on (until completed or cancelled)
 */

/**
 * @typedef {Object} Emergency
 * @property {string} id
 * @property {'tow' | 'mechanic'} kind
 * @property {'searching' | 'accepted' | 'on_the_way' | 'arrived' | 'completed' | 'cancelled' | 'unavailable'} status
 * @property {string} createdAt
 * @property {string} [acceptedAt]
 * @property {string} [onTheWayAt]
 * @property {string} [arrivedAt]
 * @property {string} [completedAt]
 * @property {string} [cancelledAt]
 * @property {{ userId: string | null, name: string, phone: string }} customer  userId is null for visitors
 * @property {{ lat: number, lng: number }} location   the location the customer confirmed
 * @property {'gps' | 'pin'} locationSource
 * @property {string} landmark
 * @property {{ car: { make: string, model: string, year?: number } | null, carId: string | null, problemType: string, note: string }} details
 * @property {'emergency'} priority
 * @property {number} wave
 * @property {number} radiusKm
 * @property {EmergencyOffer[]} offers
 * @property {EmergencyResponder | null} responder
 * @property {number} [etaMinutes]
 * @property {{ id: string, name: string, phone: string, distanceKm: number }[]} [nearest]  when unavailable
 * @property {{ id: string, senderId: 'customer' | 'responder', text: string, photos: File[], createdAt: string }[]} messages
 */

export {}
