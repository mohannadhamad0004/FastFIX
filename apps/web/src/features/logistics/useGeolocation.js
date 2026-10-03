import { useCallback, useState } from 'react'

// The browser's location, only when the user asks for it ("Use my location"). Nothing is stored:
// the position lives in the component's state until the page is left, and is only sent with a tow
// request when the user confirms it in the form.
//
// Browsers only allow geolocation on localhost or HTTPS; elsewhere `locate` fails with a message.
//   const { status, position, error, locate } = useGeolocation()
//   status: 'idle' | 'locating' | 'ready' | 'error'
//   locate() resolves with { lat, lng } or null (and sets `error` to a message for the user);
//   locate({ fresh: true }) never uses a remembered position (emergencies need the exact spot)

const MESSAGES = {
  1: 'Location access is blocked. Allow it in your browser settings, or search by city instead.',
  2: "We couldn't find your location. Check that location services are on, or search by city.",
  3: 'Finding your location took too long. Try again, or search by city.',
  insecure: 'Your location can only be used on a secure (https) connection. Search by city instead.',
  unsupported: "This browser can't share your location. Search by city instead.",
}

export function useGeolocation() {
  const [state, setState] = useState({ status: 'idle', position: null, error: null })

  const locate = useCallback(
    ({ fresh = false } = {}) =>
      new Promise((resolve) => {
        const fail = (key) => {
          setState({ status: 'error', position: null, error: MESSAGES[key] ?? MESSAGES[2] })
          resolve(null)
        }
        if (!window.isSecureContext) {
          fail('insecure')
          return
        }
        if (!('geolocation' in navigator)) {
          fail('unsupported')
          return
        }
        setState((current) => ({ ...current, status: 'locating', error: null }))
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            const position = { lat: coords.latitude, lng: coords.longitude }
            setState({ status: 'ready', position, error: null })
            resolve(position)
          },
          (error) => fail(error.code),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: fresh ? 0 : 60000 },
        )
      }),
    [],
  )

  return { ...state, locate }
}
