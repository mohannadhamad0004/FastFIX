# marketplace module

Parts catalog, shop inventory, and part fitment: which parts fit which car models, including parts shared across models (for example across Volkswagen models).

| File | Purpose |
| --- | --- |
| `marketplace.routes.js` | Express router: URLs and which controller handles them |
| `marketplace.controller.js` | Reads the request, calls the service, sends the response |
| `marketplace.service.js` | Business logic |
| `marketplace.model.js` | Database queries for this module |
