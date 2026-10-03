// Rules and wording of "Scan my own car (beta)". scanService.js and the upload form share them.

export const MIN_PHOTOS = 20 // fewer can't be turned into a model at all
export const RECOMMENDED_PHOTOS = Object.freeze([40, 80])
export const MAX_PHOTOS = 120
export const MAX_VIDEO_SECONDS = 120
export const RECOMMENDED_VIDEO_MINUTES = Object.freeze([1, 2])

// Mock processing only: below these the scan "fails", so the failed state can be tried out.
// The real scanning API decides this itself.
export const MOCK_MIN_GOOD_PHOTOS = 30
export const MOCK_MIN_GOOD_VIDEO_SECONDS = 30

export const SCAN_STATUS = Object.freeze({
  UPLOADED: 'uploaded',
  PROCESSING: 'processing',
  READY: 'ready',
  FAILED: 'failed',
})

export const SCAN_STATUS_LABELS = Object.freeze({
  [SCAN_STATUS.UPLOADED]: 'Uploaded',
  [SCAN_STATUS.PROCESSING]: 'Processing',
  [SCAN_STATUS.READY]: 'Ready',
  [SCAN_STATUS.FAILED]: 'Failed',
})

export const SCAN_STATUS_TONES = Object.freeze({
  [SCAN_STATUS.UPLOADED]: 'info',
  [SCAN_STATUS.PROCESSING]: 'warning',
  [SCAN_STATUS.READY]: 'success',
  [SCAN_STATUS.FAILED]: 'danger',
})

export const CAPTURE_TIPS = Object.freeze([
  'Walk slowly all the way around the car, keeping it in the center of every shot.',
  'Use good, even light: daylight in the shade or on a cloudy day works best.',
  'Avoid strong reflections: no direct sun on the paint, and park away from shiny walls and other cars.',
  'Take photos at two heights (chest and knee), each one overlapping the one before.',
  'Include the wheels, the roof edges and the front and back of the car.',
])

export const PRIVACY_NOTICE = 'Your photos are processed to build your 3D model. Cover your plate if you prefer.'
