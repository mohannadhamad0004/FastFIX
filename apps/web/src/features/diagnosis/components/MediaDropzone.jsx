import { useRef, useState } from 'react'
import Button from '../../../components/Button.jsx'
import { FieldError } from '../../../components/FormField.jsx'
import { useObjectUrl } from '../../../hooks/useObjectUrl.js'
import { FILE_KINDS, formatFileSize } from '../../../utils/files.js'
import { mediaTypeInfo } from '../constants.js'
import { validateMedia } from '../mediaRules.js'
import { CameraIcon, SoundIcon, UploadIcon, VideoIcon } from './icons.jsx'
import styles from './MediaDropzone.module.css'

const ICONS = { photo: CameraIcon, video: VideoIcon, audio: SoundIcon }

/**
 * Drag-and-drop or click to choose one photo, video or sound, with a preview once chosen.
 * Files are checked (type, size, and length for video and sound) before onChange is called.
 * @param {Object} props
 * @param {string} props.id
 * @param {import('../types.js').MediaType} props.mediaType
 * @param {File | null} props.file
 * @param {(file: File | null) => void} props.onChange
 * @param {string} [props.error]   e.g. "Add a photo of the problem." from the form
 * @param {boolean} [props.compact] a smaller drop zone (the "upload instead" option under the recorder)
 */
export default function MediaDropzone({ id, mediaType, file, onChange, error, compact = false }) {
  const inputRef = useRef(null)
  const latestPick = useRef(0)
  const [dragging, setDragging] = useState(false)
  const [checking, setChecking] = useState(false)
  const [problem, setProblem] = useState(null)

  const { accept, label: typesLabel, maxSize } = FILE_KINDS[mediaTypeInfo(mediaType).fileKind]
  const Icon = ICONS[mediaType]
  const noun = { photo: 'photo', video: 'video', audio: 'audio file' }[mediaType]

  async function pick(fileList) {
    const [chosen] = fileList
    if (!chosen) return
    const pickId = ++latestPick.current
    setChecking(true)
    setProblem(null)
    const message = await validateMedia(chosen, mediaType)
    if (pickId !== latestPick.current) return // a newer file was picked meanwhile
    setChecking(false)
    if (message) setProblem(message)
    else onChange(chosen)
  }

  const openPicker = () => inputRef.current?.click()

  const input = (
    <input
      ref={inputRef}
      id={`${id}-input`}
      type="file"
      className={styles.input}
      accept={accept}
      tabIndex={-1}
      aria-hidden="true"
      onChange={(event) => {
        pick(event.target.files)
        event.target.value = '' // so choosing the same file again still fires onChange
      }}
    />
  )

  const messages = (
    <>
      {checking && (
        <p className={styles.checking} role="status">
          Checking the file…
        </p>
      )}
      {problem && (
        <p id={`${id}-problem`} className={styles.problem} role="alert">
          {problem}
        </p>
      )}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </>
  )

  if (file) {
    return (
      <div className={styles.wrapper}>
        {input}
        <Preview file={file} mediaType={mediaType} />
        <div className={styles.previewBar}>
          <p className={styles.fileInfo}>
            <span className={styles.fileName} title={file.name}>
              {file.name}
            </span>
            <span className={styles.fileSize}>{formatFileSize(file.size)}</span>
          </p>
          <div className={styles.previewActions}>
            <Button variant="secondary" size="sm" onClick={openPicker}>
              Replace
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setProblem(null)
                onChange(null)
              }}
            >
              Remove
            </Button>
          </div>
        </div>
        {messages}
      </div>
    )
  }

  const describedBy = [`${id}-types`, problem && `${id}-problem`, error && `${id}-error`].filter(Boolean).join(' ')

  return (
    <div className={styles.wrapper}>
      <div
        className={[
          styles.dropzone,
          compact && styles.compact,
          dragging && styles.dragging,
          (problem || error) && styles.invalid,
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={openPicker}
        onDragEnter={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          pick(event.dataTransfer.files)
        }}
      >
        {input}
        {!compact && (
          <span className={styles.iconCircle} aria-hidden="true">
            <Icon size={28} />
          </span>
        )}
        <p className={styles.prompt}>
          <strong>{compact ? `Upload an ${noun} instead` : `Drop your ${noun} here`}</strong>
          {!compact && <span className={styles.or}> or</span>}
        </p>
        {/* The click bubbles up to the drop zone, which opens the file picker. */}
        <button
          id={id}
          type="button"
          className={styles.choose}
          aria-describedby={describedBy}
          aria-invalid={Boolean(problem || error) || undefined}
        >
          <UploadIcon size={18} />
          {compact ? 'Choose a file' : `Choose a ${noun}`}
        </button>
        <p id={`${id}-types`} className={styles.types}>
          {typesLabel}, up to {formatFileSize(maxSize)}
          {mediaType !== 'photo' && ' and 60 seconds'}
        </p>
      </div>
      {messages}
    </div>
  )
}

function Preview({ file, mediaType }) {
  const url = useObjectUrl(file)
  if (!url) return <div className={styles.previewFrame} />
  if (mediaType === 'photo') {
    return (
      <div className={styles.previewFrame}>
        <img src={url} alt="The photo you chose" className={styles.previewMedia} />
      </div>
    )
  }
  if (mediaType === 'video') {
    return (
      <div className={styles.previewFrame}>
        {/* The customer's own video: no captions exist for it. */}
        {/* oxlint-disable-next-line jsx-a11y/media-has-caption */}
        <video src={url} controls playsInline preload="metadata" className={styles.previewMedia} />
      </div>
    )
  }
  return (
    // oxlint-disable-next-line jsx-a11y/media-has-caption
    <audio src={url} controls preload="metadata" className={styles.audio} aria-label="Play the sound you chose" />
  )
}
