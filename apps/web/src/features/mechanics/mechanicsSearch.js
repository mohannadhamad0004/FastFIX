import { CITIES } from '../logistics/cities.js'
import { haversineKm } from '../logistics/geo.js'
import { compareRatings } from '../requests/ratings.js'
import { searchMechanics } from './searchMechanics.js'

// Filtering, sorting and counting for /mechanics. Pure functions, so the page stays small.
// TODO: replace with real API call (GET /api/mechanics?q=&city=&skill=&make=&lat=&lng=) in the backend phase

const same = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase()

/** The mechanic works in this city: their workshop is there, or they drive there for on-site jobs. */
export const worksIn = (mechanic, cityName) =>
  same(mechanic.city, cityName) || mechanic.onSiteCities.some((name) => same(name, cityName))

export const hasSkill = (mechanic, skill) => mechanic.skills.some((s) => s.skill === skill)
export const knowsMake = (mechanic, make) => mechanic.makes.some((name) => same(name, make))

/**
 * The mechanics to show, each with its distance from `origin` (null when there is none).
 * @param {import('./types.js').PublicMechanic[]} mechanics  approved mechanics only (the directory)
 * @param {Object} options
 * @param {'problem' | 'city' | 'location'} options.mode
 * @param {string} options.query          text of the problem / skill search
 * @param {string[]} options.symptomSkills  skills matched from the problem (symptoms.js); when set they replace the text search
 * @param {string} options.city
 * @param {{ lat: number, lng: number } | null} options.origin
 * @param {string} options.skill          chosen skill ('' for any)
 * @param {string} options.serviceMode    chosen service mode ('' for any)
 * @param {string} options.make           chosen car make ('' for any)
 * @param {'match' | 'nearest' | 'rating'} options.sort
 * @param {Object} options.index          from createMechanicIndex
 * @param {Object<string, { average: number, count: number }>} options.ratings
 * @returns {{ item: Object, distanceKm: number | null }[]}
 */
export function findMechanics(mechanics, { mode, query, symptomSkills, city, origin, skill, serviceMode, make, sort, index, ratings }) {
  let found = mechanics
  if (mode === 'problem' && query.trim()) {
    found = symptomSkills.length ? mechanics.filter((m) => symptomSkills.some((s) => hasSkill(m, s))) : searchMechanics(index, query)
  }
  if (mode === 'city' && city) found = found.filter((m) => worksIn(m, city))
  if (skill) found = found.filter((m) => hasSkill(m, skill))
  if (serviceMode) found = found.filter((m) => m.serviceModes.includes(serviceMode))
  if (make) found = found.filter((m) => knowsMake(m, make))

  const withDistance = found.map((m) => ({ item: m, distanceKm: origin && m.base ? haversineKm(origin, m.base) : null }))
  const sorters = {
    nearest: (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
    rating: (a, b) => compareRatings(ratings[a.item.id], ratings[b.item.id]), // under 3 reviews: after rated ones
  }
  // "Best match" keeps the order found (the search puts the closest match first)
  return sorters[sort] ? withDistance.sort(sorters[sort]) : withDistance
}

/** Mechanics per city (workshop or on-site area), most first: [{ city, count }], cities with a mechanic only. */
export function mechanicsByCity(mechanics) {
  return CITIES.map((city) => ({ city, count: mechanics.filter((m) => worksIn(m, city.name)).length }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count || a.city.name.localeCompare(b.city.name))
}

/** Up to `limit` other cities near `origin` that have a mechanic, closest first. */
export function nearbyMechanicCities(mechanics, origin, exclude, limit = 3) {
  return mechanicsByCity(mechanics)
    .filter(({ city }) => !exclude || !same(city.name, exclude))
    .map(({ city }) => ({ city, km: origin ? haversineKm(origin, city) : 0 }))
    .sort((a, b) => a.km - b.km)
    .slice(0, limit)
    .map(({ city }) => city)
}

/** How many mechanics have each approved skill: { Engine: 4, ... }. */
export function skillCounts(mechanics) {
  const counts = {}
  for (const m of mechanics) for (const { skill } of m.skills) counts[skill] = (counts[skill] ?? 0) + 1
  return counts
}

/** Every car make some mechanic specializes in, alphabetical. */
export const allMakes = (mechanics) => [...new Set(mechanics.flatMap((m) => m.makes))].sort((a, b) => a.localeCompare(b))
