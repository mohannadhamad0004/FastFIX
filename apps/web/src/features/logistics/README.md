# logistics

Tow and transport: the public directory of tow companies, and (later) matching a customer's tow
request to the nearest available truck.

| Path | Purpose |
| --- | --- |
| `pages/TowCompaniesDirectory.jsx` | `/tow-companies` - hero search (city / company name / my location), service filters, emergency button, results list + map, sort, then how it works, companies by city, featured, safety tips. City, name, service and sort are in the URL |
| `towSearch.js` | `findTowCompanies` (area, service, sort, distance), `companiesByCity`, `nearbyCoveredCities` - pure functions |
| `components/TowSearchHero.jsx`, `TowResults.jsx`, `TowSections.jsx` | The page's three parts |
| `components/TowMap.jsx`, `PickupMap.jsx` | Results map (company bases + customer) and the draggable pickup pin |
| `components/PickupField.jsx`, `DestinationField.jsx`, `useDestinations.js` | Pickup (pin + notes) and destination (mechanic / shop / address) in the "Request tow" form |
| `geo.js`, `cities.js`, `useGeolocation.js`, `mapTiles.js` | Haversine distance, Palestinian cities, browser location (localhost/https only; nothing stored), tiles |
| `pages/TowCompanyProfile.jsx` | `/tow-companies/:companyId` - logo, address, description, service area, approved trucks (photo, type, max weight), "Request tow" |
| `pages/TowTrucks.jsx` | `/tow/trucks` (tow companies only) - the company's trucks: add, edit, set status, remove |
| `components/TruckCard.jsx`, `components/TruckForm.jsx` | One truck on `/tow/trucks`; the add / edit form |
| `trucksService.js` | `getMyTrucks`, `addTruck`, `updateTruck`, `setTruckStatus`, `removeTruck` - mock |
| `TrucksProvider.jsx` / `TrucksContext.js` | Service + `useTrucksService()`, `useTrucksQuery()` - mounted by `TowTrucks` |
| `components/TowCompanyCard.jsx` | One company in the list: logo, name, cities, number and types of trucks |
| `searchTowCompanies.js` | Typo-tolerant search (uses `utils/wordSearch.js`) |
| `format.js` | Truck type labels and weights |
| `api.js` | Calls to apps/api (not implemented yet) |
| `types.js` | JSDoc types |

**Data:** tow companies are accounts, so for now they come from the mock auth service:
`getDirectory('tow')` and `getDirectoryEntry('tow', id)` (see `auth/authService.js`). They return
approved companies only, without contact details, plate numbers or truck documents.
`apps/api` must apply the same rules.

**Trucks** live on the tow company's account. Each has a `status` (available / en route / busy /
out of service, set by the company, not reviewed) and a `reviewStatus`. A new truck, or a new plate,
type, max weight, registration or insurance, is `pending` until an admin approves it on
`/admin/approvals` (Tow Companies tab, "Updates to review"); only approved trucks are public. A
truck on an active tow request can't be removed, and a company keeps at least one truck.
