// Deep copy for mock services, so callers can't change stored data by mutating what they got back
// (the same as data from a real API). File/Blob objects are kept as they are - they can't be
// changed anyway, and structuredClone would make needless copies.
export function deepCopy(value) {
  if (Array.isArray(value)) return value.map(deepCopy)
  if (value && typeof value === 'object' && !(value instanceof Blob)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, deepCopy(item)]))
  }
  return value
}
