import { useCallback, useSyncExternalStore } from 'react'

// Whether a CSS media query matches, updated live:
//   const isPhone = useMediaQuery('(max-width: 767px)')
//   const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
export function useMediaQuery(query) {
  const subscribe = useCallback(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}
