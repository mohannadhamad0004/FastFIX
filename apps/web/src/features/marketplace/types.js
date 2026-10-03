// JSDoc type definitions for the marketplace feature.

/**
 * @typedef {Object} Shop
 * @property {string} id
 * @property {string} name
 * @property {string} city
 * @property {string} description
 * @property {string} [address]
 * @property {File | null} [logo]    from the shop's account (/profile)
 * @property {File[]} [photos]       shop photos, from the shop's account
 * @property {boolean} [suspended]   the shop's account is suspended: hidden from public pages
 * @property {import('./shopCommerce.js').SellingSettings | null} [sellingSettings]
 *   from the shop's account (Selling settings on /profile); null until it saves them
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
 * @property {number} stock                on the shelf. Public reads show stock minus reserved
 * @property {number} [reserved]           promised to placed orders the shop has not confirmed; shop and admin only
 * @property {string} shopId
 * @property {string} addedAt              ISO date, used for "Newest" sorting
 * @property {Fitment[]} fitments
 * @property {string} [photoQuery] Pixabay search words for scripts/fetch-images.mjs (default: from the name)
 * @property {string} [updatedAt]          ISO date the price or stock last changed ('Recently updated')
 * @property {number | null} [compareAtPriceIls]  the price before an offer, shown struck through
 * @property {number} [salesCount]         units sold in the last 30 days ('Most popular')
 * @property {boolean} [universalFit]      fits every car (oils, tools, phone holders...): no fitments needed
 * @property {Partial<import('../preview3d/accessoryData.js').AccessoryData>} [accessory]
 *   how it is placed in the 3D preview; worked out from the category and name when missing
 * @property {string[]} [tagIds]           admin-assigned tags ("Best Seller", ...)
 * @property {{ reason: string, hiddenAt: string } | null} [hidden]
 *   set when an admin hides the part; only the owning shop and admins see this field
 */

/**
 * @typedef {Object} SearchHighlight
 * @property {string[]} terms           Lowercase words to highlight in the name, brand, category and fitment
 * @property {('oemNumber' | 'manufacturerNumber')[]} numberFields  Part numbers that matched
 */

/**
 * One result of the server-side part search (GET /api/marketplace/parts).
 * @typedef {Object} PartSearchResult
 * @property {Part} part
 * @property {{ id: string, name: string, city: string }} shop
 * @property {boolean} exact            The whole query is this part's OEM or manufacturer number
 * @property {'exact' | 'all' | 'partial' | null} matchType
 *   null when there is no query; 'partial' results only come when nothing matches every word
 * @property {SearchHighlight | null} highlight
 */

/**
 * @typedef {Object} SearchSuggestion
 * @property {string} label   Closest make or model name, e.g. "Hyundai"
 * @property {string} query   The query with the misspelled word replaced, e.g. "Hyundai accent"
 */

/**
 * @typedef {Object} PartSearchResponse
 * @property {PartSearchResult[]} results   best match first
 * @property {SearchSuggestion | null} suggestion   "Did you mean", when no result matched every word without a typo
 */

export {}
