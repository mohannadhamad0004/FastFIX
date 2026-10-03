# admin

The admin area at `/admin/*` (admins only, sidebar layout).

| Route | Page | What it does |
| --- | --- | --- |
| `/admin` | `AdminOverview` | Pending approvals by role, approved mechanics / shops / tow companies, parts listed, requests today, 5 newest pending signups |
| `/admin/approvals` | `AdminApprovals` | Tabs: Mechanics, Parts Shops, Tow Companies and History. Each role tab has **New signups** (review everything submitted; approve/reject each mechanic skill, with a reason for rejected skills; verification method required to approve; optional admin note; reject asks for a reason the user sees) and **Updates to review** from approved accounts: changed business/workshop names and licenses, new or re-certified skills, new or edited trucks - each approved or rejected (with a reason) on its own |
| `/admin/users` | `AdminUsers` | All accounts with search and role filter; view, suspend / reactivate |
| `/admin/users/:userId` | `AdminUserDetails` | Status, verification record, suspension, tags (mechanics, tow companies), all submitted details |
| `/admin/tags` | `AdminTags` | Part / mechanic / tow tags: create, rename, recolor, delete |
| `/admin/listings` | `AdminListings` | All parts from all shops, searchable, visible/hidden filter |
| `/admin/listings/:partId` | `AdminListingDetails` | Public card preview, tags, hide (with reason) / unhide |
| `/admin/reviews` | `AdminReviews` | Every review (visible / hidden filter); hide with a reason, unhide |
| `/admin/requests` | `AdminRequests` | Read-only table of every request |

## Data

`adminService.js` (mock, `// TODO: replace with real API calls`) does everything above. Every
function first checks that the logged-in user is an approved, non-suspended admin. Like the
api's admin module reading the database, the mock reads and writes the other providers' raw
stores, which `AdminProvider.jsx` passes in. Pages load data with `useAdminQuery(load)` and get the
service with `useAdminService()` (`AdminContext.js`); queries reload when any of that data changes.

Rules (also in the root `CLAUDE.md`): per-skill approval, verification method required to
approve, suspended accounts can't log in and aren't public, hidden parts aren't public.

| Path | Purpose |
| --- | --- |
| `adminService.js` | All admin calls (mock) |
| `AdminProvider.jsx` / `AdminContext.js` | Service + `useAdminService()`, `useAdminQuery()` - mounted by `AdminLayout` |
| `constants.js` | Tag types, tag colors (white-text safe), approval tabs |
| `mockTags.js` | Seed tags (tag definitions live in `src/context/TagsProvider.jsx`, since public pages show them) |
| `components/AdminLayout.jsx` | Sidebar + outlet |
| `components/AccountReview.jsx` | The approve/reject panel (per-skill decisions, verification method, note) |
| `components/UpdateReview.jsx` | Approve/reject each update of an approved account (old vs new name, license, skill, truck) |
| `components/TagPicker.jsx` | Assign tags to one part, mechanic or tow company |
| `components/TagForm.jsx` | Name + color form |
| `components/ReasonDialog.jsx` | "Why?" dialog for reject / hide / suspend |
| `components/SuspendButton.jsx` | Suspend (optional reason) / Reactivate |
| `components/AdminPage.jsx`, `AdminTabs.jsx`, `AdminTable.jsx`, `AccountStatusBadges.jsx` | Shared admin UI |
| `pages/` | The pages in the table above |
| `api.js`, `types.js` | Placeholders for the real API |
