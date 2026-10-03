import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { TILE_ATTRIBUTION, TILE_URL } from '../mapTiles.js'
import styles from './TowMap.module.css'
import pickupStyles from './PickupMap.module.css'

const PIN = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>`

const pinIcon = L.divIcon({
  className: '',
  html: `<span class="${styles.pin} ${styles.pinSelected}">${PIN}</span>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
})

// Keeps the map centred on the pin when it is moved from outside (e.g. "Use my location").
function Recenter({ position }) {
  const map = useMap()
  useEffect(() => {
    map.panTo([position.lat, position.lng])
  }, [map, position.lat, position.lng])
  return null
}

// A tap or click on the map moves the pin there too.
function MoveOnClick({ onChange }) {
  useMapEvents({ click: (event) => onChange({ lat: event.latlng.lat, lng: event.latlng.lng }) })
  return null
}

/**
 * A small map with a draggable pin for the pickup point of a tow request.
 * @param {{ position: { lat: number, lng: number }, onChange: (position: { lat: number, lng: number }) => void }} props
 */
export default function PickupMap({ position, onChange }) {
  return (
    <div className={`${styles.map} ${pickupStyles.small}`}>
      <MapContainer center={[position.lat, position.lng]} zoom={16} scrollWheelZoom={false} className={`${styles.container} ${pickupStyles.small}`}>
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <Marker
          position={[position.lat, position.lng]}
          icon={pinIcon}
          draggable
          title="Pickup point: drag to move"
          alt="Pickup point"
          eventHandlers={{
            dragend: (event) => {
              const { lat, lng } = event.target.getLatLng()
              onChange({ lat, lng })
            },
          }}
        />
        <Recenter position={position} />
        <MoveOnClick onChange={onChange} />
      </MapContainer>
    </div>
  )
}
