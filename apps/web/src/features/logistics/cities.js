// Palestinian cities and towns offered in the tow companies city search, with approximate
// coordinates of their centre (good enough for distance sorting and the map; not for navigation).
// TODO: move to the api with the tow company service areas.

/** @typedef {{ name: string, lat: number, lng: number }} City */

/** @type {City[]} */
export const CITIES = [
  { name: 'Nablus', lat: 32.2211, lng: 35.2544 },
  { name: 'Ramallah', lat: 31.9038, lng: 35.2034 },
  { name: 'Al-Bireh', lat: 31.91, lng: 35.216 },
  { name: 'Jenin', lat: 32.461, lng: 35.3027 },
  { name: 'Tulkarm', lat: 32.3104, lng: 35.0286 },
  { name: 'Qalqilya', lat: 32.1897, lng: 34.9706 },
  { name: 'Hebron', lat: 31.5326, lng: 35.0998 },
  { name: 'Bethlehem', lat: 31.7054, lng: 35.2024 },
  { name: 'Beit Sahour', lat: 31.7, lng: 35.225 },
  { name: 'Beit Jala', lat: 31.715, lng: 35.187 },
  { name: 'Jericho', lat: 31.8611, lng: 35.4617 },
  { name: 'Salfit', lat: 32.0833, lng: 35.1806 },
  { name: 'Tubas', lat: 32.3209, lng: 35.3698 },
  { name: 'Tammun', lat: 32.2839, lng: 35.3839 },
  { name: 'Birzeit', lat: 31.972, lng: 35.196 },
  { name: 'Halhul', lat: 31.58, lng: 35.1 },
  { name: 'Yatta', lat: 31.4469, lng: 35.095 },
  { name: 'Dura', lat: 31.5061, lng: 35.0283 },
  { name: 'Anabta', lat: 32.3069, lng: 35.1189 },
  { name: 'Qabatiya', lat: 32.41, lng: 35.2806 },
  { name: 'Azzun', lat: 32.1736, lng: 35.0611 },
  { name: 'Huwara', lat: 32.1531, lng: 35.2564 },
]

const same = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase()

/** The city with this name (any letter case), or null. */
export const findCity = (name) => CITIES.find((city) => same(city.name, name)) ?? null
