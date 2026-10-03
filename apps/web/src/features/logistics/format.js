import { TRUCK_TYPES } from '../../auth/signup/constants.js'

export const truckTypeLabel = (value) => TRUCK_TYPES.find((type) => type.value === value)?.label ?? value

// ["flatbed", "flatbed", "wheel_lift"] -> "Flatbed, Wheel-lift"
export const truckTypesSummary = (trucks) => [...new Set(trucks.map((truck) => truckTypeLabel(truck.type)))].join(', ')

export const formatWeight = (kg) => `${Number(kg).toLocaleString('en')} kg`
