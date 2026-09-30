# authorization

What the logged-in user is allowed to see and do, based on their role:
`customer`, `mechanic`, `parts_shop`, `tow`, `admin`.

Kept separate from `../auth` (which only knows *who* the user is).
The client-side checks here are for UX only - apps/api enforces the real permissions.

| File | Purpose |
| --- | --- |
| `roles.js` | The five role values (`ROLES`), their display labels (`ROLE_LABELS`) and dashboards (`ROLE_HOME_PATHS`) |
| `permissions.js` | Which role can do which action |
| `ProtectedRoute.jsx` | Route wrapper: logged out -> `/login`, not approved -> `/pending-approval`, wrong role -> own dashboard |
| `usePermission.js` | Hook to show/hide UI based on a permission |
