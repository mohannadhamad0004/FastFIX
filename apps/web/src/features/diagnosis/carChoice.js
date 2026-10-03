import { toCar, validateCar } from '../requests/carDetails.js'
import { OTHER_CAR } from './constants.js'

/**
 * The car to diagnose, from the form: a saved car (the first one when none is picked yet), or the
 * typed make/model/year after validation.
 * @param {{ savedId: string, make: string, model: string, year: string }} draftCar
 * @param {import('../cars/types.js').Car[]} savedCars
 * @returns {{ car: import('./types.js').DiagnosisCar | null, carId: string | null, errors: Record<string, string> }}
 *   carId is set when it is one of the saved cars
 */
export function resolveCar(draftCar, savedCars) {
  if (savedCars.length > 0 && draftCar.savedId !== OTHER_CAR) {
    const saved = savedCars.find((car) => car.id === draftCar.savedId) ?? savedCars[0]
    return { car: { make: saved.make, model: saved.model, year: saved.year }, carId: saved.id, errors: {} }
  }
  const errors = validateCar(draftCar)
  return Object.keys(errors).length
    ? { car: null, carId: null, errors }
    : { car: toCar(draftCar), carId: null, errors: {} }
}
