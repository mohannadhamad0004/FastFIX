import { useRef, useState } from 'react'
import FilePreview from './FilePreview.jsx'
import { FieldError } from './FormField.jsx'
import { FILE_KINDS, formatFileSize, isSameFile, validateFile } from '../utils/files.js'
import styles from './FileUpload.module.css'

// Drag-and-drop or click-to-choose file picker with previews and remove buttons.
// kind: 'image' (JPG, PNG - for photos and logos) | 'document' (PDF, JPG, PNG) - max 5 MB per file,
// or 'media' (photo, video or audio of a car problem) - max 25 MB. See utils/files.js.
// Without `multiple`, value is a File or null; with `multiple`, value is a File[].
// Files stay in memory as File objects - nothing is uploaded here.
export default function FileUpload({
  id,
  label,
  hint,
  optional = false,
  kind = 'image',
  multiple = false,
  value,
  onChange,
  error,
}) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [problems, setProblems] = useState([])

  const files = multiple ? (value ?? []) : value ? [value] : []
  const { accept, label: typesLabel, maxSize } = FILE_KINDS[kind]

  function addFiles(fileList) {
    const incoming = Array.from(fileList)
    const found = []
    const accepted = []
    for (const file of incoming) {
      const problem = validateFile(file, kind)
      if (problem) found.push(problem)
      else accepted.push(file)
    }

    if (multiple) {
      const fresh = accepted.filter((file) => !files.some((existing) => isSameFile(existing, file)))
      if (fresh.length) onChange([...files, ...fresh])
    } else if (accepted.length) {
      onChange(accepted[0])
      if (incoming.length > 1) found.push('Only one file is allowed here, so the first valid one was used.')
    }
    setProblems(found)
  }

  function removeFile(index) {
    onChange(multiple ? files.filter((_, i) => i !== index) : null)
    setProblems([])
  }

  function handleDragOver(event) {
    event.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false)
  }

  function handleDrop(event) {
    event.preventDefault()
    setDragging(false)
    addFiles(event.dataTransfer.files)
  }

  const describedBy = [
    hint && `${id}-hint`,
    `${id}-types`,
    problems.length && `${id}-problems`,
    error && `${id}-error`,
  ]
    .filter(Boolean)
    .join(' ')

  const invalid = Boolean(error || problems.length)
  const buttonText = multiple ? 'Choose files' : files.length ? 'Replace file' : 'Choose a file'

  return (
    <div className={styles.upload}>
      <span className={styles.label}>
        {label}
        {optional && <small className={styles.optional}> (optional)</small>}
      </span>
      {hint && (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}

      <div
        className={`${styles.dropzone} ${dragging ? styles.dragging : ''} ${invalid ? styles.invalid : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragEnter={handleDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          className={styles.input}
          accept={accept}
          multiple={multiple}
          tabIndex={-1}
          aria-hidden="true"
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => {
            addFiles(event.target.files)
            event.target.value = '' // so choosing the same file again still fires onChange
          }}
        />
        <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className={styles.prompt}>
          {/* The click bubbles up to the drop zone, which opens the file picker. */}
          <button
            id={id}
            type="button"
            className={styles.choose}
            aria-label={`${label}: ${buttonText.toLowerCase()}`}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
          >
            {buttonText}
          </button>{' '}
          or drag and drop here
        </p>
        <p id={`${id}-types`} className={styles.types}>
          {typesLabel}, up to {formatFileSize(maxSize)}
          {multiple ? ' each' : ''}
        </p>
      </div>

      {problems.length > 0 && (
        <ul id={`${id}-problems`} className={styles.problems} role="alert">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}
      <FieldError id={`${id}-error`}>{error}</FieldError>

      {files.length > 0 && (
        <ul className={styles.previews} aria-label={`${label}: chosen files`}>
          {files.map((file, index) => (
            <li key={`${file.name}-${file.size}-${file.lastModified}`}>
              <FilePreview file={file} onRemove={() => removeFile(index)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
