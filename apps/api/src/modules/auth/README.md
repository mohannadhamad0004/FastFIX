# auth module

Signup, login, sessions/tokens, and role-based access control for the five roles: customer, mechanic, shop_owner, tow, admin.

| File | Purpose |
| --- | --- |
| `auth.routes.js` | Express router: URLs and which controller handles them |
| `auth.controller.js` | Reads the request, calls the service, sends the response |
| `auth.service.js` | Business logic |
| `auth.model.js` | Database queries for this module |
| `roles.js` | Role names: customer, mechanic, shop_owner, tow, admin |
| `permissions.middleware.js` | Express middleware: rejects requests whose user role lacks the required permission |
