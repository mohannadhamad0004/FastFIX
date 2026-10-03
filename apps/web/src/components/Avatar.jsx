import FileImage from './FileImage.jsx'
import styles from './Avatar.module.css'

const initials = (name) =>
  String(name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')

// Round photo or logo, with the name's initials when there is no photo.
// size: 'sm' (navbar) | 'md' (cards) | 'lg' (profile pages)
export default function Avatar({ file, name, size = 'md' }) {
  return (
    <span className={`${styles.avatar} ${styles[size]}`} aria-hidden="true">
      {file ? <FileImage file={file} alt="" className={styles.image} /> : initials(name)}
    </span>
  )
}
