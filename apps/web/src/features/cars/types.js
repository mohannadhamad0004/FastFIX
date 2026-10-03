// JSDoc type definitions for the cars feature.

/**
 * A car registered to a customer's account (/my-cars).
 * @typedef {Object} Car
 * @property {string} id
 * @property {string} ownerId    the customer's account id
 * @property {string} nickname   "Daily driver" ('' when not set)
 * @property {string} make       "Hyundai"
 * @property {string} model      "Accent"
 * @property {number} year       2016
 * @property {number} mileageKm  odometer reading in km
 * @property {string} vin        17 characters, or '' when not given
 * @property {File | null} photo
 * @property {string} createdAt  ISO date
 */

/**
 * One entry of a car's maintenance history: a completed service request for that car.
 * @typedef {import('../requests/types.js').Request} MaintenanceRecord
 */

export {}
