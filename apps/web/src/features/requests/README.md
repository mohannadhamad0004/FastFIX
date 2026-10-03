# requests

Requests sent from the public pages, and everything that hangs off a request: its chat, its
completion and report, and the customer's review.

| Type | From | To | Button |
| --- | --- | --- | --- |
| `service` | customer | mechanic | "Request service" on `/mechanics/:id`, or "Send to a mechanic" on an AI report |
| `tow` | customer | tow company | "Request tow" on `/tow-companies/:id` |
| `part_question` | customer or mechanic | parts shop | "Ask about this part" on part cards |

Logged-out visitors see the buttons; clicking one goes to `/login?redirect=<page>` and back after
login. Roles that can't send a type don't see its button (permissions in
`authorization/permissions.js`: `requests:service`, `requests:tow`, `requests:part_question`).

**Lifecycle:** `pending` → (`in_progress` for a tow company's truck on the job) → `completed`. The
mechanic, tow company or shop marks a request completed from its chat, with the final details
(`request.completion`: confirmed diagnosis, work done, parts used and labor for service; truck and
cost for tow; a note for part questions). Accepting requests isn't built yet.

Service requests carry the **service mode** the customer picked, one the mechanic offers
(`details.mode`): `on_site` needs `details.location`, `workshop` needs `details.preferredAt`
(`"YYYY-MM-DDTHH:mm"`), `online` has no car. `details.carId` links one of the customer's cars (its
maintenance history), `details.diagnosis` is a copy of an attached AI report. A truck on a `pending`
or `in_progress` tow request can't be removed (`ACTIVE_REQUEST_STATUSES`).

## Chats (`/chats`, `/chats/:requestId`)

Every request has one chat between its sender and the provider - customers, mechanics, parts shops
and tow companies all have the page. List on the left (photo, name, request type and status, last
message, time, unread count), conversation on the right; phones show the list first, then the chat.
Text and photos; the request summary (with the attached AI report) is at the top. The provider gets
"Mark as completed"; the sender gets "Confirm completed", then "Rate your experience". The account
menu shows the unread count.

## Reports (`/reports`, `/reports/:requestId`, customers)

Completed service and tow requests. Service: car, mechanic, AI diagnosis vs the mechanic's confirmed
diagnosis, work done, parts, total, date. Tow: pickup, destination, company, truck, cost, date. "Print /
Save as PDF" uses the browser's print dialog; print styles hide the navbar (`data-no-print`) and use
light colors (`styles/variables.css`).

## Completion and reviews

1. The provider finishes the request - from the chat or from the "Your requests" list on its dashboard:
   mechanic "Mark as completed" (confirmed diagnosis and work done required), tow company "Arrived",
   then "Mark as completed", shop "Sale completed". `request.completion.completedAt` is stored.
2. The sender (the customer, or the mechanic for a part question) sees "Confirm completed" or "This
   didn't happen" (chat, report). Confirming stores `request.customerConfirmedAt`; "This didn't
   happen" stores `request.disputedAt` and flags the request for the admins (`/admin/requests`).
3. Only a confirmed request can be reviewed, once, by its sender (never yourself). Reviews open when
   the sender confirms and close after 30 days. A review has an overall rating, three detailed ratings
   (`REVIEW_CRITERIA` in `constants.js`: mechanic quality / price / communication, tow arrival / care /
   professionalism, shop match / price / communication) and an optional comment (1000 characters).
   The reviewer can edit it for 48 hours. Nobody can delete a review; providers can't edit them.
4. The reviewed provider posts one public reply (editable for 48 hours). Any logged-in user can report
   a review. Reports and hiding are in `/admin/reviews`: the admin hides a review with a reason (the
   reviewer sees it) or dismisses the reports; every action is in the review action log.
5. Ratings are never stored on a provider: `getRatingSummaries` calculates average, count, 5 -> 1
   distribution and the average of each detailed rating from the visible (not hidden) reviews. With
   fewer than 3 reviews a "New" badge replaces the stars, and "sort by rating" (`compareRatings` in
   `ratings.js`) puts those providers after rated ones.
6. "Rate your experience" shows in the chat, on the report, on the account menu and on `/reports`
   until the customer reviews or the 30 days pass.

**Mock:** requests, chats and reviews live in React state (memory only - a page reload resets them).
Each service checks who is asking; `apps/api` must do the same.

