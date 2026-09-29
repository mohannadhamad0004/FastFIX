# @fastfix/shared

Code used by both apps/web and apps/mobile, so both clients agree on the same data shapes and endpoints.

| Path | Purpose |
| --- | --- |
| `src/types/` | JSDoc type definitions (User, Car, Diagnosis, Part, ...) and constants such as role names |
| `src/api-client/` | Endpoint functions for apps/api, usable from web and mobile |
| `src/validation/` | Input validation rules shared by the forms on both clients |

Never put API keys or server-only code here - everything in this package ships to the clients.
