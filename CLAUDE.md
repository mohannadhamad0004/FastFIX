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
- **AI provider keys stay on the server.** Only `apps/api` calls the AI provider, reading the key from environment variables (`.env`, template in `.env.example`). Web, mobile and `packages/shared` never contain keys or call the provider directly.
- Only `apps/api/src/modules/diagnosis` talks to the AI provider (through `ai-provider.js`). Other modules must not import it.
- **Admin rules** (enforce them in apps/api too; the web checks are UX only):
  - Only the `admin` role can open `/admin/*` or call admin functions (`features/admin/adminService.js` checks this on every call).
  - Mechanic skills are approved or rejected one by one (`skill.status`). A mechanic needs at least one approved skill to be approved, and only approved skills are shown publicly.
  - A verification method (documents only / phone call / video call / in-person visit) is required before approving an account; it is stored with the optional admin note and shown in the approvals history.
  - Suspended users can't log in and are hidden from every public page (directories, profiles, and a suspended parts shop's shop page and parts). Pending and rejected accounts are never public either.
  - Parts hidden by an admin disappear from the marketplace; the owning shop sees the admin's reason on its dashboard. Tags and `hidden` are admin-only fields.
  - After approval, these go back to "pending review" one by one on `/admin/approvals` ("Updates to review"): a changed business name (parts shop, tow), workshop name (mechanic) or business license (`account.pendingChanges` - the approved value stays public until approved); a new skill or new certificate (the skill is hidden until approved); a new truck, or a new plate, type, weight or truck document (hidden until approved). Photos, descriptions, addresses, service modes and truck status are not reviewed. Rejections need a reason the owner sees.
  - A tow truck on an active tow request can't be removed.
  - Reviews: only the customer of a completed request, once per request, 1-5 stars + optional comment; the reviewed account replies once; admins hide reviews with a reason (`/admin/reviews`) and hidden reviews leave the public pages and averages.
