# marketplace

Parts, accessories, motors and headlights sold by the independent parts shops on FastFix. Customers and mechanics search across all shops, see which parts fit their car (including parts shared across models), and later preview accessories in 3D.

Used by `src/pages/Marketplace.jsx` (`/marketplace`), `src/pages/ShopPage.jsx` (`/shops/:shopId`) and `src/pages/PartsShopDashboard.jsx` (`/parts-shop`).

**Data access:** pages never import `mockData.js`. They load data with `useMarketplaceQuery(loadFn)` (`loadFn` receives the service and must be stable - module-level or `useCallback`) or get the service with `useMarketplaceService()`. Every service function returns a Promise, like the real API will. For now the data lives in React state in `MarketplaceProvider` (in memory only - a full page reload resets it). A part added on the dashboard shows up right away in the marketplace and on the shop's page, because every query reloads when the data changes.

| Path | Purpose |
| --- | --- |
| `marketplaceService.js` | `getShops`, `getShopById`, `getParts`, `getPartsByShop` (public), `getShopInventory` (own shop), `addPart`, `updatePart`, `deletePart` - mock for now |
| `MarketplaceProvider.jsx` | Holds the mock data in React state and provides the service (mounted in `app/AppProviders.jsx`) |
| `MarketplaceContext.js` | The context plus `useMarketplaceService()` and `useMarketplaceQuery()` |
| `searchParts.js` | Fuzzy search (fuse.js): multi-word, typos, part numbers in any format, ranking, "Did you mean" |
| `filters.js` | Filters, sorting, vehicle filter options, URL query string <-> filters, filter chips |
| `useMarketplaceFilters.js` | Hook that keeps the search and filters in the URL (`?q=...`) |
| `ownership.js` | `ownsShop`, `canManagePart` and the "You can only manage your own parts" message |
| `components/FilterPanel.jsx` | Vehicle, category, brand, type, condition, price, stock, shop and city filters |
| `components/FilterChips.jsx` | Active filters as removable chips |
| `components/PartCard.jsx` | One part: numbers, brand, condition, price, stock, shop, fitment, with matched words highlighted |
| `components/Highlight.jsx` | Marks matched words in a piece of text |
| `components/PartForm.jsx` | Parts shop form for adding a part or editing one of its own |
| `components/DeletePartDialog.jsx` | "Delete this part?" confirmation |
| `components/PartOwnerActions.jsx` | Edit/Delete on a part card - rendered only for the shop that owns the part |
| `constants.js` | Category, city, type, condition and sort option lists |
| `format.js` | ₪ price formatting and the "Fits: ..." compatibility line |
| `mockData.js` | Seed shops and parts for the mock service |
| `api.js` | Calls to apps/api for this feature (not implemented yet) |
| `types.js` | JSDoc types: `Shop`, `Part`, `Fitment` |

The search input is the shared `src/components/SearchBar.jsx` (also used by the mechanic and tow company directories).

## Ownership

Each parts shop manages only its own parts. A part belongs to the parts shop account whose id equals `part.shopId` (seeded shop accounts use the shop ids from `mockData.js`).

- `/parts-shop` lists only the logged-in shop's parts.
- `addPart`, `updatePart` and `deletePart` reject with "You can only manage your own parts" unless the logged-in user is an approved parts shop that owns the part.
- Edit/Delete buttons (`PartOwnerActions`) only render for the owner; everyone else sees "Ask about this part" (customers and mechanics) or nothing.
- These checks are UX only. `apps/api` must verify `part.shop_id` matches the logged-in user on every update and delete.

## Moderation and tags

- Admins can hide a part (`part.hidden = { reason, hiddenAt }`). Hidden parts are left out of `getParts`, `getPartsByShop` and requests; the owning shop still sees them, with the reason, through `getShopInventory` on `/parts-shop`.
- When a parts shop's account is suspended, its shop entry gets `suspended: true` and the shop and its parts disappear from every public read.
- `part.tagIds` are admin-assigned tags. `PartCard` shows them as badges, and the marketplace search matches tag names ("best seller"). Shops can't change `hidden` or `tagIds`.

## Search

- The query is split into words. Each word must match one of: part name, category, brand, compatible make or model, the start of a part number, or a fitment year ("2015").
- Typos: each word is fuzzy-matched against every word in those fields. Words of up to 3 letters must match exactly, 4-5 letters may have 1 typo, and longer words 2.
- Part numbers: spaces, dashes and dots are ignored, and so is case (`56110-1R000` = `561101r000` = `56110 1r000`). Both the OEM and the manufacturer number are checked.
- Ranking: exact part number match ("Exact part number match" label) → parts matching every word → partial matches.
- If no result matches every word without a typo, the closest make/model is offered as "Did you mean: Hyundai?".
