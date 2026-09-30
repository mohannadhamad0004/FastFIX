# FastFix

Car-maintenance marketplace (graduation project). Customers upload a photo, video or audio of a car problem, an AI gives a preliminary diagnosis, and a mechanic confirms or corrects it. FastFix is a community platform hosting many independent parts shops (each with its own account) that sell parts; tow companies tow cars; admins verify certifications.

Roles (exact spelling): `customer`, `mechanic`, `parts_shop`, `tow`, `admin`. In web code use the constants in `apps/web/src/authorization/roles.js` (`ROLES`, `ROLE_LABELS`).
`parts_shop` and `tow` are company accounts, not individuals. Old names - don't reintroduce them: "driver" (now `tow`) and "shop owner"/`shop_owner` (now `parts_shop`).
- Parts Shop UI: page `PartsShopDashboard.jsx`, route `/parts-shop`, label "Parts Shop".
- Tow UI: page `TowDashboard.jsx`, route `/tow`, label "Tow" / "Tow company".
- Public marketplace: `/marketplace` (search parts across all shops) and `/shops/:shopId` (one shop's public page). Prices are in ILS (₪).

## Layout

```
apps/web/          React web app (Vite, JavaScript, CSS Modules)
apps/mobile/       React Native app (not initialized yet - only feature folders exist)
apps/api/          Node.js + Express backend, PostgreSQL
packages/shared/   Types, API client and validation shared by web + mobile
```

npm workspaces from the root: `npm install`, then `npm run dev` starts api (:4000) and web (:5173). The web dev server proxies `/api` to the api.

## Rules

- **Do not create new top-level folders without asking first.**
- **AI provider keys stay on the server.** Only `apps/api` calls the AI provider, reading the key from environment variables (`apps/api/.env`, template in `.env.example`). Web, mobile and `packages/shared` never contain keys or call the provider directly.
- Only `apps/api/src/modules/diagnosis` talks to the AI provider (through `ai-provider.js`). Other modules must not import it.
- **Admin rules** (enforce them in apps/api too; the web checks are UX only):
  - Only the `admin` role can open `/admin/*` or call admin functions (`features/admin/adminService.js` checks this on every call).
  - Mechanic skills are approved or rejected one by one (`skill.status`). A mechanic needs at least one approved skill to be approved, and only approved skills are shown publicly.
  - A verification method (documents only / phone call / video call / in-person visit) is required before approving an account; it is stored with the optional admin note and shown in the approvals history.
  - Suspended users can't log in and are hidden from every public page (directories, profiles, and a suspended parts shop's shop page and parts). Pending and rejected accounts are never public either.
  - Parts hidden by an admin disappear from the marketplace; the owning shop sees the admin's reason on its dashboard. Tags and `hidden` are admin-only fields.
- **Parts ownership:** each parts shop can manage only its own parts (`part.shopId` is the shop account's id). Ownership checks must also be enforced in the backend (apps/api): every update/delete verifies part.shop_id matches the logged-in user. Frontend checks are only for UX, not security.
- JavaScript, not TypeScript: `.jsx` for components, `.js` otherwise. Describe data shapes with JSDoc in `types.js` files.
- Styling: CSS Modules (`Component.module.css` next to `Component.jsx`). Global styles only in `apps/web/src/styles/` (`variables.css`, `reset.css`, `global.css`).

## apps/web/src

- `app/` - `App.jsx`, `AppProviders.jsx`, `routes.jsx` (React Router v8 data router: `createBrowserRouter` from `react-router`, `RouterProvider` from `react-router/dom`). All routes render inside `components/Layout/Layout.jsx` (Navbar + `<Outlet />`).
- `pages/` - routed page components (`Home.jsx`, `CustomerDashboard.jsx`, ...), each with its `*.module.css`. Pages compose components from `features/`; domain logic stays in `features/`. Mock data in pages is marked `// TODO: replace with real API call`.
- `auth/` - who the user is (login, signup, session). `authorization/` - what they may do (roles, permissions, `ProtectedRoute`, `usePermission`). Keep these two separate. Client-side checks are UX only; the api enforces permissions.
- `features/<name>/` - `cars`, `diagnosis`, `marketplace`, `logistics`, `certification`, `admin`, `mechanics`, `requests`, `preview3d`. Each has `components/`, `pages/`, `api.js`, `types.js`, `README.md`. Feature code stays inside its folder; shared UI goes in `components/`.
- Public pages (no login): `/marketplace`, `/shops/:shopId`, `/mechanics(/:id)` (`features/mechanics/pages`), `/tow-companies(/:id)` (`features/logistics/pages`). Only approved accounts appear publicly, without contact details or documents. Customers have no dashboard: after login they go to `/`; other roles reach their dashboard from the account menu.
- `components/` shared UI, `hooks/`, `context/`, `api/` (central axios instance + interceptors), `config/`, `utils/`.

## apps/mobile/src

`features/` uses the **same folder names** as `apps/web/src/features`, with `screens/` instead of `pages/`. Keep the names in sync when adding a feature.

## apps/api/src

- `modules/<name>/` - `auth`, `cars`, `diagnosis`, `marketplace`, `logistics`, `certification`. Each has `<name>.routes.js`, `<name>.controller.js`, `<name>.service.js`, `<name>.model.js`, `README.md`.
  - routes -> controller (HTTP in/out) -> service (business logic) -> model (SQL). Don't skip layers.
  - `auth/` also holds `roles.js` and `permissions.middleware.js`.
  - `marketplace/` owns part fitment, including parts shared across car models.
- `db/` - `connection.js` (pg pool) and `migrations/`.
- `config/` - environment variable loading.
