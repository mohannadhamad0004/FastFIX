import { Link } from 'react-router'
import { useState } from 'react'
import CatalogIcon from './CatalogIcon.jsx'
import styles from './TileGrid.module.css'

/**
 * A grid of boxed tiles: icon + name, subtle border, lift on hover.
 * @param {Object} props
 * @param {{ key: string, label: string, icon: string, to?: string, onClick?: () => void,
 *           selected?: boolean, count?: number, countLabel?: string, image?: string }[]} props.tiles
 *   `image` (a photo URL) replaces the icon; the icon stays as the fallback
 *   a tile with `to` is a link; with `onClick` it is a toggle button (aria-pressed = selected)
 * @param {'large' | 'box' | 'compact'} [props.size]
 *   large: the main groups row · box: category tiles · compact: subcategory filters
 * @param {string} props.label   what the tiles are, for screen readers
 */
export default function TileGrid({ tiles, size = 'box', label }) {
  return (
    <ul className={`${styles.grid} ${styles[size]}`} aria-label={label}>
      {tiles.map((tile) => {
        const content = (
          <>
            <TileMedia tile={tile} size={size} />
            <span className={styles.label}>{tile.label}</span>
            {tile.count !== undefined && <span className={styles.count}>{tile.countLabel ?? tile.count}</span>}
          </>
        )
        return (
          <li key={tile.key}>
            {tile.to ? (
              <Link to={tile.to} className={styles.tile}>
                {content}
              </Link>
            ) : (
              <button
                type="button"
                className={`${styles.tile} ${tile.selected ? styles.selected : ''}`}
                aria-pressed={Boolean(tile.selected)}
                onClick={tile.onClick}
              >
                {content}
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}

const PHOTO_SIZE = { large: 88, box: 150, compact: 28 } // px: width and height of the photo

// The tile's photo (lazy, fixed size, so the page doesn't jump), or its icon when it has none or
// the photo fails to load. The photo is decorative: the label next to it names the tile.
function TileMedia({ tile, size }) {
  const [failed, setFailed] = useState(false)
  if (tile.image && !failed) {
    const height = size === 'box' ? 112 : PHOTO_SIZE[size]
    return (
      <img
        className={styles.photo}
        src={tile.image}
        alt=""
        width={PHOTO_SIZE[size]}
        height={height}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    )
  }
  return (
    <span className={styles.icon}>
      <CatalogIcon name={tile.icon} size={size === 'large' ? 40 : size === 'box' ? 30 : 20} />
    </span>
  )
}
