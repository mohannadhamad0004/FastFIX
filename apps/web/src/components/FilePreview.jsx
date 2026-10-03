import { useObjectUrl } from '../hooks/useObjectUrl.js'
import { fileExtension, formatFileSize, isImageFile } from '../utils/files.js'
import styles from './FilePreview.module.css'

// One uploaded file: a thumbnail for images, a file icon with the extension (PDF, MP4, ...)
// for everything else, then name and size.
// Clicking the thumbnail opens the file in a new tab. Pass onRemove to show a remove button.
export default function FilePreview({ file, onRemove }) {
  const url = useObjectUrl(file)
  const image = isImageFile(file)

  return (
    <figure className={styles.preview}>
      <a
        href={url ?? undefined}
        target="_blank"
        rel="noreferrer"
        className={styles.thumb}
        aria-label={`Open ${file.name}`}
      >
        {image ? url && <img src={url} alt="" className={styles.image} /> : <FileIcon label={fileExtension(file)} />}
      </a>
      <figcaption className={styles.caption}>
        <span className={styles.name} title={file.name}>
          {file.name}
        </span>
        <span className={styles.size}>{formatFileSize(file.size)}</span>
      </figcaption>
      {onRemove && (
        <button type="button" className={styles.remove} onClick={onRemove} aria-label={`Remove ${file.name}`}>
          ×
        </button>
      )}
    </figure>
  )
}

function FileIcon({ label }) {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <text x="12" y="18" textAnchor="middle" fontSize="5" fontWeight="700" fill="currentColor">
        {label.toUpperCase().slice(0, 4) || 'FILE'}
      </text>
    </svg>
  )
}
