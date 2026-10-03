import { validateFile } from '../../utils/files.js'
import { MAX_MEDIA_SECONDS, mediaTypeInfo } from './constants.js'

// Checks an uploaded photo, video or sound against the diagnosis limits: type and size (sync, from
// utils/files.js) and, for video and audio, length (async: the browser has to read the file).

// Length in seconds, or null when the browser can't tell (some WebM files report no duration).
export function readMediaDuration(file) {
  return new Promise((resolve) => {
    const element = document.createElement(file.type.startsWith('audio/') ? 'audio' : 'video')
    const url = URL.createObjectURL(file)
    const done = (value) => {
      URL.revokeObjectURL(url)
      element.removeAttribute('src')
      resolve(value)
    }
    element.preload = 'metadata'
    element.onloadedmetadata = () => done(Number.isFinite(element.duration) ? element.duration : null)
    element.onerror = () => done(null)
    element.src = url
  })
}

/**
 * @param {File} file
 * @param {import('./types.js').MediaType} mediaType
 * @returns {Promise<string | null>} a message for the user, or null when the file can be used
 */
export async function validateMedia(file, mediaType) {
  const problem = validateFile(file, mediaTypeInfo(mediaType).fileKind)
  if (problem) return problem
  if (mediaType === 'photo') return null

  const seconds = await readMediaDuration(file)
  if (seconds !== null && seconds > MAX_MEDIA_SECONDS + 0.5) {
    return `"${file.name}" is ${formatDuration(seconds)} long. ${mediaType === 'video' ? 'Videos' : 'Sounds'} can be up to ${MAX_MEDIA_SECONDS} seconds - trim it to the part that shows the problem.`
  }
  return null
}

// 75 -> "1:15"
export function formatDuration(seconds) {
  const whole = Math.max(0, Math.floor(seconds))
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}
