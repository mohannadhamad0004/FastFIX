import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { DEFAULT_CENTER, TILE_ATTRIBUTION, TILE_URL } from '../../../logistics/mapTiles.js'
import pinStyles from '../../../logistics/components/TowMap.module.css'
import styles from './EmergencyMap.module.css'

// The emergency maps: the customer's location, the responder moving towards it, and the route.
// With VITE_GOOGLE_MAPS_API_KEY set, Google Maps draws them (and the driving route); without it, or
// when Google fails to load, the Leaflet map used on the tow companies page does.
// The Google key is a browser key: restrict it to our website domains in Google Cloud Console
// (see CLAUDE.md).

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const svg = (body) =>
  `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`
const RESPONDER_PINS = {
  tow: svg('<path d="M2 16V8h11v8M13 11h4l3 3v2h-7"/><circle cx="6" cy="17" r="1.8"/><circle cx="17" cy="17" r="1.8"/>'),
  mechanic: svg('<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>'),
}
const CUSTOMER_PIN = svg('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>')

const pinIcon = (inner, selected) =>
  L.divIcon({
    className: '',
    html: `<span class="${pinStyles.pin} ${selected ? pinStyles.pinSelected : ''}">${inner}</span>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  })

function FitTo({ points }) {
  const map = useMap()
  const key = points.map((p) => `${p.lat.toFixed(3)},${p.lng.toFixed(3)}`).join('|')
  useEffect(() => {
    if (points.length === 1) map.setView([points[0].lat, points[0].lng], 15)
    else if (points.length > 1) map.fitBounds(points.map((p) => [p.lat, p.lng]), { padding: [50, 50], maxZoom: 16 })
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- `key` stands for `points`
  }, [map, key])
  return null
}

function PickOnClick({ onPick }) {
  useMapEvents({ click: (event) => onPick({ lat: event.latlng.lat, lng: event.latlng.lng }) })
  return null
}

function LeafletEmergencyMap({ customer, responder, responderKind, onPick }) {
  const points = [customer, responder].filter(Boolean)
  return (
    <MapContainer center={customer ? [customer.lat, customer.lng] : DEFAULT_CENTER} zoom={customer ? 15 : 8} scrollWheelZoom={false} className={pinStyles.container}>
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      {customer && (
        <Marker
          position={[customer.lat, customer.lng]}
          icon={pinIcon(CUSTOMER_PIN, true)}
          title={onPick ? 'Your location: drag to move' : 'Your location'}
          alt="Your location"
          draggable={Boolean(onPick)}
          eventHandlers={onPick ? { dragend: (event) => onPick({ lat: event.target.getLatLng().lat, lng: event.target.getLatLng().lng }) } : undefined}
        />
      )}
      {responder && (
        <>
          <Marker position={[responder.lat, responder.lng]} icon={pinIcon(RESPONDER_PINS[responderKind] ?? RESPONDER_PINS.tow, false)} title="On the way to you" alt="Responder" zIndexOffset={500} />
          <Polyline positions={[[responder.lat, responder.lng], [customer.lat, customer.lng]]} pathOptions={{ color: 'var(--color-accent)', weight: 4, dashArray: '8 8' }} />
        </>
      )}
      {onPick && <PickOnClick onPick={onPick} />}
      <FitTo points={points} />
    </MapContainer>
  )
}

// --- Google Maps ----------------------------------------------------------------------------------

let googlePromise = null
function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve(window.google.maps)
  googlePromise ??= new Promise((resolve, reject) => {
    window.__fastfixGoogleMapsReady = () => resolve(window.google.maps)
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_KEY)}&callback=__fastfixGoogleMapsReady&loading=async`
    script.async = true
    script.onerror = () => {
      googlePromise = null
      reject(new Error('Google Maps did not load'))
    }
    document.head.append(script)
  })
  return googlePromise
}

const ROUTE_REFRESH_METERS = 300

