import { ROLES } from '../../authorization/roles.js'
import { COMPANY_ROLES } from '../constants.js'
import { isValidEmail, isValidPhone, passwordError, skillErrors, truckErrors } from '../validation.js'
import AccountStep from './AccountStep.jsx'
import CompanyProfileStep from './CompanyProfileStep.jsx'
import DocumentsStep from './DocumentsStep.jsx'
import MechanicProfileStep from './MechanicProfileStep.jsx'
import PhotosStep from './PhotosStep.jsx'
import ReviewStep from './ReviewStep.jsx'
import SkillsStep from './SkillsStep.jsx'
import TrucksStep from './TrucksStep.jsx'
import { DESCRIPTION_MAX_LENGTH } from './constants.js'
import { newTruck } from './listEntries.js'

// Signup form state per role, the steps each role goes through, and each step's validation.
//
// Validators return { [fieldId]: message }. Field ids match the element ids in the step
// components ("email", "skills.0.years", "trucks.1.photos"), so the wizard can focus the first
// invalid field. Keep each validator's checks in the order the fields appear on screen.

// Upload fields sent to register() as `files`; everything else goes in `data`.
// (Skills and trucks keep their own files inside `data`.)
export const FILE_FIELDS = ['profilePhoto', 'workshopPhotos', 'businessLicense', 'extraDocuments', 'shopPhotos']

export function initialForm(role) {
  const account = { name: '', email: '', phone: '', password: '', confirmPassword: '', profilePhoto: null }
  switch (role) {
    case ROLES.MECHANIC:
      return { ...account, city: '', workshopName: '', address: '', skills: [], workshopPhotos: [] }
    case ROLES.PARTS_SHOP:
      return {
        ...account,
        city: '',
        address: '',
        description: '',
        businessLicense: null,
        extraDocuments: [],
        shopPhotos: [],
      }
    case ROLES.TOW:
      return {
        ...account,
        city: '',
        address: '',
        description: '',
        serviceArea: [],
        businessLicense: null,
        trucks: [newTruck()],
      }
    default:
      return account
  }
}

const isBlank = (value) => !String(value ?? '').trim()

// { years: '...' } for skill 2 -> { 'skills.2.years': '...' }
const prefixed = (prefix, errors) =>
  Object.fromEntries(Object.entries(errors).map(([field, message]) => [`${prefix}.${field}`, message]))

function validateAccount(form, role) {
  const errors = {}
  if (isBlank(form.name)) {
    errors.name = COMPANY_ROLES.includes(role) ? 'Enter your company name.' : 'Enter your full name.'
  }
  if (isBlank(form.email)) errors.email = 'Enter your email address.'
  else if (!isValidEmail(form.email)) errors.email = 'Enter a valid email address, like name@example.com.'
  if (isBlank(form.phone)) errors.phone = 'Enter your phone number.'
  else if (!isValidPhone(form.phone)) errors.phone = 'Enter a valid phone number (9 to 15 digits).'
  const badPassword = passwordError(form.password)
  if (badPassword) errors.password = badPassword
  if (!form.confirmPassword) errors.confirmPassword = 'Type your password again.'
  else if (form.confirmPassword !== form.password) errors.confirmPassword = "Passwords don't match."
  return errors
}

function validateMechanicProfile(form) {
  const errors = {}
  if (!form.profilePhoto) errors.profilePhoto = 'Add a profile photo.'
  if (isBlank(form.city)) errors.city = 'Enter your city.'
  if (isBlank(form.workshopName)) errors.workshopName = 'Enter the workshop name.'
  if (isBlank(form.address)) errors.address = 'Enter the workshop address.'
  return errors
}

