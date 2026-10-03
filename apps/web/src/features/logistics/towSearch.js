import { CITIES } from './cities.js'
import { compareRatings } from '../requests/ratings.js'
import { haversineKm, nearestCity } from './geo.js'
import { searchTowCompanies } from './searchTowCompanies.js'

// Filtering and sorting for /tow-companies. Pure functions, so the page stays small.
// TODO: replace with real API call (GET /api/tow-companies?city=&lat=&lng=&service=) in the backend phase

const same = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase()
const covers = (company, cityName) => company.serviceArea.some((name) => same(name, cityName))

/**
 * The companies to show, each with its distance from `origin` (null when there is no origin).
 * @param {import('./types.js').PublicTowCompany[]} companies  approved companies only (the directory)
 * @param {Object} options
 * @param {'city' | 'name' | 'location'} options.mode
 * @param {string} options.city              searched city (mode "city")
 * @param {string} options.query             company name (mode "name")
 * @param {{ lat: number, lng: number } | null} options.origin  city centre or the user's position
 * @param {string} options.service           a TOW_SERVICES value, or ''
 * @param {boolean} options.emergency        only companies with a truck available now
 * @param {'nearest' | 'rating' | 'trucks'} options.sort
 * @param {Object} options.index             from createTowCompanyIndex
 * @param {Object<string, { average: number, count: number }>} options.ratings
 * @returns {{ item: Object, distanceKm: number | null }[]}  item is the company
 */
export function findTowCompanies(companies, { mode, city, query, origin, service, emergency, sort, index, ratings }) {
  let found = companies
  if (mode === 'name') found = searchTowCompanies(index, query)
  // A location counts as the city closest to it: the company must cover that city.
  const area = mode === 'city' ? city : mode === 'location' && origin ? nearestCity(origin).city.name : ''
  if (area) found = found.filter((company) => covers(company, area))
  if (service) found = found.filter((company) => company.towServices?.includes(service))
  if (emergency) found = found.filter((company) => company.availableTrucks > 0)

  const withDistance = found.map((company) => ({
    item: company,
    distanceKm: origin && company.base ? haversineKm(origin, company.base) : null,
  }))
  const sorters = {
    nearest: (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
    rating: (a, b) => compareRatings(ratings[a.item.id], ratings[b.item.id]), // under 3 reviews: after rated ones
    trucks: (a, b) => b.item.availableTrucks - a.item.availableTrucks,
  }
  // Any other `sort` (e.g. "") keeps the order found: best name match first.
  return sorters[sort] ? withDistance.sort(sorters[sort]) : withDistance
}

/** Companies per city they cover, most first: [{ city, count }], only cities with a company. */
export function companiesByCity(companies) {
  return CITIES.map((city) => ({ city, count: companies.filter((company) => covers(company, city.name)).length }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count || a.city.name.localeCompare(b.city.name))
}

/** Up to `limit` other cities near `origin` that have a company, closest first. */
export function nearbyCoveredCities(companies, origin, exclude, limit = 3) {
  return companiesByCity(companies)
    .filter(({ city }) => !exclude || !same(city.name, exclude))
    .map(({ city }) => ({ city, km: origin ? haversineKm(origin, city) : 0 }))
    .sort((a, b) => a.km - b.km)
    .slice(0, limit)
    .map(({ city }) => city)
}
