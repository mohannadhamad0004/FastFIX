# mechanics module

The public mechanics directory (`/mechanics` on the web). Only approved, non-suspended mechanics with at least one approved skill appear, with approved skills only and no contact details or certificates. Reviewing mechanics and their skills belongs to the `certification` module.

| File | Purpose |
| --- | --- |
| `mechanics.routes.js` | `GET /api/mechanics?q=` |
| `mechanics.controller.js` | Reads the request, calls the service, sends the response |
| `mechanics.service.js` | Business logic |
| `mechanics.model.js` | Search over the `public_mechanic_search` view (name, workshop, city, approved skills, tags) with the shared engine in `src/search/` |
