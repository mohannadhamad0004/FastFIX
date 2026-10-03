// JSDoc type definitions for the diagnosis feature.

/** @typedef {'photo' | 'video' | 'audio'} MediaType  audio = engine sound */
/** @typedef {'strong' | 'moderate' | 'weak'} Evidence  how well the media supports a cause (no percentages) */
/** @typedef {'safe' | 'soon' | 'stop'} Urgency  safe to drive / inspect soon / stop driving */

/**
 * The car the problem is about.
 * @typedef {Object} DiagnosisCar
 * @property {string} make
 * @property {string} model
 * @property {number} year
 */

/**
 * What the customer sends: runDiagnosis(input).
 * @typedef {Object} DiagnosisInput
 * @property {MediaType} mediaType
 * @property {File} file              the photo, video or engine sound (uploaded or recorded)
 * @property {DiagnosisCar} car
 * @property {string | null} [carId]  when the car is one of the customer's cars (/my-cars)
 * @property {string} [description]   "when it happens, noises, warning lights"
 */

/**
 * A preliminary AI assessment. A mechanic confirms or corrects it.
 * @typedef {Object} Diagnosis
 * @property {string} id
 * @property {string} observations      what the AI noticed in the media, a short paragraph
 * @property {{ cause: string, evidence: Evidence }[]} possibleCauses  most likely first
 * @property {Urgency} urgency
 * @property {string[]} recommendedChecks  what the mechanic should check, in order
 * @property {string} suggestedSkill    one of SKILLS in auth/signup/constants.js, e.g. "Electrical"
 * @property {string} createdAt         ISO date
 * @property {MediaType} mediaType
 * @property {DiagnosisCar} car
 * @property {string | null} [carId]    one of the customer's cars, if it was picked from /my-cars
 * @property {string} description
 * @property {string} fileName
 * @property {File | null} [file]       the original photo, video or sound (kept with the history)
 * @property {string | null} userId     who asked; null when not logged in (not saved)
 */

export {}
