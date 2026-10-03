import { useObjectUrl } from '../hooks/useObjectUrl.js'
import styles from './PhotoGallery.module.css'

// Grid of photos (File objects). Each opens full size in a new tab.
export default function PhotoGallery({ files, label }) {
  if (!files?.length) return <p className={styles.empty}>No photos yet.</p>
  return (
    <ul className={styles.gallery} aria-label={label}>
      {files.map((file, index) => (
        <li key={`${file.name}-${file.size}-${file.lastModified}`}>
          <GalleryPhoto file={file} alt={`${label}, photo ${index + 1}`} />
        </li>
      ))}
    </ul>
  )
}

function GalleryPhoto({ file, alt }) {
  const url = useObjectUrl(file)
  return (
    <a href={url ?? undefined} target="_blank" rel="noreferrer" className={styles.photo}>
      {url && <img src={url} alt={alt} className={styles.image} />}
    </a>
  )
}
