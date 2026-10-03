// Labels and limits for the AI diagnosis. Size limits live with the file kinds in utils/files.js.

export const MAX_MEDIA_SECONDS = 60

export const MEDIA_TYPES = Object.freeze([
  {
    value: 'photo',
    label: 'Photo',
    fileKind: 'photo',
    hint: 'A warning light, a leak, worn tires or damage. Images up to 10 MB.',
    emptyError: 'Add a photo of the problem.',
  },
  {
    value: 'video',
    label: 'Video',
    fileKind: 'video',
    hint: 'Smoke, shaking or a light that flickers. Videos up to 60 seconds and 50 MB.',
    emptyError: 'Add a video of the problem.',
  },
  {
    value: 'audio',
    label: 'Engine sound',
    fileKind: 'audio',
    hint: 'Record the noise with your microphone, or upload a recording up to 60 seconds.',
    emptyError: 'Record or upload the sound your car makes.',
  },
])

export const mediaTypeInfo = (value) => MEDIA_TYPES.find((type) => type.value === value)

// Tone names match the Badge / banner tones in components/.
export const URGENCY = Object.freeze({
  safe: {
    label: 'Safe to drive',
    tone: 'success',
    text: 'You can keep driving normally. Book a check when it suits you.',
  },
  soon: {
    label: 'Inspect soon',
    tone: 'warning',
    text: 'Drive gently and have a mechanic look at it in the next few days.',
  },
  stop: {
    label: 'Stop driving',
    tone: 'danger',
    text: "Driving on could be unsafe or cause serious damage. Park the car and don't drive it to the garage.",
  },
})

// How strongly the photo, video or sound supports each possible cause. Shown as words and a
// 3-step meter, never as percentages: a preliminary AI assessment is not that precise.
export const EVIDENCE = Object.freeze({
  strong: { label: 'Strong evidence', short: 'Strong', level: 3, tone: 'primary' },
  moderate: { label: 'Moderate evidence', short: 'Moderate', level: 2, tone: 'info' },
  weak: { label: 'Weak evidence', short: 'Weak', level: 1, tone: 'neutral' },
})

export const DISCLAIMER = 'This is a preliminary AI assessment, not a final diagnosis. A mechanic will confirm it.'

// CarSelector: the "Another car…" choice, when the user types the car instead of picking a saved one.
export const OTHER_CAR = 'other'

// Suggestions for the make field.
export const COMMON_MAKES = Object.freeze([
  'Audi',
  'BMW',
  'Chevrolet',
  'Ford',
  'Honda',
  'Hyundai',
  'Kia',
  'Mazda',
  'Mercedes-Benz',
  'Mitsubishi',
  'Nissan',
  'Opel',
  'Peugeot',
  'Renault',
  'Seat',
  'Skoda',
  'Subaru',
  'Suzuki',
  'Toyota',
  'Volkswagen',
])
