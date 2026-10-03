import { useState } from 'react'
import { partIcon, partPhotos } from '../catalog.js'
import CatalogIcon from './CatalogIcon.jsx'
import styles from './PartPhoto.module.css'

/**
 * The picture of a part, always 4:3 on a light neutral background (object-fit: contain), so every
 * card looks the same in both themes. Order: the part's own photo -> its category photo -> the
 * category icon. A photo that fails to load is skipped. `children` (discount, offer and stock
 * badges, labels) sit on top of the picture.
 * @param {Object} props
 * @param {import('../types.js').Part} props.part
 * @param {'card' | 'large'} [props.size]  large: the part page
 * @param {string} [props.className]
 */
export default function PartPhoto({ part, size = 'card', className = '', children }) {
  const [failed, setFailed] = useState([])
  const photo = partPhotos(part).find((candidate) => !failed.includes(candidate.src))
  const [width, height] = size === 'large' ? [800, 600] : [400, 300]

  return (
    <div className={`${styles.frame} ${styles[size]} ${className}`.trim()}>
      {photo ? (
        <img
          className={styles.photo}
          src={photo.src}
          alt={photo.alt}
          width={width}
          height={height}
          loading={size === 'large' ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed((current) => [...current, photo.src])}
        />
      ) : (
        <CatalogIcon name={partIcon(part)} size={size === 'large' ? 120 : 44} className={styles.icon} />
      )}
      {children}
    </div>
  )
}
