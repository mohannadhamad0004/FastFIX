// "Log in, then come back here" links: /login?redirect=/mechanics/u-10

// The page to return to after login, or null. Only same-site paths are allowed, so a crafted
// link like /login?redirect=https://evil.example can't send people to another site.
export function safeRedirect(value) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null
  return value
}

// Login URL that returns to `location` (pathname + search) afterwards.
export function loginPathFor(location) {
  return `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`
}
