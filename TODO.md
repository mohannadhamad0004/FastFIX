# FastFix — Full Project To-Do

Ordered by phase, not by date. Work top to bottom — each phase mostly depends on the one before it.

## Phase 0 — Setup (mostly done)
- [x] Decide stack: React (web), React Native (mobile), Node.js (backend), PostgreSQL
- [x] Repo created (FastFIX, GitHub), working branch `mohand`, PR-into-main workflow
- [x] Monorepo layout: `apps/{web,mobile,api}`, `packages/shared`
- [x] `.gitignore` covering `node_modules/`, `.env`, `.claude/`, `.idea/`
- [x] `CLAUDE.md` written with stack, roles, and folder conventions
- [x] `apps/web/src` skeleton scaffolded (`app/`, `auth/`, `authorization/`, `features/`, `components/`, `styles/`, etc.)
- [ ] Scaffold `apps/api/src` the same way: `modules/{auth,cars,diagnosis,marketplace,logistics,certification}`, plus `db/` and `config/`
- [ ] Scaffold `apps/mobile/src` mirroring the same feature names as web

## Phase 1 — Naming fix (do before building anything new)
- [ ] Rename "Driver" → **Tow** everywhere: role name (`driver` → `tow`), `DriverDashboard.jsx` → `TowDashboard.jsx`, route `/driver` → `/tow`
- [ ] Update the data model: Tow is a **company** account, not one truck — add a `Truck` entity (id, tow_company_id, plate, capacity, status) owned by a Tow account, the same way `Part` belongs to a Shop Owner
- [ ] Update `TransportRequest` to reference a specific `truck_id`, not directly a driver — matching now happens at the truck level, company level for assignment
- [ ] Update the earlier UML/ER diagrams and the old project-plan document to reflect the FastFix name and the Tow-as-company decision (they still say "Driver" and, in one case, the old project name)

## Phase 2 — Accounts, for every role (Customer, Mechanic, Shop Owner, Tow, Admin)
- [ ] Shared Sign-in page — one login form, redirects to the right dashboard by role
- [ ] Account page per role — view own account details (name/company name, email, role, approval status)
- [ ] Profile page per role — edit contact info; Shop Owner and Tow also edit company details (business name, logo)
- [ ] Tow's profile additionally manages its truck list (add/remove trucks, see each truck's status)
- [ ] Keep using mock data for now; wire to real auth once the backend `auth` module exists (Phase 3)

## Phase 3 — Backend core + database
- [ ] Set up PostgreSQL connection and migrations folder in `apps/api`
- [ ] Create tables from the schema we designed: `User`, `Car`, `VehicleVariant`, `ServiceRequest`, `AIAssessment`, `MechanicDiagnosis`, `Part`, `PartFitment`, `Certification`, `TransportRequest`, `Truck`
- [ ] Build the `auth` module: signup/login, password hashing, JWT (or session) issuing, role field, `approvalStatus` field
- [ ] Build the `cars` module: register a car, list a customer's cars, maintenance history endpoint
- [ ] Wire the frontend Sign-in/Account/Profile pages from Phase 2 to these real endpoints

## Phase 4 — AI diagnosis engine (Gemini)
- [ ] Get a Gemini API key from Google AI Studio; store as `GEMINI_API_KEY`, backend-only, never in web/mobile code
- [ ] Build the `diagnosis` backend module as its own isolated service: accepts photo/audio/video upload, calls Gemini with the mechanic system prompt, returns structured JSON (observations, candidate faults, urgency, recommended checks)
- [ ] Store the result in `AIAssessment`, linked to a `ServiceRequest`
- [ ] Frontend: replace the placeholder "report an issue" flow on the Customer dashboard with a real upload → AI report view
- [ ] Log every case where the mechanic's confirmed diagnosis disagrees with the AI's — this becomes your accuracy evaluation for the thesis

## Phase 5 — Mechanic workflow + certification
- [ ] Mechanic dashboard: list of `ServiceRequest`s with the AI pre-report, a "confirm/edit diagnosis" action → writes to `MechanicDiagnosis`
- [ ] Certification upload flow (Mechanic, Shop Owner, Tow): document upload → `Certification` record, status `pending`
- [ ] Admin dashboard: review pending certifications, approve/reject, sets `approvalStatus` on the `User`
- [ ] Add a "verification method" field on `Certification` (document-only / phone call / in-person) so the manual check you wanted is tracked, not just assumed

## Phase 6 — Marketplace (parts)
- [ ] Shop Owner: parts inventory CRUD (name, price, stock, category)
- [ ] `VehicleVariant` + `PartFitment` join table to support parts shared across multiple car models (e.g. VW)
- [ ] Customer + Mechanic: browse/search parts by compatibility, availability, price
- [ ] Link parts used to a `ServiceRequest` (the `ServiceRequestPart` join table)

## Phase 7 — Tow / logistics
- [ ] Tow company dashboard: manage trucks, see pending/active transport requests
- [ ] Customer: request a tow from a `ServiceRequest`
- [ ] Matching: find available trucks within range, rank by driving ETA (Mapbox or openrouteservice), not straight-line distance
- [ ] Truck status updates (available / en route / busy)

## Phase 8 — 3D accessory preview
- [ ] Curate a small set (3–10) of properly licensed GLB car models
- [ ] Define attachment anchors per model (headlights, bumpers, wheels, etc.)
- [ ] Build the preview with React Three Fiber on web; decide mobile approach (React Three Fiber Native or a simpler static/AR viewer)
- [ ] Accessory records reference `compatible_vehicle_model_ids`, `glb_url`, `attachment_anchor`, position/rotation/scale

## Phase 9 — Polish and academic deliverables
- [ ] Regenerate the UML class diagram and ER diagram with the Tow/Truck changes from Phase 1, save them into a `/docs` folder in the repo
- [ ] Keep the abstract (already submitted as a draft) in sync if the scope changes materially
- [ ] Write up the AI-vs-mechanic agreement log as evaluation data once Phase 4–5 have real usage

## Working habits (ongoing, not a phase)
- [ ] Small commits, one phase-item at a time — not one giant commit per phase
- [ ] Push to `mohand`, open a PR into `main`, merge after review — even solo
- [ ] Use Claude Code one scoped task at a time, review before moving to the next
