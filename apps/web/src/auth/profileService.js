// TODO: replace with real API calls
//
// The logged-in user's own account settings (/account) and public profile (/profile). Every
// function returns a Promise and works on the logged-in account only - the api must take the user
// from the session too, never from an id in the request.
//
// Mock: like adminService, this reads and writes the raw auth store (the accounts), which
// ProfileProvider passes in. Parts shop pages pick up profile changes on their own, because the
// marketplace reads each shop's public details from its account.
//
// Review rules (also in the root CLAUDE.md):
//   - A new business name (parts shop, tow company), workshop name (mechanic) or business license
//     waits in account.pendingChanges. The approved value stays public until an admin approves it
//     on /admin/approvals; a rejected change keeps the admin's reason until the user dismisses it.
//   - A new skill, or a new certificate or years for a skill, makes that skill "pending": it is
//     hidden from the public profile until an admin approves it.
//   - Photos, descriptions, addresses, cities and service modes are not reviewed.

import { ROLES } from '../authorization/roles.js'
import { cleanSellingSettings, sellingSettingsErrors } from '../features/marketplace/shopCommerce.js'
import { deepCopy } from '../utils/deepCopy.js'
import { isSameFile, validateFile } from '../utils/files.js'
import { normalizeEmail, toPublicUser } from './authService.js'
import { ACCOUNT_STATUS, NOTIFICATION_TYPES, REVIEW_STATUS, REVIEWED_FIELDS } from './constants.js'
import { PROFILE_FIELDS, profileErrors } from './profileRules.js'
import { changeOf } from './reviewItems.js'
import { SKILLS } from './signup/constants.js'
import { isValidEmail, isValidPhone, passwordError, skillErrors } from './validation.js'

/** @typedef {import('./types.js').Account} Account */
/** @typedef {{ read: () => any, write: (next: any) => void }} MockStore */

// Thrown for problems the user can fix. `field` names the form field it belongs to, if any.
export class ProfileError extends Error {
  constructor(message, field = null) {
    super(message)
    this.name = 'ProfileError'
    this.field = field
  }
}

const now = () => new Date().toISOString()
const trimmed = (value) => (typeof value === 'string' ? value.trim() : value)
const cleanList = (list) => [...new Set((list ?? []).map((item) => String(item).trim()).filter(Boolean))]

// Throws the first message of an errors object, if there is one.
function throwFirst(errors) {
  const [field] = Object.keys(errors)
  if (field) throw new ProfileError(errors[field], field)
}

// "u-15-skill-3" -> 3
const idNumber = (id) => Number(id.split('-').pop()) || 0

