# logistics module

Tow/transport requests: create a request, match the nearest available tow company, track status.

| File | Purpose |
| --- | --- |
| `logistics.routes.js` | Express router: URLs and which controller handles them |
| `logistics.controller.js` | Reads the request, calls the service, sends the response |
| `logistics.service.js` | Business logic |
| `logistics.model.js` | Database queries for this module |
