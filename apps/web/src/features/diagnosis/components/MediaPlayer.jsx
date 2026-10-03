import { useObjectUrl } from '../../../hooks/useObjectUrl.js'
import { mediaTypeInfo } from '../constants.js'
import styles from './MediaPlayer.module.css'

// The original photo, video or engine sound of a saved diagnosis. Nothing when the file is gone.
export default function MediaPlayer({ file, mediaType, label = 'What you sent' }) {
  const url = useObjectUrl(file)
  if (!file) return null
  const name = mediaTypeInfo(mediaType)?.label.toLowerCase() ?? 'file'

  return (
    <figure className={styles.media}>
      <figcaption className={styles.caption}>
        {label} · <span className={styles.fileName}>{file.name}</span>
      </figcaption>
      {url && mediaType === 'photo' && (
        <a href={url} target="_blank" rel="noreferrer" className={styles.photoLink}>
          <img src={url} alt={`Your ${name} of the problem`} className={styles.photo} />
        </a>
      )}
      {url && mediaType === 'video' && (
        // oxlint-disable-next-line jsx-a11y/media-has-caption -- a customer's own clip has no captions
        <video src={url} controls preload="metadata" className={styles.video} aria-label={`Your ${name} of the problem`} />
      )}
      {url && mediaType === 'audio' && (
        <audio src={url} controls preload="metadata" className={styles.audio} aria-label="Your recording of the engine sound" />
      )}
    </figure>
  )
}
