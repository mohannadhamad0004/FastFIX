// Map tiles for the tow companies map and the pickup pin.
// TODO: OpenStreetMap's public tiles are for development only (their usage policy forbids heavy
// use). Production needs a proper tile provider (e.g. MapTiler, Stadia, Mapbox) - see CLAUDE.md.
export const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

// The middle of the West Bank, when there is nothing to show yet.
export const DEFAULT_CENTER = [32.0, 35.25]
