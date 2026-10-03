// Light / dark / system theme. The chosen preference is saved in localStorage; "system" follows
// the operating system (prefers-color-scheme). The resolved theme is applied as
// <html data-theme="light|dark">, which switches the color tokens in styles/variables.css.
//
// index.html has an inline copy of readStoredPreference + resolveTheme that runs before the app
// loads (so a refresh never flashes the wrong theme). Keep the two in sync.

/** @typedef {'light' | 'dark' | 'system'} ThemePreference */
/** @typedef {'light' | 'dark'} Theme */

export const THEME_STORAGE_KEY = 'fastfix-theme'
export const SYSTEM_DARK_QUERY = '(prefers-color-scheme: dark)'

export const THEME_OPTIONS = Object.freeze([
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
])

export const isPreference = (value) => THEME_OPTIONS.some((option) => option.value === value)

/** @returns {ThemePreference} */
export function readStoredPreference() {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return isPreference(value) ? value : 'system'
  } catch {
    return 'system' // storage blocked: follow the system
  }
}

/** @param {ThemePreference} preference */
export function storePreference(preference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // Storage blocked: the choice still applies until the page is closed
  }
}

export function systemPrefersDark() {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.(SYSTEM_DARK_QUERY).matches)
}

/** @returns {Theme} */
export function resolveTheme(preference, systemDark) {
  if (preference === 'light' || preference === 'dark') return preference
  return systemDark ? 'dark' : 'light'
}
