// Symptoms people type on /mechanics ("squeaking brakes", "car won't start") and the skill that
// fixes them. Edit this list to teach the search a new symptom: add the words (lowercase, any part
// of what the customer might type) and the skill (one of SKILLS in auth/signup/constants.js).
// TODO: replace with the AI diagnosis (features/diagnosis) once the api provides suggested skills.

/** @type {{ skill: string, words: string[] }[]} */
export const SYMPTOMS = [
  { skill: 'Brakes', words: ['brake', 'squeak', 'squeal', 'grinding', 'pedal', 'abs', 'stopping'] },
  {
    skill: 'Electrical',
    words: ["won't start", 'wont start', "doesn't start", 'not starting', 'no start', 'battery', 'dead', 'alternator', 'starter', 'fuse', 'wiring', 'lights', 'horn', 'window', 'clicking'],
  },
  { skill: 'AC & Cooling', words: [' ac ', 'a/c', 'air condition', 'not cold', 'no cold', 'blowing warm', 'heater', 'no heat'] },
  { skill: 'AC & Cooling', words: ['overheat', 'over heat', 'coolant', 'radiator', 'temperature', 'steam', 'leaking water'] },
  { skill: 'Engine', words: ['engine', 'smoke', 'misfire', 'stall', 'rough idle', 'knocking', 'oil leak', 'oil pressure', 'timing belt', 'turbo', 'loss of power'] },
  { skill: 'Transmission', words: ['gear', 'clutch', 'shifting', 'slipping', 'transmission', 'gearbox', 'automatic'] },
  { skill: 'Suspension', words: ['suspension', 'bumpy', 'shock', 'strut', 'pulling', 'steering', 'vibration', 'clunk', 'alignment', 'sagging'] },
  { skill: 'Tires & Wheels', words: ['tire', 'tyre', 'flat', 'puncture', 'wheel', 'balancing', 'wobble'] },
  { skill: 'Body Work & Paint', words: ['dent', 'scratch', 'paint', 'bumper', 'rust', 'body', 'collision', 'accident damage'] },
  { skill: 'Computer Diagnostics', words: ['check engine', 'warning light', 'dashboard light', 'error code', 'obd', 'diagnostic', 'scan', 'sensor'] },
  { skill: 'Hybrid/EV', words: ['hybrid', 'electric car', ' ev ', 'ev battery', 'charging', 'tesla', 'prius'] },
]

/**
 * The skills that fit what the customer typed, best first (the skill with the most matching
 * words comes first). [] when nothing matches.
 * @param {string} text
 * @returns {string[]}
 */
export function skillsForProblem(text) {
  const padded = ` ${text.toLowerCase().trim()} `
  if (padded.trim().length < 3) return []
  const scores = new Map()
  for (const { skill, words } of SYMPTOMS) {
    const hits = words.filter((word) => padded.includes(word)).length
    if (hits) scores.set(skill, (scores.get(skill) ?? 0) + hits)
  }
  return [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([skill]) => skill)
}
