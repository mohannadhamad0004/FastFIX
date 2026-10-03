// Photo search words for the skill tiles on /mechanics and for the mock workshops' cover photos.
// scripts/fetch-images.mjs reads this file (Pixabay): change a query, delete the image in
// apps/web/public/images/skills|workshops, run `npm run images:fetch`; or pin a photo in
// scripts/image-overrides.json ("skill-<slug>" or "workshop-<mechanic id>").
import { SKILLS } from '../../auth/signup/constants.js'

const QUERIES = {
  Engine: 'car engine',
  Electrical: 'car battery alternator',
  Brakes: 'car brake disc',
  Suspension: 'car suspension',
  Transmission: 'car gearbox',
  'AC & Cooling': 'car air conditioning',
  'Body Work & Paint': 'car body paint',
  'Computer Diagnostics': 'car diagnostic computer',
  'Tires & Wheels': 'car tire',
  'Hybrid/EV': 'electric car charging',
}

export const skillSlug = (skill) => skill.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** [{ skill: 'AC & Cooling', slug: 'ac-cooling', photoQuery: '...' }] in SKILLS order. */
export const SKILL_PHOTOS = SKILLS.map((skill) => ({ skill, slug: skillSlug(skill), photoQuery: QUERIES[skill] }))

// The mock mechanics' workshops take these in turn (a mechanic can set `workshopQuery` instead).
export const WORKSHOP_QUERIES = [
  'car repair workshop',
  'car service center',
  'auto repair shop',
  'car mechanic engine repair',
  'garage tools workshop',
  'car lift garage',
  'tire shop garage',
  'mechanic working on car',
  'car garage interior',
  'car dealership service',
  'auto repair garage',
  'vehicle workshop lift',
]