/** @param {{ auth: MockStore }} stores */
export function createProfileService(stores) {
  // --- Helpers ---------------------------------------------------------------------------------

  // Any logged-in account, including pending and rejected ones (they can still use /account).
  function sessionUser() {
    const { users, sessionUserId } = stores.auth.read()
    const user = users.find((u) => u.id === sessionUserId)
    if (!user || user.suspended) throw new ProfileError('Log in again to continue.')
    return user
  }

  // Public profiles are for approved accounts only (/profile is behind ProtectedRoute).
  function approvedUser(role = null) {
    const user = sessionUser()
    if (user.status !== ACCOUNT_STATUS.APPROVED) {
      throw new ProfileError('Your account needs to be approved before you can edit your profile.')
    }
    if (role && user.role !== role) throw new ProfileError("Your account can't do this.")
    return user
  }

  /** @returns {Account} */
  function save(userId, changes) {
    const data = stores.auth.read()
    let updated = null
    const users = data.users.map((u) => {
      if (u.id !== userId) return u
      updated = { ...u, ...changes }
      return updated
    })
    stores.auth.write({ ...data, users })
    return toPublicUser(updated)
  }

  function checkDocument(file, field) {
    if (!(file instanceof Blob)) throw new ProfileError('Choose a file to upload.', field)
    const problem = validateFile(file, 'document')
    if (problem) throw new ProfileError(problem, field)
  }

  // Adds (or replaces) the pending change of one reviewed field.
  function withChange(user, field, value) {
    const others = (user.pendingChanges ?? []).filter((change) => change.field !== field)
    return [...others, { field, value, status: REVIEW_STATUS.PENDING, submittedAt: now(), rejectionReason: null }]
  }

  // --- Account (/account) -----------------------------------------------------------------------

  /**
   * @param {{ email: string, phone: string }} contact
   * @returns {Promise<Account>}
   */
  async function updateContact({ email, phone }) {
    const user = sessionUser()
    const cleanEmail = normalizeEmail(email)
    const cleanPhone = String(phone ?? '').trim()

    if (!cleanEmail) throw new ProfileError('Enter your email address.', 'email')
    if (!isValidEmail(cleanEmail)) throw new ProfileError('Enter a valid email address, like name@example.com.', 'email')
    if (stores.auth.read().users.some((u) => u.id !== user.id && u.email === cleanEmail)) {
      throw new ProfileError('Another account already uses this email.', 'email')
    }
    // Every account except the seeded admin signed up with a phone number.
    if (!cleanPhone && user.role !== ROLES.ADMIN) throw new ProfileError('Enter your phone number.', 'phone')
    if (cleanPhone && !isValidPhone(cleanPhone)) {
      throw new ProfileError('Enter a valid phone number (9 to 15 digits).', 'phone')
    }
    return save(user.id, { email: cleanEmail, phone: cleanPhone })
  }

  /**
   * Same password rules as signup. Mock only: passwords are plain text here; the api hashes them.
   * @returns {Promise<void>}
   */
  async function changePassword({ currentPassword, newPassword }) {
    const user = sessionUser()
    if (!currentPassword) throw new ProfileError('Enter your current password.', 'currentPassword')
    if (currentPassword !== user.password) throw new ProfileError('Your current password is incorrect.', 'currentPassword')
    const badPassword = passwordError(newPassword)
    if (badPassword) throw new ProfileError(badPassword, 'newPassword')
    if (newPassword === currentPassword) {
      throw new ProfileError('Choose a new password that is different from your current one.', 'newPassword')
    }
    save(user.id, { password: newPassword })
  }

  /**
   * Ends every session of this account, including this one, and cancels open password reset links.
   * Mock: sessions are per browser tab, so this logs out here and records the time; the api must
   * revoke every refresh token of the user.
   * @returns {Promise<void>}
   */
  async function logoutAllDevices() {
    const user = sessionUser()
    const data = stores.auth.read()
    const revokedAt = now()
    stores.auth.write({
      ...data,
      users: data.users.map((u) => (u.id === user.id ? { ...u, sessionsRevokedAt: revokedAt } : u)),
      resetTokens: data.resetTokens.filter((token) => token.userId !== user.id),
      sessionUserId: null,
    })
  }

  /**
   * @param {Partial<import('./types.js').NotificationPrefs>} prefs  only the types given change
   * @returns {Promise<Account>}
   */
  async function updateNotificationPrefs(prefs) {
    const user = sessionUser()
    const current = user.notificationPrefs ?? {}
    const next = Object.fromEntries(
      NOTIFICATION_TYPES.map(({ value }) => [value, Boolean(prefs[value] ?? current[value] ?? true)]),
    )
    return save(user.id, { notificationPrefs: next })
  }

  // --- Public profile (/profile) ----------------------------------------------------------------

  /**
   * Saves the role's public profile fields (PROFILE_FIELDS in profileRules.js); other keys are
   * ignored. Reviewed fields (business or workshop name) don't change right away: the new value
   * waits for an admin, and setting the field back to the approved value withdraws it.
   * @param {Object} values
   * @returns {Promise<{ account: Account, sentForReview: string[] }>} sentForReview names the
   *   fields that now wait for an admin
   */
  async function updateProfile(values) {
    const user = approvedUser()
    const allowed = PROFILE_FIELDS[user.role] ?? []
    const reviewed = REVIEWED_FIELDS[user.role] ?? []

    const fields = {}
    for (const key of allowed) {
      if (!(key in values)) continue
      const value = deepCopy(values[key])
      fields[key] = Array.isArray(value) && typeof value[0] === 'string' ? cleanList(value) : trimmed(value)
    }
    if (fields.serviceModes && !fields.serviceModes.includes('on_site')) fields.onSiteCities = []

    // Check the profile as it will be: what is saved now, plus pending names where there are some.
    const current = Object.fromEntries(
      allowed.map((key) => {
        const change = changeOf(user, key)
        return [key, change?.status === REVIEW_STATUS.PENDING ? change.value : user[key]]
      }),
    )
    throwFirst(profileErrors(user.role, { ...current, ...fields }))

    const changes = {}
    let pendingChanges = user.pendingChanges ?? []
    const sentForReview = []
    for (const [key, value] of Object.entries(fields)) {
      if (!reviewed.includes(key)) {
        changes[key] = value
        continue
      }
      const pending = changeOf(user, key)?.status === REVIEW_STATUS.PENDING ? changeOf(user, key) : null
      if (value === user[key]) {
        // Back to the approved value: nothing to review any more.
        if (pending) pendingChanges = pendingChanges.filter((change) => change.field !== key)
      } else if (pending?.value !== value) {
        pendingChanges = withChange({ pendingChanges }, key, value)
        sentForReview.push(key)
      }
    }
    if (reviewed.length) changes.pendingChanges = pendingChanges

    return { account: save(user.id, changes), sentForReview }
  }

  /**
   * Sends a new business license to the admin. The current one stays on file until it is approved.
   * @param {File} file  PDF, JPG or PNG
   * @returns {Promise<Account>}
   */
  async function submitBusinessLicense(file) {
    const user = approvedUser()
    if (!(REVIEWED_FIELDS[user.role] ?? []).includes('businessLicense')) {
      throw new ProfileError('Only parts shops and tow companies have a business license here.')
    }
    checkDocument(file, 'businessLicense')
    return save(user.id, { pendingChanges: withChange(user, 'businessLicense', file) })
  }

  /**
   * Withdraws a pending change, or dismisses a rejected one (after reading the admin's reason).
   * @param {'name' | 'workshopName' | 'businessLicense'} field
   * @returns {Promise<Account>}
   */
  async function withdrawChange(field) {
    const user = approvedUser()
    if (!changeOf(user, field)) throw new ProfileError('There is no change to withdraw.')
    return save(user.id, { pendingChanges: user.pendingChanges.filter((change) => change.field !== field) })
  }

  // --- Mechanic skills --------------------------------------------------------------------------

  function findSkill(user, skillId) {
    const skill = user.skills.find((s) => s.id === skillId)
    if (!skill) throw new ProfileError('This skill is no longer on your profile.')
    return skill
  }

  /**
   * Adds a skill with its proof. It starts as pending and stays off the public profile until an
   * admin approves it.
   * @param {{ skill: string, years: number | string, certificate: File }} entry
   * @returns {Promise<Account>}
   */
  async function addSkill({ skill, years, certificate }) {
    const user = approvedUser(ROLES.MECHANIC)
    if (!SKILLS.includes(skill)) throw new ProfileError('Choose a skill from the list.', 'skill')
    if (user.skills.some((s) => s.skill === skill)) {
      throw new ProfileError(`${skill} is already on your profile. Update its certificate instead.`, 'skill')
    }
    throwFirst(skillErrors({ skill, years, certificate }))
    checkDocument(certificate, 'certificate')

    const number = user.skills.reduce((max, s) => Math.max(max, idNumber(s.id)), 0) + 1
    const added = {
      id: `${user.id}-skill-${number}`,
      skill,
      years: Number(years),
      certificate,
      status: REVIEW_STATUS.PENDING,
      rejectionReason: null,
      submittedAt: now(),
    }
    return save(user.id, { skills: [...user.skills, added] })
  }

  /**
   * New years of experience and/or a new certificate for a skill. Either change sends the skill
   * back to "pending review", which hides it from the public profile until an admin approves it.
   * @param {string} skillId
   * @param {{ years: number | string, certificate: File }} entry
   * @returns {Promise<Account>}
   */
  async function updateSkill(skillId, { years, certificate }) {
    const user = approvedUser(ROLES.MECHANIC)
    const skill = findSkill(user, skillId)
    throwFirst(skillErrors({ skill: skill.skill, years, certificate }))
    checkDocument(certificate, 'certificate')
    const unchanged = Number(years) === skill.years && isSameFile(certificate, skill.certificate)
    if (unchanged) throw new ProfileError('Change the years or upload a new certificate first.', 'certificate')

    const updated = {
      ...skill,
      years: Number(years),
      certificate,
      status: REVIEW_STATUS.PENDING,
      rejectionReason: null,
      submittedAt: now(),
    }
    return save(user.id, { skills: user.skills.map((s) => (s.id === skillId ? updated : s)) })
  }

  /**
   * A mechanic keeps at least one approved skill, so the last approved one can't be removed.
   * @returns {Promise<Account>}
   */
  async function removeSkill(skillId) {
    const user = approvedUser(ROLES.MECHANIC)
    const skill = findSkill(user, skillId)
    const otherApproved = user.skills.some((s) => s.id !== skillId && s.status === REVIEW_STATUS.APPROVED)
    if (skill.status === REVIEW_STATUS.APPROVED && !otherApproved) {
      throw new ProfileError(
        `${skill.skill} is your only approved skill. Add another skill and wait for its approval before removing this one.`,
      )
    }
    return save(user.id, { skills: user.skills.filter((s) => s.id !== skillId) })
  }

  // --- Selling settings (parts shops, /profile) ---------------------------------------------------

  /**
   * Saves how the logged-in parts shop sells: delivery (cities, fee, free-above amount, estimated
   * time), pickup (address, hours) and accepted payment methods. Not reviewed by admins. A shop
   * must turn on delivery or pickup and accept a payment method; until it does, its parts can't be
   * bought and show only "Ask about this part" (features/marketplace/shopCommerce.js).
   * @param {import('../features/marketplace/shopCommerce.js').SellingSettings} values
   * @returns {Promise<Account>}
   */
  async function updateSellingSettings(values) {
    const user = approvedUser(ROLES.PARTS_SHOP)
    throwFirst(sellingSettingsErrors(values))
    return save(user.id, { sellingSettings: cleanSellingSettings(values) })
  }

  return {
    updateContact,
    changePassword,
    logoutAllDevices,
    updateNotificationPrefs,
    updateProfile,
    updateSellingSettings,
    submitBusinessLicense,
    withdrawChange,
    addSkill,
    updateSkill,
    removeSkill,
  }
}
