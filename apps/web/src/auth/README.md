# auth

Who the user is: login, signup, and the current session (token, user profile).

What a user is *allowed* to do is not decided here - that lives in `../authorization`.

| File | Purpose |
| --- | --- |
| `AuthContext.jsx` | Holds the logged-in user and token for the whole app |
| `useAuth.js` | Hook to read the current user and call login/logout |
| `api.js` | Login, signup and session calls to apps/api |
| `LoginForm.jsx` | Login form |
| `SignupForm.jsx` | Signup form, including role selection |
