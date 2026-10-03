# marketplace module

Parts catalog, shop inventory, and part fitment: which parts fit which car models, including parts shared across models (for example across Volkswagen models).

| File | Purpose |
| --- | --- |
| `marketplace.routes.js` | Express router: URLs and which controller handles them |
| `marketplace.controller.js` | Reads the request, calls the service, sends the response |
| `marketplace.service.js` | Business logic ("Did you mean" suggestions) |
| `marketplace.model.js` | Database queries for this module (part search over `public_part_search`) |

## Endpoints

- `GET /api/marketplace/parts?q=` (public): searches parts across all shops, best match first, as `{ results: [{ part, shop, exact, matchType, highlight }], suggestion }`. An empty `q` returns every public part. Hidden parts and parts of pending, rejected or suspended shops are never returned. How the search works: `src/search/README.md`.

Fitment tables: `vehicle_makes` → `vehicle_models` → `vehicle_variants` (a model over a year range) ← `part_fitments` → `parts`.
