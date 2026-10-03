// TODO: replace with real API calls
//
// The logged-in tow company's trucks (/tow/trucks). Every function returns a Promise and works on
// the logged-in company's own trucks only; the api must check the same on every call.
//
// Review rules (also in the root CLAUDE.md):
//   - A new truck starts "pending" and is not public until an admin approves it on
//     /admin/approvals (Tow Companies tab).
//   - Changing the plate, type, max weight, registration or insurance sends the truck back to
//     review (and off the public profile). Changing its status or photos does not.
//   - A truck on an active tow request (pending or in progress) can't be removed, and a company
//     keeps at least one truck, as at signup.
//
// Mock: trucks live on the tow company's account in the auth store, and active requests come from
// the requests store. TrucksProvider passes both in, the way the api reads its tables.

import { ACCOUNT_STATUS, REVIEW_STATUS } from '../../auth/constants.js'
import { TRUCK_STATUSES } from '../../auth/signup/constants.js'
import { truckErrors } from '../../auth/validation.js'
import { ROLES } from '../../authorization/roles.js'
import { deepCopy } from '../../utils/deepCopy.js'
import { isSameFile, validateFile } from '../../utils/files.js'
import { ACTIVE_REQUEST_STATUSES, REQUEST_TYPES } from '../requests/constants.js'
import { summarizeRequest } from '../requests/format.js'

/** @typedef {import('../../auth/types.js').Truck} Truck */
/** @typedef {{ read: () => any, write: (next: any) => void }} MockStore */
/** @typedef {Truck & { activeRequest: { id: string, summary: string } | null }} MyTruck */

// Thrown for problems the company can fix. `field` names the form field it belongs to, if any.
export class TruckError extends Error {
  constructor(message, field = null) {
    super(message)
    this.name = 'TruckError'
    this.field = field
  }
}

const now = () => new Date().toISOString()
const isStatus = (value) => TRUCK_STATUSES.some((status) => status.value === value)

// Fields an admin checks against the registration and insurance.
const REVIEWED_FIELDS = ['plateNumber', 'type', 'maxWeightKg', 'registration', 'insurance']

// Checks the fields, and the type and size of newly uploaded files (files already on the truck
// were checked when they were added).
function checkFields(truck, existing = null) {
  const errors = truckErrors(truck)
  const [field] = Object.keys(errors)
  if (field) throw new TruckError(errors[field], field)
  const isNew = (file, onFile) => !onFile.some((old) => old && isSameFile(old, file))
  for (const photo of truck.photos) {
    const problem = isNew(photo, existing?.photos ?? []) && validateFile(photo, 'image')
    if (problem) throw new TruckError(problem, 'photos')
  }
  for (const field of ['registration', 'insurance']) {
    const problem = isNew(truck[field], [existing?.[field]]) && validateFile(truck[field], 'document')
    if (problem) throw new TruckError(problem, field)
  }
}

// Form values -> stored fields (trimmed plate, numeric weight).
const clean = (data) => ({
  plateNumber: String(data.plateNumber ?? '').trim(),
  type: data.type,
  maxWeightKg: Number(data.maxWeightKg),
  photos: [...(data.photos ?? [])],
  registration: data.registration ?? null,
  insurance: data.insurance ?? null,
})

function reviewedFieldChanged(before, after) {
  return REVIEWED_FIELDS.some((field) => {
    if (field === 'registration' || field === 'insurance') return !isSameFile(before[field], after[field])
    return before[field] !== after[field]
  })
}

