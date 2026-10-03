import { ROLES } from '../authorization/roles.js'
import { COMPANY_ROLES } from './constants.js'
import { DESCRIPTION_MAX_LENGTH, SERVICE_MODES } from './signup/constants.js'

// Which public profile fields each role edits on /profile, and the rules they must follow (the same
// as at signup). profileService.js and the profile form both use these; the api repeats them.
// Business licenses and skills have their own calls in profileService.js.

export const PROFILE_FIELDS = Object.freeze({
  [ROLES.CUSTOMER]: ['name', 'profilePhoto', 'city'],
  [ROLES.ADMIN]: ['name', 'profilePhoto'],
  [ROLES.MECHANIC]: [
    'name',
    'profilePhoto',
    'workshopName',
    'city',
    'address',
    'description',
    'workshopPhotos',
    'serviceModes',
    'onSiteCities',
    'makes',
  ],
  [ROLES.PARTS_SHOP]: ['name', 'profilePhoto', 'city', 'address', 'description', 'shopPhotos'],
  [ROLES.TOW]: ['name', 'profilePhoto', 'city', 'address', 'description', 'serviceArea'],
})

// Minimum photos, as at signup.
export const PHOTO_MINIMUMS = Object.freeze({ workshopPhotos: 2, shopPhotos: 1 })

const isBlank = (value) => !String(value ?? '').trim()

const NAME_MESSAGES = {
  [ROLES.PARTS_SHOP]: 'Enter your shop name.',
  [ROLES.TOW]: 'Enter your company name.',
}

/**
 * @param {import('./types.js').Role} role
 * @param {Object} values  the role's PROFILE_FIELDS
 * @returns {Object<string, string>} messages by field, in the order the fields appear on screen
 */
export function profileErrors(role, values) {
  const errors = {}
  const has = (field) => PROFILE_FIELDS[role].includes(field)
  const isBusiness = role !== ROLES.CUSTOMER && role !== ROLES.ADMIN

  if (isBusiness && !values.profilePhoto) {
    errors.profilePhoto = COMPANY_ROLES.includes(role) ? 'Add your logo.' : 'Add a profile photo.'
  }
  if (isBlank(values.name)) errors.name = NAME_MESSAGES[role] ?? 'Enter your full name.'
  if (has('workshopName') && isBlank(values.workshopName)) errors.workshopName = 'Enter the workshop name.'
  if (isBusiness && isBlank(values.city)) errors.city = 'Enter your city.'
  if (has('address') && isBlank(values.address)) {
    errors.address = role === ROLES.MECHANIC ? 'Enter the workshop address.' : 'Enter your address.'
  }
  if (has('description')) {
    if (role === ROLES.PARTS_SHOP && isBlank(values.description)) {
      errors.description = 'Write a short description of your shop.'
    } else if (String(values.description ?? '').trim().length > DESCRIPTION_MAX_LENGTH) {
      errors.description = `Keep the description under ${DESCRIPTION_MAX_LENGTH} characters.`
    }
  }
  if (has('serviceArea') && !values.serviceArea?.length) errors.serviceArea = 'Add at least one city you cover.'
  for (const [field, min] of Object.entries(PHOTO_MINIMUMS)) {
    if (has(field) && (values[field]?.length ?? 0) < min) {
      errors[field] = `Keep at least ${min} photo${min === 1 ? '' : 's'} here.`
    }
  }
  if (has('serviceModes')) Object.assign(errors, serviceModeErrors(values))
  return errors
}

/** "Services I offer": at least one mode, and the cities covered when on-site is offered. */
export function serviceModeErrors({ serviceModes = [], onSiteCities = [] }) {
  const errors = {}
  if (!serviceModes.length) errors.serviceModes = 'Offer at least one kind of service.'
  else if (serviceModes.some((mode) => !SERVICE_MODES.some((m) => m.value === mode))) {
    errors.serviceModes = 'Choose from the services in the list.'
  }
  if (serviceModes.includes('on_site') && !onSiteCities.length) {
    errors.onSiteCities = 'Add at least one city you drive to for on-site service.'
  }
  return errors
}
