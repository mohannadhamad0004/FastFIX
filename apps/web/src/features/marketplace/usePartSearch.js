import { useEffect, useState } from 'react'
import { searchParts } from './api.js'

// Wait this long after the last keystroke, so typing doesn't send a request per letter.
const DEBOUNCE_MS = 250

/**
 * Runs the server-side part search whenever `query` changes. The previous results stay visible
 * while the next search loads, and a newer query cancels the older request.
 * @param {string} query
 * @returns {{ data: import('./types.js').PartSearchResponse | undefined, error: Error | null }}
 */
export function usePartSearch(query) {
  const [state, setState] = useState({ data: undefined, error: null })

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    const timer = setTimeout(
      () =>
        searchParts(query, { signal }).then(
          (data) => !signal.aborted && setState({ data, error: null }),
          (error) => !signal.aborted && setState((current) => ({ data: current.data, error })),
        ),
      query ? DEBOUNCE_MS : 0,
    )
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  return state
}
