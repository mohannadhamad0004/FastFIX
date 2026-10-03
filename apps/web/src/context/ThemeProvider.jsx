import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  isPreference,
  readStoredPreference,
  resolveTheme,
  storePreference,
  SYSTEM_DARK_QUERY,
  systemPrefersDark,
  THEME_STORAGE_KEY,
} from './theme.js'
import { ThemeContext } from './ThemeContext.js'

// Keeps <html data-theme> in line with the user's choice. Starts from the same saved preference the
// inline script in index.html used, so the first render matches what is already on screen.
export default function ThemeProvider({ children }) {
  const [preference, setPreferenceState] = useState(readStoredPreference)
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  // "System" updates live when the operating system switches between light and dark.
  useEffect(() => {
    const query = window.matchMedia?.(SYSTEM_DARK_QUERY)
    if (!query) return undefined
    const onChange = (event) => setSystemDark(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  // A choice made in another tab applies here too.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === THEME_STORAGE_KEY) setPreferenceState(isPreference(event.newValue) ? event.newValue : 'system')
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const theme = resolveTheme(preference, systemDark)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const setPreference = useCallback((next) => {
    setPreferenceState(next)
    storePreference(next)
  }, [])

  const value = useMemo(() => ({ preference, theme, setPreference }), [preference, theme, setPreference])
  return <ThemeContext value={value}>{children}</ThemeContext>
}
