// Field rules shared by the login, signup, reset-password, account, profile and truck forms.
// The api repeats these checks; the client versions are only for quick feedback.

const isBlank = (value) => !String(value ?? '').trim()

export function isWholeNumberBetween(value, min, max) {
  const number = Number(value)
  return !isBlank(value) && Number.isInteger(number) && number >= min && number <= max
}

/**
 * One truck's details and documents (signup, /tow/trucks).
 * @returns {Object<string, string>} { plateNumber, type, maxWeightKg, photos, registration, insurance } messages
 */
export function truckErrors(truck) {
  const errors = {}
  if (isBlank(truck.plateNumber)) errors.plateNumber = 'Enter the plate number.'
  if (!truck.type) errors.type = 'Choose the truck type.'
  if (isBlank(truck.maxWeightKg)) errors.maxWeightKg = 'Enter the heaviest vehicle it can carry.'
  else if (!isWholeNumberBetween(truck.maxWeightKg, 500, 60000)) {
    errors.maxWeightKg = 'Enter a weight in kg from 500 to 60,000.'
  }
  if (!truck.photos?.length) errors.photos = 'Add at least one photo of this truck.'
  if (!truck.registration) errors.registration = 'Upload the registration document.'
  if (!truck.insurance) errors.insurance = 'Upload the insurance document.'
  return errors
}

/**
 * Years of experience and certificate for one mechanic skill (signup, /profile).
 * @returns {Object<string, string>} { years, certificate } messages
 */
export function skillErrors(skill) {
  const errors = {}
  if (isBlank(skill.years)) errors.years = 'Enter your years of experience.'
  else if (!isWholeNumberBetween(skill.years, 0, 60)) errors.years = 'Enter a whole number from 0 to 60.'
  if (!skill.certificate) errors.certificate = `Upload a certificate for ${skill.skill || 'this skill'}.`
  return errors
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const isValidEmail = (email) => EMAIL_PATTERN.test(email.trim())

// Digits with an optional leading "+", spaces and dashes allowed; 9 to 15 digits in total.
export function isValidPhone(phone) {
  const trimmed = phone.trim()
  if (!/^\+?[\d\s-]+$/.test(trimmed)) return false
  const digits = trimmed.replace(/\D/g, '').length
  return digits >= 9 && digits <= 15
}

export const PASSWORD_RULES = Object.freeze([
  { id: 'length', label: 'At least 8 characters', test: (password) => password.length >= 8 },
  { id: 'letter', label: 'At least one letter', test: (password) => /\p{L}/u.test(password) },
  { id: 'number', label: 'At least one number', test: (password) => /\d/.test(password) },
])

/** @returns {string | null} what is wrong with the password, or null when it follows the rules */
export function passwordError(password) {
  if (!password) return 'Enter a password.'
  const failed = PASSWORD_RULES.find((rule) => !rule.test(password))
  return failed ? `Password needs ${failed.label.toLowerCase()}.` : null
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']

// Score 0-4 for the strength meter. A password that breaks a rule is always "Weak";
// mixed case, symbols and extra length push it higher.
export function passwordStrength(password) {
  if (!password) return { score: 0, label: '' }
  if (passwordError(password)) return { score: 1, label: STRENGTH_LABELS[1] }

  let score = 2
  if (/\p{Ll}/u.test(password) && /\p{Lu}/u.test(password)) score += 1
  if (/[^\p{L}\d]/u.test(password)) score += 1
  if (password.length >= 12) score += 1
  score = Math.min(score, 4)
  return { score, label: STRENGTH_LABELS[score] }
}
