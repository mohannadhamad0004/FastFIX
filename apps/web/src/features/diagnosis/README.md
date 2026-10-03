# diagnosis

The home page's main feature: a customer uploads a photo, a video or the sound of the engine (or records it in the browser), picks the car, and gets a preliminary AI assessment. A mechanic confirms or corrects it.

**Mock for now.** `diagnosisService.js` waits 2 seconds and answers from `mockDiagnoses.js`. It will be replaced by `POST /api/diagnosis`: the backend calls the AI provider (Gemini), and the API key must never be in the frontend.

| Path | Purpose |
| --- | --- |
| `diagnosisService.js` | `runDiagnosis({ mediaType, file, car, carId, description })`, `getMyDiagnoses()`, `getDiagnosis(id)`, `deleteDiagnosis(id)` (mock) |
| `pages/AiAgentPage.jsx` | `/ai-agent` (customers) - past diagnoses, newest first: date, car, media icon, urgency, top cause; "New diagnosis" (`/#diagnose`) |
| `pages/DiagnosisReportPage.jsx` | `/ai-agent/:diagnosisId` - the full report with the original photo / video / sound; "Send to a mechanic", "Find a mechanic for this", delete |
| `components/SendToMechanicDialog.jsx` | Choose a mechanic (suggested skill first, best rated first), then "Request service" with the report attached |
| `components/MediaPlayer.jsx` | The original photo, video or sound of a saved diagnosis |
| `mockHistory.js` | One past report of the test customer, so `/ai-agent` isn't empty |
| `mockDiagnoses.js` | Mock AI answers per media type, picked by keywords (list below) |
| `DiagnosisProvider.jsx` | Holds the history, the form draft and the current run (mounted in `app/AppProviders.jsx`) |
| `DiagnosisContext.js` | `useDiagnosisService`, `useDiagnosisDraft`, `useDiagnosisRun`, `useMyDiagnoses` |
| `constants.js` | Media types, urgency and evidence labels, the disclaimer, the 60-second limit |
| `mediaRules.js` | `validateMedia(file, mediaType)`: type, size and length checks; `formatDuration` |
| `carChoice.js` | `resolveCar`: a saved car, or the typed make/model/year after validation |
| `components/DiagnosisCard.jsx` | The form: Photo / Video / Engine sound tabs, car, description, "Diagnose my car" |
| `components/MediaDropzone.jsx` | Drag-and-drop or click to upload one file, with a preview |
| `components/AudioRecorder.jsx` | Record with MediaRecorder (timer, level meter, 60 s limit) or upload a sound |
| `components/CarSelector.jsx` | One of the user's cars (`features/cars`) or make, model, year |
| `components/DiagnosisResult.jsx` | Loading skeleton, error, or the report |
| `types.js` | `Diagnosis`, `DiagnosisInput`, `MediaType`, `Evidence`, `Urgency` |

## Result

`{ observations, possibleCauses: [{ cause, evidence: 'strong' | 'moderate' | 'weak' }], urgency: 'safe' | 'soon' | 'stop', recommendedChecks: [], suggestedSkill, createdAt }`, plus `id`, `mediaType`, `car`, `description`, `fileName` and `userId`.

- Evidence is shown as words and a 3-step meter, never as percentages.
- Urgency banner: Safe to drive (green) / Inspect soon (orange) / Stop driving (red, announced as an alert).
- "Find a mechanic for this" opens `/mechanics?skill=<suggestedSkill>`; the directory filters by that approved skill.
- "Stop driving" also shows "Request a tow" (`/tow-companies`).
- Results are saved automatically for logged-in users, with the original file and the car id when the car came from My Cars; the AI Agent page lists them.

## Limits

Photos: JPG, PNG or WebP up to 10 MB. Videos: MP4, MOV or WebM up to 60 seconds and 50 MB. Engine sound: recorded up to 60 seconds, or an MP3, WAV, M4A, OGG or WebM upload up to 60 seconds and 20 MB. Size and type rules are the `photo`, `video` and `audio` kinds in `utils/files.js`.

## Logged out

"Diagnose my car" checks the form, then goes to `/login?redirect=/`. The draft (file included) lives in `DiagnosisProvider`, above the router, so after logging in the form is filled in as it was and a note says so. It is memory only: a full page reload clears it (a `File` can't go in sessionStorage; IndexedDB could keep it if needed).

## Mock scenarios (for testing)

The first one per media type is the default; a keyword in the description or file name picks another.

| Media | Keywords | Result | Urgency | Skill |
| --- | --- | --- | --- | --- |
| Engine sound | (default) "squeal", "belt" | Worn serpentine belt | Inspect soon | Engine |
| Engine sound | "tick", "tap", "knock", "valve" | Valve train noise | Inspect soon | Engine |
| Engine sound | "grind", "brake", "scrape" | Brake pads worn to metal | Stop driving | Brakes |
| Photo | (default) "check engine", "warning" | Check engine light | Inspect soon | Computer Diagnostics |
| Photo | "leak", "drip", "puddle", "coolant" | Coolant leak | Inspect soon | AC & Cooling |
| Photo | "oil", "pressure", "red light" | Oil pressure warning | Stop driving | Engine |
| Photo | "battery", "charging", "alternator" | Charging system light | Inspect soon | Electrical |
| Photo | "tire", "tyre", "tread" | Uneven tire wear | Safe to drive | Tires & Wheels |
| Video | (default) "smoke", "blue" | Blue-grey exhaust smoke | Inspect soon | Engine |
| Video | "white smoke", "sweet", "steam" | Coolant burning (head gasket) | Stop driving | Engine |
| Video | "shake", "vibration", "idle", "misfire" | Misfire at idle | Inspect soon | Engine |
| Video | "flicker", "dim", "dashboard" | Failing alternator regulator | Inspect soon | Electrical |
