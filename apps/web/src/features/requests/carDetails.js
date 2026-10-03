// Car make / model / year fields shared by the service and tow request forms.

export const MIN_CAR_YEAR = 1950
export const MAX_CAR_YEAR = new Date().getFullYear() + 1

export const EMPTY_CAR = { make: '', model: '', year: '' }

/** Errors for the make, model and year fields (ids "make", "model", "year"). */
export function validateCar({ make, model, year }) {
  const errors = {}
  if (!make.trim()) errors.make = 'Enter the make, e.g. Hyundai.'
  if (!model.trim()) errors.model = 'Enter the model, e.g. Accent.'
  const number = Number(year)
  if (!String(year).trim()) errors.year = 'Enter the year.'
  else if (!Number.isInteger(number) || number < MIN_CAR_YEAR || number > MAX_CAR_YEAR) {
    errors.year = `Enter a year from ${MIN_CAR_YEAR} to ${MAX_CAR_YEAR}.`
  }
  return errors
}

export const toCar = ({ make, model, year }) => ({ make: make.trim(), model: model.trim(), year: Number(year) })

export const formatCar = (car) => `${car.make} ${car.model} ${car.year}`
