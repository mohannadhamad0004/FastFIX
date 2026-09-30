// JSDoc type definitions for the marketplace feature.

/**
 * @typedef {Object} Shop
 * @property {string} id
 * @property {string} name
 * @property {string} city
 * @property {string} description
 * @property {boolean} [suspended]   the shop's account is suspended: hidden from public pages
 */

/**
 * One car model/year range a part fits. A part can have many, which is how
 * shared parts across models (e.g. Golf, Jetta, Octavia, A3) are represented.
 * @typedef {Object} Fitment
 * @property {string} make
 * @property {string} model
 * @property {number} yearFrom
 * @property {number} yearTo
 */

/**
 * @typedef {Object} Part
 * @property {string} id
 * @property {string} name
 * @property {string} oemNumber            Car maker's part number
 * @property {string} manufacturerNumber   Part maker's own number (Bosch, Mann-Filter, ...)
 * @property {string} brand
 * @property {string} category             One of CATEGORIES in constants.js
 * @property {'oem' | 'aftermarket'} type
 * @property {'new' | 'used' | 'refurbished'} condition
 * @property {number} priceIls
 * @property {number} stock
 * @property {string} shopId
 * @property {string} addedAt              ISO date, used for "Newest" sorting
 * @property {Fitment[]} fitments
 * @property {string[]} [tagIds]           admin-assigned tags ("Best Seller", ...)
 * @property {{ reason: string, hiddenAt: string } | null} [hidden]
 *   set when an admin hides the part; only the owning shop and admins see this field
 */

export {}
