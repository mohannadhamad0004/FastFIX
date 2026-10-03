// Straight-line distances for the tow companies page.
// TODO: replace with real driving time (Mapbox or openrouteservice) in the backend phase
import { CITIES } from './cities.js'

const EARTH_RADIUS_KM = 6371
const toRadians = (degrees) => (degrees * Math.PI) / 180

/**
 * Great-circle distance between two points (haversine formula), in km.
 * @param {{ lat: number, lng: number }} a
 * @param {{ lat: number, lng: number }} b
 */
export function haversineKm(a, b) {
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

// 4.24 -> "4.2 km away", 0.3 -> "Less than 1 km away", 23.6 -> "24 km away"
export function formatDistance(km) {
  if (km < 1) return 'Less than 1 km away'
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km away`
}

/** The known city closest to a point, with its distance: { city, km }. */
export function nearestCity(point) {
  return CITIES.map((city) => ({ city, km: haversineKm(point, city) })).sort((a, b) => a.km - b.km)[0]
}
