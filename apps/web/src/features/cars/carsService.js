// TODO: replace with real API calls (GET/POST/PATCH/DELETE /api/cars)
//
// The logged-in customer's cars (/my-cars). Every function returns a Promise and works on the
// logged-in account's own cars only; the api must check the owner on every call.
//
// The data lives in CarsProvider's React state (memory only: a page reload resets it). The
// provider passes a small store ({ read, write }) like the other mock services.

import { ROLES } from '../../authorization/roles.js'
import { validateFile } from '../../utils/files.js'
import { MAX_CAR_YEAR, MIN_CAR_YEAR } from '../requests/carDetails.js'

/** @typedef {import('./types.js').Car} Car */

export const NICKNAME_MAX_LENGTH = 40
export const MAX_MILEAGE_KM = 2_000_000
const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/ // 17 characters, never I, O or Q

// Thrown for problems the user can fix. `field` names the form field it belongs to, if any.
export class CarError extends Error {
  constructor(message, field = null) {
    super(message)
    this.name = 'CarError'
    this.field = field
  }
}

const isBlank = (value) => !String(value ?? '').trim()

/**
 * Errors for the car form (ids: nickname, make, model, year, mileageKm, vin, photo).
 * The service repeats these checks; the form uses them for quick feedback.
 */
export function carErrors(car) {
  const errors = {}
  if (String(car.nickname ?? '').trim().length > NICKNAME_MAX_LENGTH) {
    errors.nickname = `Keep the nickname under ${NICKNAME_MAX_LENGTH} characters.`
  }
  if (isBlank(car.make)) errors.make = 'Enter the make, e.g. Hyundai.'
  if (isBlank(car.model)) errors.model = 'Enter the model, e.g. Accent.'
  const year = Number(car.year)
  if (isBlank(car.year)) errors.year = 'Enter the year.'
  else if (!Number.isInteger(year) || year < MIN_CAR_YEAR || year > MAX_CAR_YEAR) {
    errors.year = `Enter a year from ${MIN_CAR_YEAR} to ${MAX_CAR_YEAR}.`
  }
  const mileage = Number(car.mileageKm)
  if (isBlank(car.mileageKm)) errors.mileageKm = 'Enter the mileage in km.'
  else if (!Number.isInteger(mileage) || mileage < 0 || mileage > MAX_MILEAGE_KM) {
    errors.mileageKm = 'Enter the mileage as a whole number of km.'
  }
  const vin = String(car.vin ?? '').trim().toUpperCase()
  if (vin && !VIN_PATTERN.test(vin)) errors.vin = 'A VIN has 17 letters and numbers (no I, O or Q).'
  return errors
}

/**
 * @param {{ read: () => { cars: Car[] }, write: (next: { cars: Car[] }) => void }} store
 * @param {{ getCurrentUser: () => Promise<import('../../auth/types.js').Account | null> }} auth
 */
export function createCarsService(store, auth) {
  async function requireCustomer() {
    const user = await auth.getCurrentUser()
    if (!user || user.role !== ROLES.CUSTOMER) throw new CarError('Log in as a customer to manage your cars.')
    return user
  }

  function findOwn(user, carId) {
    const car = store.read().cars.find((c) => c.id === carId && c.ownerId === user.id)
    if (!car) throw new CarError('This car is not in your garage.')
    return car
  }

  function clean(data) {
    const errors = carErrors(data)
    const [field] = Object.keys(errors)
    if (field) throw new CarError(errors[field], field)
    if (data.photo) {
      const problem = data.photo instanceof Blob ? validateFile(data.photo, 'image') : 'Choose a photo file.'
      if (problem) throw new CarError(problem, 'photo')
    }
    return {
      nickname: String(data.nickname ?? '').trim(),
      make: data.make.trim(),
      model: data.model.trim(),
      year: Number(data.year),
      mileageKm: Number(data.mileageKm),
      vin: String(data.vin ?? '').trim().toUpperCase(),
      photo: data.photo ?? null,
    }
  }

  /** @returns {Promise<Car[]>} the logged-in customer's cars, oldest first; [] for other roles */
  async function getMyCars() {
    const user = await auth.getCurrentUser()
    if (!user || user.role !== ROLES.CUSTOMER) return []
    return structuredClone(store.read().cars.filter((c) => c.ownerId === user.id))
  }

  /** @returns {Promise<Car | null>} null when it isn't one of the customer's cars */
  async function getCar(carId) {
    const user = await auth.getCurrentUser()
    const car = store.read().cars.find((c) => c.id === carId && c.ownerId === user?.id)
    return car ? structuredClone(car) : null
  }

  /** @returns {Promise<Car>} */
  async function addCar(data) {
    const user = await requireCustomer()
    const fields = clean(data)
    const current = store.read()
    const number = current.cars.reduce((max, c) => Math.max(max, Number(c.id.split('-').pop()) || 0), 0) + 1
    const car = { ...fields, id: `car-${number}`, ownerId: user.id, createdAt: new Date().toISOString() }
    store.write({ ...current, cars: [...current.cars, car] })
    return structuredClone(car)
  }

  /** @returns {Promise<Car>} */
  async function updateCar(carId, data) {
    const user = await requireCustomer()
    const existing = findOwn(user, carId)
    const car = { ...existing, ...clean({ ...existing, ...data }) }
    const current = store.read()
    store.write({ ...current, cars: current.cars.map((c) => (c.id === carId ? car : c)) })
    return structuredClone(car)
  }

  /**
   * Removes the car from the garage. Its past requests and reports stay (they keep their own copy
   * of the make, model and year).
   * @returns {Promise<void>}
   */
  async function deleteCar(carId) {
    const user = await requireCustomer()
    findOwn(user, carId)
    const current = store.read()
    store.write({ ...current, cars: current.cars.filter((c) => c.id !== carId) })
  }

  return { getMyCars, getCar, addCar, updateCar, deleteCar }
}
