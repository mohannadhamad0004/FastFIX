// New empty entries for the lists in the signup form. The id is only a stable React key.
// (A counter rather than crypto.randomUUID, which is missing on plain-http LAN addresses.)
let lastId = 0
const newId = () => `entry-${++lastId}`

export const newSkill = (skill) => ({ id: newId(), skill, years: '', certificate: null })

export const newTruck = () => ({
  id: newId(),
  plateNumber: '',
  type: '',
  maxWeightKg: '',
  photos: [],
  registration: null,
  insurance: null,
})