| Path | Purpose |
| --- | --- |
| `requestsService.js` | `createRequest`, `getMyRequests`, `getRequest`, `getMyReports`, `getCarHistory`, `markArrived`, `completeRequest`, `confirmCompleted`, `disputeCompleted`, `getIncomingRequests` |
| `chatService.js` | `getMyChats`, `getChat`, `sendMessage`, `markRead`, `getUnreadCount` |
| `reviewsService.js` | `getReviewsFor`, `getRatingSummaries`, `getReviewStatus`, `getReviewPrompts`, `createReview`, `updateReview`, `replyToReview`, `editReply`, `reportReview`, `sortByRating` |
| `ratings.js` | Pure helpers: `summarize`, `compareRatings`, `hasRating`, deadlines, `describeReviewedService` |
| `*Provider.jsx` / `*Context.js` | State and hooks: `useRequestsService/Query`, `useChatService/ChatsQuery/UnreadChats`, `useReviewsService/ReviewsQuery/RatingSummaries/ReviewPrompts` |
| `mockRequests.js`, `mockChats.js`, `mockReviews.js` | Seed data: requests r-5 to r-8 (r-5, r-7 reviewed; r-6 confirmed, not reviewed; r-8 waiting for the customer's confirmation), a completed + confirmed request behind every other review, chats, reviews and one reported review |
| `useRequestForm.js` | Form state, validation and submit shared by the three request forms |
| `carDetails.js`, `format.js`, `constants.js` | Car fields, summaries and dates, types / statuses / labels |
| `pages/ChatsPage.jsx`, `pages/ReportsPage.jsx`, `pages/ReportPage.jsx` | The pages above |
| `components/RequestButtons.jsx`, `RequestAction.jsx`, `*Form.jsx` | Request buttons, login redirect, modal, the three forms |
| `components/ChatList.jsx`, `Conversation.jsx`, `MessageComposer.jsx`, `RequestSummary.jsx` | Chat UI |
| `components/CompleteRequestDialog.jsx`, `CompletionActions.jsx`, `ProviderRequests.jsx` | The completion form; Arrived / Mark as completed / Confirm completed buttons; the dashboards' request list |
| `components/Stars.jsx`, `RateExperience.jsx`, `ReviewList.jsx` | Stars and "New" badge, review form (create / edit), public review list with summary, sorting, replies and reports |
| `components/AttachedReport.jsx`, `WorkDetails.jsx` | An attached AI report; confirmed diagnosis, work, parts and cost |
| `components/MyRequestsList.jsx` | The user's sent requests (profile page) |
| `types.js` | JSDoc `Request`, `Completion`, `Review`, `ChatMessage` |

## Emergency (`emergency/`)

A customer on the road (logged in or not) taps the red **Emergency** button and asks for a tow truck
or a roadside mechanic; the nearest ones get the request and the first to accept gets it.

| Path | Purpose |
| --- | --- |
| `mockDispatchService.js` | The mock dispatch (Promise-based, timers stand in for the server): nearest 3 within 15 km, then 30 and 50 km after 60 s each, then "unavailable" with phone numbers; first to accept wins; simulated drivers (switch with `setSimulation`); one active emergency per user or phone number |
| `EmergencyProvider.jsx`, `EmergencyContext.js` | State + `useEmergency()`, `useResponderEmergencies()`, `useNow()` |
| `components/EmergencyButton.jsx` | Navbar and large buttons |
| `components/EmergencyOverlay.jsx` | The full-screen screen: `EmergencyForm` (location, tow or mechanic, details), then `EmergencyTracker` (searching, responder, map, ETA, chat, cancel) |
| `components/EmergencyMap.jsx` | Google Maps with a route when `VITE_GOOGLE_MAPS_API_KEY` is set, else Leaflet |
| `components/EmergencyChat.jsx` | Chat bubbles and composer of `/chats`, with the emergency's own messages |
| `components/ResponderEmergencies.jsx` | On the tow and mechanic dashboards: open offers in red with a countdown, Accept / Decline, then Navigate, call, chat, status buttons and live location sharing |

`dispatch.check.mjs` is a manual check of the service: `node src/features/requests/emergency/dispatch.check.mjs`.
Admins see emergencies with response times on `/admin/requests`.
