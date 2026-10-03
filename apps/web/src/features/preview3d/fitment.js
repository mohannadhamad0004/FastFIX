// Which parts can be tried on the 3D car: visible parts only (not engine or brake internals).
export const PREVIEW_CATEGORIES = Object.freeze(['Lighting', 'Body', 'Accessories', 'Tires & Wheels'])

export const isPreviewable = (part) => PREVIEW_CATEGORIES.includes(part.category)

const same = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase()

/** Whether `part` fits `car` ({ make, model, year }) according to its fitment list. */
export function fitsCar(part, car) {
  if (!car) return false
  if (part.universalFit) return true
  return part.fitments.some(
    (f) => same(f.make, car.make) && same(f.model, car.model) && f.yearFrom <= car.year && car.year <= f.yearTo,
  )
}

export const formatPreviewCar = (car) => `${car.make} ${car.model} ${car.year}`
