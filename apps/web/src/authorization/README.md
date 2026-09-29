# authorization

What the logged-in user is allowed to see and do, based on their role:
`customer`, `mechanic`, `shop_owner`, `tow`, `admin`.

Kept separate from `../auth` (which only knows *who* the user is).
The client-side checks here are for UX only - apps/api enforces the real permissions.

| File | Purpose |
| --- | --- |
| `roles.js` | The five role names |
| `permissions.js` | Which role can do which action |
| `ProtectedRoute.jsx` | Route wrapper that redirects users without the needed role |
| `usePermission.js` | Hook to show/hide UI based on a permission |