- **Parts ownership:** each parts shop can manage only its own parts (`part.shopId` is the shop account's id). Ownership checks must also be enforced in the backend (apps/api): every update/delete verifies part.shop_id matches the logged-in user. Frontend checks are only for UX, not security.
- JavaScript, not TypeScript: `.jsx` for components, `.js` otherwise. Describe data shapes with JSDoc in `types.js` files.
- Styling: CSS Modules (`Component.module.css` next to `Component.jsx`). Global styles only in `apps/web/src/styles/` (`variables.css`, `reset.css`, `global.css`).
  - Design tokens in `variables.css` (colors with dark mode via `prefers-color-scheme`, type scale, 4px spacing, radius, shadows, `--focus-ring`). Use tokens, not raw colors or sizes; text/background pairs must pass WCAG AA (the orange accent needs dark text, not white).
  - Build UI from the shared components in `apps/web/src/components/`: `Button` (primary = orange main action, secondary, ghost, danger; sizes; `loading`), `Card`, `Input`, `Textarea`, `Select`, `TextField` (label + hint + error), `Badge`/`StatusBadge`, `Tabs`/`TabPanel`, `Skeleton`/`SkeletonRows`/`SkeletonCards`, `EmptyState`, `Notice`, `useToast()` (success/error toasts), `Modal`, `Drawer`, `SectionCard` (titled card section for settings/profile pages).
  - Mobile first; check 375px, 768px and 1280px.

## apps/web/src

- `app/` - `App.jsx`, `AppProviders.jsx`, `routes.jsx` (React Router v8 data router: `createBrowserRouter` from `react-router`, `RouterProvider` from `react-router/dom`). All routes render inside `components/Layout/Layout.jsx` (Navbar + `<Outlet />`).
- `pages/` - routed page components (`Home.jsx`, `CustomerDashboard.jsx`, ...), each with its `*.module.css`. Pages compose components from `features/`; domain logic stays in `features/`. Mock data in pages is marked `// TODO: replace with real API call`.
- `auth/` - who the user is (login, signup, session). `authorization/` - what they may do (roles, permissions, `ProtectedRoute`, `usePermission`). Keep these two separate. Client-side checks are UX only; the api enforces permissions.
- `features/<name>/` - `cars`, `diagnosis`, `marketplace`, `logistics`, `certification`, `admin`, `mechanics`, `requests`, `preview3d`. Each has `components/`, `pages/`, `api.js`, `types.js`, `README.md`. Feature code stays inside its folder; shared UI goes in `components/`.
- Maps (`features/logistics`: results map, pickup pin): react-leaflet with OpenStreetMap's public tiles (`mapTiles.js`), fine for development only. **Production needs a proper tile provider** (e.g. MapTiler, Mapbox) - OSM's tile usage policy forbids heavy use. Distances are straight-line (haversine, `geo.js`); real driving time comes from the backend (Mapbox or openrouteservice). The customer's location is never stored except the pin they confirm in a tow request.
- Emergency (`features/requests/emergency`): the red Emergency button (navbar, tow and mechanics pages) opens a full-screen emergency screen; `mockDispatchService.js` (mock now, backend + WebSockets later) offers the request to the nearest 3 tow trucks or on-site mechanics within 15 km, then 30 and 50 km. Tow companies and mechanics answer it at the top of their dashboards. Emergency maps use Google Maps when `VITE_GOOGLE_MAPS_API_KEY` is set (`apps/web/.env.local`, template in `.env.example`), else the Leaflet map. **The Google Maps browser key must be restricted to our website domains (HTTP referrers) in Google Cloud Console**, and limited to the Maps JavaScript and Directions APIs; it is visible in the browser, unlike the server-side keys. The api must enforce who may accept, one active emergency per user or phone number, and show the customer's phone only after acceptance.
- Public pages (no login): `/marketplace`, `/shops/:shopId`, `/mechanics(/:id)` (`features/mechanics/pages`), `/tow-companies(/:id)` (`features/logistics/pages`). Only approved accounts appear publicly, without contact details or documents. Customers have no dashboard: after login they go to `/`; other roles reach their dashboard from the account menu.
- Logged-in pages for every role (account menu): `/account` (private: email, phone, password, log out everywhere, theme, notifications; pending/rejected accounts too) and `/profile` (public info, with "View public profile"). Tow companies also have `/tow/trucks`. Mock logic: `auth/profileService.js`, `features/logistics/trucksService.js`. Mechanics offer service modes (on-site / workshop visit / online consultation); customers pick one in "Request service".
- Customer menu: `/my-cars` (features/cars), `/ai-agent` (features/diagnosis), `/chats`, `/reports` (features/requests). Mechanics, parts shops and tow companies also have `/chats`. Every request has one chat; the provider marks it completed there, then the customer can review and gets a printable report. Chats, reviews and reports live in `features/requests` (no new feature folders, so `apps/mobile` stays in sync).
- `components/` shared UI, `hooks/`, `context/`, `api/` (central axios instance + interceptors), `config/`, `utils/`.

## apps/mobile/src

`features/` uses the **same folder names** as `apps/web/src/features`, with `screens/` instead of `pages/`. Keep the names in sync when adding a feature.

## apps/api/src

- `modules/<name>/` - `auth`, `cars`, `diagnosis`, `marketplace`, `logistics`, `certification`, `mechanics` (public directory). Each has `<name>.routes.js`, `<name>.controller.js`, `<name>.service.js`, `<name>.model.js`, `README.md`.
  - routes -> controller (HTTP in/out) -> service (business logic) -> model (SQL). Don't skip layers.
  - `auth/` also holds `roles.js` and `permissions.middleware.js`.
  - `marketplace/` owns part fitment, including parts shared across car models.
- `db/` - `connection.js` (pg pool; without `DATABASE_URL` an in-memory PGlite database from `memoryDatabase.js`, migrated and seeded on start), `migrations/` (`npm run db:migrate`), `seed.js` (`npm run db:seed`, from the web mock data).
- `search/` - shared search engine (pg_trgm + levenshtein, synonyms, part numbers, fitment) used by the marketplace, mechanics and logistics models. Public reads go through the `public_*` views in `002_search.sql`, which enforce visibility. Tests: `npm test -w @fastfix/api` (PGlite, no server needed).
- `config/` - environment variable loading.