/** @param {{ auth: MockStore, requests: MockStore }} stores */
export function createTrucksService(stores) {
  function requireTowCompany() {
    const { users, sessionUserId } = stores.auth.read()
    const user = users.find((u) => u.id === sessionUserId)
    if (!user || user.role !== ROLES.TOW || user.status !== ACCOUNT_STATUS.APPROVED || user.suspended) {
      throw new TruckError('Only approved tow companies can manage trucks.')
    }
    return user
  }

  function findTruck(company, truckId) {
    const truck = company.trucks.find((t) => t.id === truckId)
    if (!truck) throw new TruckError('This truck is no longer in your fleet.')
    return truck
  }

  function saveTrucks(companyId, trucks) {
    const data = stores.auth.read()
    stores.auth.write({ ...data, users: data.users.map((u) => (u.id === companyId ? { ...u, trucks } : u)) })
  }

  // The tow request this truck is working on, if any.
  function activeRequestFor(companyId, truckId) {
    return (
      stores.requests
        .read()
        .requests.find(
          (r) =>
            r.type === REQUEST_TYPES.TOW &&
            r.target.id === companyId &&
            r.assignedTruckId === truckId &&
            ACTIVE_REQUEST_STATUSES.includes(r.status),
        ) ?? null
    )
  }

  function plateTaken(company, plateNumber, exceptId = null) {
    const plate = plateNumber.replace(/\s+/g, '').toLowerCase()
    return company.trucks.some((t) => t.id !== exceptId && t.plateNumber.replace(/\s+/g, '').toLowerCase() === plate)
  }

  /** @returns {Promise<MyTruck[]>} in the order they were added */
  async function getMyTrucks() {
    const company = requireTowCompany()
    return company.trucks.map((truck) => {
      const request = activeRequestFor(company.id, truck.id)
      return deepCopy({ ...truck, activeRequest: request && { id: request.id, summary: summarizeRequest(request) } })
    })
  }

  /**
   * Adds a truck with the same details and documents as at signup. It waits for an admin.
   * @param {{ plateNumber, type, maxWeightKg, photos, registration, insurance, status? }} data
   * @returns {Promise<Truck>}
   */
  async function addTruck(data) {
    const company = requireTowCompany()
    const fields = clean(data)
    checkFields(fields)
    if (plateTaken(company, fields.plateNumber)) {
      throw new TruckError('Another truck in your fleet already has this plate number.', 'plateNumber')
    }
    const status = data.status ?? 'available'
    if (!isStatus(status)) throw new TruckError('Choose a status from the list.', 'status')

    const number = company.trucks.reduce((max, t) => Math.max(max, Number(t.id.split('-').pop()) || 0), 0) + 1
    const truck = {
      ...fields,
      id: `${company.id}-truck-${number}`,
      status,
      reviewStatus: REVIEW_STATUS.PENDING,
      rejectionReason: null,
      submittedAt: now(),
    }
    saveTrucks(company.id, [...company.trucks, truck])
    return deepCopy(truck)
  }

  /**
   * Edits a truck. A new plate, type, weight or document sends it back to review; a new status or
   * new photos don't.
   * @returns {Promise<{ truck: Truck, sentForReview: boolean }>}
   */
  async function updateTruck(truckId, data) {
    const company = requireTowCompany()
    const existing = findTruck(company, truckId)
    const fields = clean({ ...existing, ...data })
    checkFields(fields, existing)
    if (plateTaken(company, fields.plateNumber, truckId)) {
      throw new TruckError('Another truck in your fleet already has this plate number.', 'plateNumber')
    }
    const status = data.status ?? existing.status
    if (!isStatus(status)) throw new TruckError('Choose a status from the list.', 'status')

    const sentForReview = reviewedFieldChanged(existing, fields)
    const truck = {
      ...existing,
      ...fields,
      status,
      ...(sentForReview && { reviewStatus: REVIEW_STATUS.PENDING, rejectionReason: null, submittedAt: now() }),
    }
    saveTrucks(
      company.id,
      company.trucks.map((t) => (t.id === truckId ? truck : t)),
    )
    return { truck: deepCopy(truck), sentForReview }
  }

  /**
   * Available / en route / busy / out of service. Not reviewed.
   * @returns {Promise<Truck>}
   */
  async function setTruckStatus(truckId, status) {
    const company = requireTowCompany()
    const existing = findTruck(company, truckId)
    if (!isStatus(status)) throw new TruckError('Choose a status from the list.', 'status')
    const truck = { ...existing, status }
    saveTrucks(
      company.id,
      company.trucks.map((t) => (t.id === truckId ? truck : t)),
    )
    return deepCopy(truck)
  }

  /** @returns {Promise<void>} */
  async function removeTruck(truckId) {
    const company = requireTowCompany()
    const truck = findTruck(company, truckId)
    const request = activeRequestFor(company.id, truckId)
    if (request) {
      throw new TruckError(
        `${truck.plateNumber} is on an active tow request (${request.id}). You can remove it once that job is finished.`,
      )
    }
    if (company.trucks.length === 1) {
      throw new TruckError('This is your only truck. Add another one before removing it.')
    }
    saveTrucks(
      company.id,
      company.trucks.filter((t) => t.id !== truckId),
    )
  }

  return { getMyTrucks, addTruck, updateTruck, setTruckStatus, removeTruck }
}
