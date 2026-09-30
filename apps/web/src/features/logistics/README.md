# logistics

Tow and transport: the public directory of tow companies, and (later) matching a customer's tow
request to the nearest available truck.

| Path | Purpose |
| --- | --- |
| `pages/TowCompaniesDirectory.jsx` | `/tow-companies` - list with search by name and cities covered |
| `pages/TowCompanyProfile.jsx` | `/tow-companies/:companyId` - logo, description, service area, trucks (photo, type, max weight), "Request tow" |
| `components/TowCompanyCard.jsx` | One company in the list: logo, name, cities, number and types of trucks |
| `searchTowCompanies.js` | Typo-tolerant search (uses `utils/wordSearch.js`) |
| `format.js` | Truck type labels and weights |
| `api.js` | Calls to apps/api (not implemented yet) |
| `types.js` | JSDoc types |

**Data:** tow companies are accounts, so for now they come from the mock auth service:
`getDirectory('tow')` and `getDirectoryEntry('tow', id)` (see `auth/authService.js`). They return
approved companies only, without contact details, plate numbers or truck documents.
`apps/api` must apply the same rules.
