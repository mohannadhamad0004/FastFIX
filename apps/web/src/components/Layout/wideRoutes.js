// Pages that use the wider content column (directory + map, catalog, admin). Layout and Navbar
// both read this so their edges line up. Detail pages (/mechanics/:id ...) stay normal width.
const WIDE_EXACT = ['/marketplace', '/mechanics', '/tow-companies']

export const isWidePath = (pathname) =>
  WIDE_EXACT.includes(pathname.replace(/\/$/, '')) || pathname === '/admin' || pathname.startsWith('/admin/')
