// The colors admins can give tags, and how to draw them. A tag stores its color as the hex `value`
// below (unchanged data), but badges are painted with the matching theme token
// (--color-tag-* in styles/variables.css), so each color has a light and a dark version.
// White badge text passes WCAG AA on every one, in both themes.

export const TAG_PALETTE = Object.freeze([
  { value: '#1f6feb', label: 'Blue', token: '--color-tag-blue' },
  { value: '#1a7f37', label: 'Green', token: '--color-tag-green' },
  { value: '#0a7f7f', label: 'Teal', token: '--color-tag-teal' },
  { value: '#8250df', label: 'Purple', token: '--color-tag-purple' },
  { value: '#bf3989', label: 'Pink', token: '--color-tag-pink' },
  { value: '#cf222e', label: 'Red', token: '--color-tag-red' },
  { value: '#bc4c00', label: 'Orange', token: '--color-tag-orange' },
  { value: '#9a6700', label: 'Gold', token: '--color-tag-gold' },
  { value: '#57606a', label: 'Gray', token: '--color-tag-gray' },
])

const TOKENS = new Map(TAG_PALETTE.map((color) => [color.value.toLowerCase(), color.token]))

/**
 * CSS color for a stored tag color: `var(--color-tag-blue)` for palette colors, or the stored
 * value itself for anything else (older data).
 * @param {string} value  e.g. '#1f6feb'
 */
export function tagColor(value) {
  const token = TOKENS.get(String(value ?? '').toLowerCase())
  return token ? `var(${token})` : value
}