function GoogleEmergencyMap({ customer, responder, onPick, onFail }) {
  const ref = useRef(null)
  const state = useRef({})

  // Create the map once
  useEffect(() => {
    let cancelled = false
    loadGoogleMaps().then(
      (maps) => {
        if (cancelled || !ref.current) return
        const map = new maps.Map(ref.current, { center: customer ?? { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] }, zoom: customer ? 15 : 8, streetViewControl: false, mapTypeControl: false })
        state.current = { maps, map, route: new maps.DirectionsRenderer({ map, suppressMarkers: true, polylineOptions: { strokeColor: '#c46b34', strokeWeight: 5 } }), directions: new maps.DirectionsService() }
        // Draw with the props of the first render; the effect below keeps it up to date
        setReady(true)
      },
      onFail,
    )
    return () => {
      cancelled = true
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- the map is created once
  }, [])
  const [ready, setReady] = useState(false)

  // Markers, click and route follow the props
  useEffect(() => {
    const { maps, map, route, directions } = state.current
    if (!ready || !maps) return undefined
    const bounds = new maps.LatLngBounds()
    const listeners = []
    const marks = []
    if (customer) {
      const marker = new maps.Marker({ map, position: customer, title: 'Your location', draggable: Boolean(onPick) })
      if (onPick) listeners.push(marker.addListener('dragend', (event) => onPick({ lat: event.latLng.lat(), lng: event.latLng.lng() })))
      marks.push(marker)
      bounds.extend(customer)
    }
    if (responder) {
      marks.push(new maps.Marker({ map, position: responder, title: 'On the way to you', icon: { path: maps.SymbolPath.CIRCLE, scale: 9, fillColor: '#c46b34', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 3 } }))
      bounds.extend(responder)
    }
    if (onPick) listeners.push(map.addListener('click', (event) => onPick({ lat: event.latLng.lat(), lng: event.latLng.lng() })))
    if (customer && responder) map.fitBounds(bounds, 60)
    else if (customer) map.setCenter(customer)

    // The driving route, drawn again only when the responder has moved a good way
    if (customer && responder) {
      const last = state.current.routedFrom
      const far = !last || Math.hypot(last.lat - responder.lat, last.lng - responder.lng) * 111_000 > ROUTE_REFRESH_METERS
      if (far) {
        state.current.routedFrom = responder
        directions.route({ origin: responder, destination: customer, travelMode: 'DRIVING' }, (result, status) => {
          if (status === 'OK') route.setDirections(result)
        })
      }
    } else {
      route.set('directions', null)
      state.current.routedFrom = null
    }
    return () => {
      marks.forEach((marker) => marker.setMap(null))
      listeners.forEach((listener) => listener.remove())
    }
  }, [ready, customer, responder, onPick])

  return <div ref={ref} className={styles.google} role="application" aria-label="Map" />
}

/**
 * @param {Object} props
 * @param {{ lat: number, lng: number } | null} props.customer   the customer's location (null: nothing placed yet)
 * @param {{ lat: number, lng: number } | null} [props.responder]  the responder, moving
 * @param {'tow' | 'mechanic'} [props.responderKind]
 * @param {(position: { lat: number, lng: number }) => void} [props.onPick]  set: the customer can click the map
 *   or drag the pin to place their location
 * @param {string} [props.className]
 */
export default function EmergencyMap({ customer, responder = null, responderKind = 'tow', onPick, className = '' }) {
  const [googleFailed, setGoogleFailed] = useState(false)
  const useGoogle = Boolean(GOOGLE_KEY) && !googleFailed
  return (
    <div className={`${styles.map} ${className}`.trim()}>
      {useGoogle ? (
        <GoogleEmergencyMap customer={customer} responder={responder} onPick={onPick} onFail={() => setGoogleFailed(true)} />
      ) : (
        <LeafletEmergencyMap customer={customer} responder={responder} responderKind={responderKind} onPick={onPick} />
      )}
    </div>
  )
}
