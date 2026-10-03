# preview3d

"View on my car in 3D" in the marketplace. **Placeholder viewer only** - no real 3D yet
(`// TODO: replace with React Three Fiber viewer loading GLB files`).

- A floating button (bottom-right of `/marketplace`) opens a drawer from the right.
- First question: how to get the car model.
  - **Use a ready model** (recommended): choose make, model and year. If we have a ready model for
    it (`carModels.js`), it loads. If not: "We don't have a 3D model for this car yet", with the
    closest models we have and a way to scan instead.
  - **Scan my own car (beta)**: for customers, for one of their cars in My Cars. Capture guide,
    photos (20-120, up to 10 MB each) or one video (up to 2 minutes), privacy notice. Status:
    Uploaded -> Processing (estimated time) -> Ready / Failed with a reason, plus a notification.
    Scans show in My Cars under the car as "3D model (scanned)".
- Placement:
  - Ready model: parts snap to named attachment points (`attachmentPoints.js`). Wheels and lights
    replace the originals; a second part for the same point replaces the first.
  - Scanned model: parts are added on top and placed by hand (move, rotate, resize sliders).
    Original parts can't be removed.
- Workspace: the loaded model, the accessories with Remove, the total, Reset, Take a screenshot
  (disabled for now) and "Ask the shop about these parts" (one question per shop).
- Part cards show "Add to 3D preview" only for Lighting, Body, Accessories and Tires & Wheels
  parts that fit the chosen car.
- The selection lives in `Preview3DProvider`, scans in `ScansProvider` (both in
  `app/AppProviders.jsx`). Memory only.

| Path | Purpose |
| --- | --- |
| `Preview3DProvider.jsx` / `Preview3DContext.js` | Model source, car, ready model, scan, parts and their transforms, drawer state; `usePreview3D()` |
| `carModels.js` | Ready model catalogue, `findReadyModel`, `closestModels` |
| `attachmentPoints.js` | Named attachment points and which replace the original |
| `accessoryData.js` | `placementType`, `attachmentAnchor`, `defaultPosition/Rotation/Scale`, `glbUrl` per part |
| `scanService.js`, `ScansProvider.jsx` / `ScansContext.js`, `scanConstants.js` | Mock scans: `uploadScan`, `getScanStatus`, `getMyScans`, `deleteScan` (simulated processing) |
| `fitment.js` | Previewable categories and "does this part fit this car" |
| `components/Preview3DDrawer.jsx` | The drawer: ModelChoice, then ReadyModelStep or ScanStep |
| `components/PreviewWorkspace.jsx` | Accessories list, total, buttons, viewer placeholder |
| `components/AccessoryControls.jsx` | Move / rotate / resize on scanned cars |
| `components/ScanUploadForm.jsx`, `ScanStatusCard.jsx` | New scan, and one scan's status |
| `components/AskShopsButton.jsx` | "Ask the shop about these parts" |
| `components/ViewerPlaceholder.jsx` | Where the React Three Fiber canvas will go |

Scanning: the backend will send the photos/video to a 3D scanning API (e.g. KIRI Engine); the API
key stays on the server. The browser never talks to the scanning service.
