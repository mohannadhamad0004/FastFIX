// Upload rules shared by FileUpload and anything that shows uploaded files.

const MB = 1024 * 1024

const JPEG = 'image/jpeg'
const PNG = 'image/png'
const WEBP = 'image/webp'
const PDF = 'application/pdf'
const MP4 = 'video/mp4'
const MOV = 'video/quicktime'
const WEBM = 'video/webm'
const MP3 = 'audio/mpeg'
const WAV = 'audio/wav'
const M4A = 'audio/mp4'
const OGG = 'audio/ogg'
const AUDIO_WEBM = 'audio/webm' // what Chrome and Firefox record with MediaRecorder

const TYPES_BY_EXTENSION = {
  jpg: JPEG,
  jpeg: JPEG,
  png: PNG,
  webp: WEBP,
  pdf: PDF,
  mp4: MP4,
  mov: MOV,
  webm: WEBM,
  mp3: MP3,
  wav: WAV,
  m4a: M4A,
  ogg: OGG,
  weba: AUDIO_WEBM,
}

// Browsers name some types differently; map them to the ones above.
const TYPE_ALIASES = { 'image/jpg': JPEG, 'audio/x-wav': WAV, 'audio/wave': WAV, 'audio/x-m4a': M4A, 'audio/mp3': MP3 }

const acceptList = (types) =>
  [
    ...Object.entries(TYPES_BY_EXTENSION)
      .filter(([, type]) => types.includes(type))
      .map(([extension]) => `.${extension}`),
    ...types,
  ].join(',')

// kind 'image' is for photos and logos, 'document' for certificates, licenses and other papers,
// 'media' for showing a car problem (photo, video or sound recording).
export const FILE_KINDS = Object.freeze({
  image: { types: [JPEG, PNG], label: 'JPG or PNG', maxSize: 5 * MB },
  document: { types: [JPEG, PNG, PDF], label: 'PDF, JPG or PNG', maxSize: 5 * MB },
  media: {
    types: [JPEG, PNG, MP4, MOV, WEBM, MP3, WAV, M4A, OGG],
    label: 'Photo (JPG, PNG), video (MP4, MOV, WebM) or audio (MP3, WAV, M4A, OGG)',
    maxSize: 25 * MB,
  },
  // AI diagnosis uploads, one kind per tab. Videos and sounds are also limited to 60 seconds
  // (checked in features/diagnosis/mediaRules.js, since that needs to load the file).
  photo: { types: [JPEG, PNG, WEBP], label: 'JPG, PNG or WebP', maxSize: 10 * MB },
  video: { types: [MP4, MOV, WEBM], label: 'MP4, MOV or WebM', maxSize: 50 * MB },
  audio: { types: [MP3, WAV, M4A, OGG, AUDIO_WEBM], label: 'MP3, WAV, M4A, OGG or WebM', maxSize: 20 * MB },
  // 3D scan of a car (features/preview3d): one walk-around video, also limited to 2 minutes
  // (checked in scanService.js, since that needs to load the file).
  scanVideo: { types: [MP4, MOV, WEBM], label: 'MP4, MOV or WebM', maxSize: 500 * MB },
})

for (const kind of Object.values(FILE_KINDS)) kind.accept = acceptList(kind.types)

// Some browsers leave file.type empty, so fall back to the extension. Parameters are ignored:
// a recording is "audio/webm;codecs=opus".
export function fileType(file) {
  const type = file.type?.split(';')[0].trim()
  if (type) return TYPE_ALIASES[type] ?? type
  return TYPES_BY_EXTENSION[fileExtension(file)] ?? ''
}

export const fileExtension = (file) => (file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '')

export const isImageFile = (file) => fileType(file).startsWith('image/')
export const isVideoFile = (file) => fileType(file).startsWith('video/')

export const isSameFile = (a, b) =>
  a.name === b.name && a.size === b.size && a.lastModified === b.lastModified

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < MB) return `${Math.round(bytes / 1024)} KB`
  return `${Number((bytes / MB).toFixed(1))} MB` // 5 MB, 7.2 MB
}

/** @returns {string | null} a message for the user, or null when the file is fine */
export function validateFile(file, kind) {
  const { types, label, maxSize } = FILE_KINDS[kind]
  if (!types.includes(fileType(file))) {
    return `"${file.name}" can't be used here. Upload a ${label} file.`
  }
  if (file.size > maxSize) {
    return `"${file.name}" is ${formatFileSize(file.size)}. Files can be up to ${formatFileSize(maxSize)}.`
  }
  return null
}
