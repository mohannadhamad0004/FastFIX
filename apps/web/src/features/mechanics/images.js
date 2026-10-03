import images from './mechanicImages.json'

// Photos from scripts/fetch-images.mjs (mechanicImages.json: key -> URL).
export const skillImage = (slug) => images[`skill-${slug}`]
export const workshopImage = (mechanicId) => images[`workshop-${mechanicId}`]
