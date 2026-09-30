# auth

Who the user is: login, signup, password reset, and the current session.

What a user is *allowed* to do is not decided here - that lives in `../authorization`.

**Mock mode:** `authService.js` keeps accounts in React state, saved to sessionStorage so a
refresh keeps you logged in (closing the tab resets it). Uploaded files stay as `File` objects; nothing is uploaded.
Seeded admin: `admin@fastfix.test` / `Admin123!`. Every other seeded account (a customer, 10
mechanics, 5 tow companies, 5 parts shops - see `mockUsers.js` and "Test accounts" in the root
README) uses `Test123!`. Password reset links are printed to the browser console instead of being
emailed. In development, `/login` has a "Dev login" panel (`dev/`) for one-click test logins; it
is not included in production builds. The mock state is kept in sessionStorage
(`sessionPersistence.js`) so a refresh keeps you logged in.

| File | Purpose |
| --- | --- |
| `authService.js` | Every auth call (register, login, logout, getCurrentUser, requestPasswordReset, resetPassword) and the public mechanic / tow company directory (`getDirectory`, `getDirectoryEntry` - approved, non-suspended accounts, approved skills and public fields only). Suspended accounts can't log in. Admin calls are in `features/admin/adminService.js`. Mock now - swap for real API calls |
| `AuthContext.jsx` | `AuthProvider`: holds the mock accounts and the logged-in user |
| `useAuth.js` | `useAuth()` -> `{ user, service }`, and `useAuthQuery()` for loading data |
| `mockUsers.js` | Seed accounts: admin, customer, mechanics, tow companies, parts shops (some still pending) |
| `mockFiles.js` | Generated placeholder photos, logos and PDFs for the seed accounts |
| `redirect.js` | `/login?redirect=...` helpers (only same-site paths are followed) |
| `constants.js` | Account statuses, which roles need approval, account type labels |
| `validation.js` | Email, phone and password rules, password strength |
| `landingPath.js` | Where a user goes after login/signup |
| `types.js` | JSDoc `Account`, `Skill`, `Truck` |
| `LoginPage.jsx` | `/login` |
| `SignupPage.jsx` | `/signup` - role choice, then the role's steps (`signup/`) |
| `ForgotPasswordPage.jsx` | `/forgot-password` |
| `ResetPasswordPage.jsx` | `/reset-password?token=...` |
| `PendingApprovalPage.jsx` | `/pending-approval` - status and submitted documents |
| `AccountSummary.jsx` | Everything an account submitted (signup review, pending page, admin review) |
| `AuthCard.jsx`, `PasswordInput.jsx`, `PasswordStrength.jsx` | Shared UI for the auth pages |

## signup/

| File | Purpose |
| --- | --- |
| `signupSteps.js` | Initial form per role, the steps each role goes through, and each step's validation |
| `SignupWizard.jsx` | Runs the steps: progress, Back/Next, validation, submit |
| `RoleChoice.jsx` | The four account type cards |
| `StepIndicator.jsx` | Progress bar and step numbers |
| `*Step.jsx` | One component per step (account, profile, skills, documents, photos, trucks, review) |
