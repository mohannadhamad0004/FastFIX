import { createContext, useContext } from 'react'

// The theme preference and the theme in use. The provider is ThemeProvider.jsx; the rules are in
// theme.js.
export const ThemeContext = createContext(null)

/**
 * @returns {{
 *   preference: import('./theme.js').ThemePreference,  what the user chose
 *   theme: import('./theme.js').Theme,                   what is shown ("system" resolved)
 *   setPreference: (preference: import('./theme.js').ThemePreference) => void,
 * }}
 */
export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme must be used inside <ThemeProvider>')
  return value
}