function validateCompanyProfile(form, role) {
  const errors = {}
  if (!form.profilePhoto) {
    errors.profilePhoto = role === ROLES.PARTS_SHOP ? 'Add your shop logo or a profile photo.' : 'Add your company logo.'
  }
  if (isBlank(form.city)) errors.city = 'Enter your city.'
  if (isBlank(form.address)) errors.address = 'Enter your address.'
  // Required for parts shops, optional for tow companies.
  if (role === ROLES.PARTS_SHOP && isBlank(form.description)) {
    errors.description = 'Write a short description of your shop.'
  } else if (form.description.trim().length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Keep the description under ${DESCRIPTION_MAX_LENGTH} characters.`
  }
  if (role === ROLES.TOW && form.serviceArea.length === 0) {
    errors.serviceArea = 'Add at least one city you cover.'
  }
  return errors
}

function validateSkills(form) {
  const errors = {}
  if (form.skills.length === 0) errors.skills = 'Choose at least one skill.'
  form.skills.forEach((skill, i) => Object.assign(errors, prefixed(`skills.${i}`, skillErrors(skill))))
  return errors
}

function validatePhotos(field, min, what) {
  return (form) =>
    form[field].length < min
      ? { [field]: `Add at least ${min} ${what} photo${min === 1 ? '' : 's'} (${form[field].length} added).` }
      : {}
}

function validateDocuments(form, role) {
  if (form.businessLicense) return {}
  return {
    businessLicense:
      role === ROLES.PARTS_SHOP
        ? 'Upload your business license or commercial registration.'
        : 'Upload your business license.',
  }
}

function validateTrucks(form) {
  const errors = {}
  if (form.trucks.length === 0) errors.trucks = 'Add at least one truck.'
  form.trucks.forEach((truck, i) => Object.assign(errors, prefixed(`trucks.${i}`, truckErrors(truck))))
  return errors
}

const noErrors = () => ({})

const ACCOUNT = { id: 'account', title: 'Account', Component: AccountStep, validate: validateAccount }
const REVIEW = { id: 'review', title: 'Review', Component: ReviewStep, validate: noErrors }
const COMPANY_PROFILE = {
  id: 'profile',
  title: 'Company',
  Component: CompanyProfileStep,
  validate: validateCompanyProfile,
}
const DOCUMENTS = { id: 'documents', title: 'Documents', Component: DocumentsStep, validate: validateDocuments }

// `props` are passed to the step component as they are.
export const SIGNUP_STEPS = Object.freeze({
  [ROLES.CUSTOMER]: [ACCOUNT],
  [ROLES.MECHANIC]: [
    ACCOUNT,
    { id: 'profile', title: 'Workshop', Component: MechanicProfileStep, validate: validateMechanicProfile },
    { id: 'skills', title: 'Skills', Component: SkillsStep, validate: validateSkills },
    {
      id: 'photos',
      title: 'Photos',
      Component: PhotosStep,
      validate: validatePhotos('workshopPhotos', 2, 'workshop'),
      props: {
        field: 'workshopPhotos',
        min: 2,
        title: 'Workshop photos',
        intro: 'Add at least 2 photos: your workshop, and cars being worked on there.',
        label: 'Workshop photos',
      },
    },
    REVIEW,
  ],
  [ROLES.PARTS_SHOP]: [
    ACCOUNT,
    { ...COMPANY_PROFILE, title: 'Shop' },
    DOCUMENTS,
    {
      id: 'photos',
      title: 'Photos',
      Component: PhotosStep,
      validate: validatePhotos('shopPhotos', 1, 'shop'),
      props: {
        field: 'shopPhotos',
        min: 1,
        title: 'Shop photos',
        intro: 'Add at least 1 photo of your shop, such as the storefront or the parts on your shelves.',
        label: 'Shop photos',
      },
    },
    REVIEW,
  ],
  [ROLES.TOW]: [
    ACCOUNT,
    COMPANY_PROFILE,
    DOCUMENTS,
    { id: 'trucks', title: 'Trucks', Component: TrucksStep, validate: validateTrucks },
    REVIEW,
  ],
})
