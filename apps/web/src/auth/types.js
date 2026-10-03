// JSDoc type definitions for accounts. Role-specific fields are only present for that role.

/** @typedef {'customer' | 'mechanic' | 'parts_shop' | 'tow' | 'admin'} Role */
/** @typedef {'pending' | 'approved' | 'rejected'} AccountStatus */

/**
 * A mechanic skill with its proof.
 * @typedef {Object} Skill
 * @property {string} id
 * @property {string} skill        one of SKILLS in signup/constants.js
 * @property {number} years        years of experience
 * @property {File} certificate    PDF, JPG or PNG
 * @property {'pending' | 'approved' | 'rejected'} status  each skill is reviewed on its own;
 *                                 only approved skills are public. A new skill or a new
 *                                 certificate starts as pending.
 * @property {string | null} [rejectionReason]  the admin's reason, shown to the mechanic
 * @property {string} [submittedAt]  ISO date the skill or its latest certificate was sent for review
 */

/**
 * A change to a reviewed profile field (REVIEWED_FIELDS in constants.js) waiting for an admin.
 * The account keeps its approved value, which stays public, until the change is approved.
 * @typedef {Object} PendingChange
 * @property {'name' | 'workshopName' | 'businessLicense'} field
 * @property {string | File} value     the new name, or the new license file
 * @property {'pending' | 'rejected'} status  approved changes are applied and removed
 * @property {string} submittedAt      ISO date
 * @property {string | null} rejectionReason
 */

/**
 * @typedef {Object} NotificationPrefs   email on/off per type (NOTIFICATION_TYPES in constants.js)
 * @property {boolean} requestUpdates
 * @property {boolean} chatMessages
 * @property {boolean} accountUpdates
 */

/**
 * How an admin checked an account before approving or rejecting it.
 * @typedef {Object} Verification
 * @property {'documents' | 'phone' | 'video' | 'in_person' | null} method  required to approve
 * @property {string} note          optional admin note
 * @property {string} reviewedBy    admin user id
 */

/**
 * A tow company truck.
 * @typedef {Object} Truck
 * @property {string} id
 * @property {string} plateNumber
 * @property {'flatbed' | 'wheel_lift' | 'other'} type
 * @property {number} maxWeightKg  heaviest vehicle it can carry
 * @property {File[]} photos
 * @property {File} registration
 * @property {File} insurance
 * @property {'available' | 'en_route' | 'busy' | 'out_of_service'} status  set by the company
 * @property {'pending' | 'approved' | 'rejected'} reviewStatus  only approved trucks are public. A new
 *                                 truck, or a new plate, type, weight or document, starts as pending.
 * @property {string | null} rejectionReason
 * @property {string} submittedAt  ISO date it was last sent for review
 */

/**
 * An account as the auth service returns it (never includes the password).
 * Files are File objects kept in memory until real uploads exist.
 * @typedef {Object} Account
 * @property {string} id
 * @property {Role} role
 * @property {AccountStatus} status
 * @property {string | null} rejectionReason  set when an admin rejects the account
 * @property {string} createdAt                ISO date
 * @property {string | null} reviewedAt        ISO date of the admin's decision
 * @property {Verification | null} verification how the admin checked the account
 * @property {boolean} suspended                suspended accounts can't log in and aren't public
 * @property {string | null} suspendedAt
 * @property {string | null} suspensionReason
 * @property {string[]} tagIds                  admin-assigned tags (mechanic, tow)
 * @property {string} name                     person's name, or company name for parts_shop and tow
 * @property {string} email
 * @property {string} phone
 * @property {File | null} profilePhoto        profile photo, or logo for parts_shop and tow
 * @property {NotificationPrefs} notificationPrefs
 * @property {string | null} sessionsRevokedAt  last "Log out of all devices"
 * @property {string} [city]                   mechanic, parts_shop, tow (optional for customers)
 * @property {string} [address]                workshop / shop / company address
 * @property {string} [workshopName]           mechanic
 * @property {Skill[]} [skills]                mechanic
 * @property {File[]} [workshopPhotos]         mechanic
 * @property {('on_site' | 'workshop' | 'online')[]} [serviceModes]  mechanic - at least one
 * @property {string[]} [onSiteCities]         mechanic - cities covered by on-site service
 * @property {string[]} [makes]                mechanic - car makes they specialize in
 * @property {{ lat: number, lng: number } | null} [base]  mechanic - the workshop's location (map, distances)
 * @property {string} [description]            mechanic and tow (optional), parts_shop (required)
 * @property {File | null} [businessLicense]   parts_shop, tow
 * @property {File[]} [extraDocuments]         parts_shop
 * @property {File[]} [shopPhotos]             parts_shop
 * @property {import('../features/marketplace/shopCommerce.js').SellingSettings} [sellingSettings]  parts_shop - delivery, pickup and payment methods; not reviewed
 * @property {string[]} [serviceArea]          tow - cities they cover
 * @property {Truck[]} [trucks]                tow
 * @property {{ lat: number, lng: number } | null} [base]  tow - where the trucks are parked (map, distances)
 * @property {string[]} [towServices]          tow - TOW_SERVICES values (features/logistics/constants.js)
 * @property {PendingChange[]} [pendingChanges] mechanic, parts_shop, tow
 */

/**
 * What anyone can see about an approved, non-suspended mechanic (/mechanics): approved skills only,
 * no contact details or certificates.
 * @typedef {Object} PublicMechanic
 * @property {string} id
 * @property {string} name
 * @property {File | null} profilePhoto
 * @property {string} city
 * @property {string} workshopName
 * @property {string} address
 * @property {string} description
 * @property {{ id: string, skill: string, years: number }[]} skills
 * @property {File[]} workshopPhotos
 * @property {('on_site' | 'workshop' | 'online')[]} serviceModes
 * @property {string[]} onSiteCities
 * @property {string[]} makes      car makes they specialize in
 * @property {{ lat: number, lng: number } | null} base  the workshop's location
 * @property {string[]} tagIds     admin-assigned tags
 * @property {true} verified       only approved accounts are public
 */

/**
 * What anyone can see about an approved tow company (/tow-companies).
 * No contact details, plate numbers or documents, and approved trucks only.
 * @typedef {Object} PublicTowCompany
 * @property {string} id
 * @property {string} name
 * @property {File | null} profilePhoto   logo
 * @property {string} city
 * @property {string} address
 * @property {string} description
 * @property {string[]} serviceArea
 * @property {{ lat: number, lng: number } | null} base    where the trucks are parked
 * @property {string[]} towServices    TOW_SERVICES values (features/logistics/constants.js)
 * @property {{ id: string, type: string, maxWeightKg: number, photos: File[] }[]} trucks
 * @property {number} availableTrucks  approved trucks marked available right now
 * @property {string[]} tagIds
 * @property {true} verified
 */

export {}
