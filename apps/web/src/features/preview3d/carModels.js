// TODO: replace with real API call (the catalogue of ready 3D models)
//
// The ready-made 3D car models we have. A model covers one make and model for a range of years
// (the body shape stays the same across a generation), and has every attachment point in
// attachmentPoints.js. The glbUrl files don't exist yet: the placeholder viewer only shows which
// model would be loaded.
// TODO: replace with React Three Fiber viewer loading GLB files

import { ATTACHMENT_ANCHORS } from './attachmentPoints.js'

/**
 * @typedef {Object} ReadyModel
 * @property {string} id
 * @property {string} make
 * @property {string} model
 * @property {number} yearFrom
 * @property {number} yearTo
 * @property {string} glbUrl
 * @property {string[]} anchors   the attachment points this model has
 */

function readyModel(make, name, yearFrom, yearTo) {
  const id = `${make}-${name}-${yearFrom}-${yearTo}`.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return { id, make, model: name, yearFrom, yearTo, glbUrl: `/models/ready/${id}.glb`, anchors: Object.keys(ATTACHMENT_ANCHORS) }
}

/** @type {ReadyModel[]} */
export const READY_MODELS = [
  readyModel('Volkswagen', 'Golf', 2013, 2020),
  readyModel('Hyundai', 'Accent', 2011, 2022),
  readyModel('Hyundai', 'Elantra', 2016, 2020),
  readyModel('Toyota', 'Corolla', 2014, 2019),
  readyModel('Kia', 'Sportage', 2016, 2021),
  readyModel('Skoda', 'Octavia', 2013, 2020),
]

const same = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase()

// "Volkswagen Golf 2013–2020"
export const formatModel = (m) => `${m.make} ${m.model} ${m.yearFrom}–${m.yearTo}`

/**
 * The ready model for a car, or null when we don't have one for that make, model and year.
 * @param {{ make: string, model: string, year: number } | null} car
 * @returns {ReadyModel | null}
 */
export function findReadyModel(car) {
  if (!car) return null
  return (
    READY_MODELS.find(
      (m) => same(m.make, car.make) && same(m.model, car.model) && m.yearFrom <= car.year && car.year <= m.yearTo,
    ) ?? null
  )
}

export const findReadyModelById = (id) => READY_MODELS.find((m) => m.id === id) ?? null

/**
 * The ready models closest to a car we have no model for: the same model in other years first,
 * then other models of the same make, then the rest. Nearest years first within each group.
 * @returns {{ model: ReadyModel, reason: string }[]}
 */
export function closestModels(car, limit = 3) {
  const yearGap = (m) => (car.year < m.yearFrom ? m.yearFrom - car.year : car.year > m.yearTo ? car.year - m.yearTo : 0)
  return READY_MODELS.map((m) => {
    const sameModel = same(m.make, car.make) && same(m.model, car.model)
    const sameMake = same(m.make, car.make)
    return {
      model: m,
      score: (sameModel ? 0 : sameMake ? 1000 : 2000) + yearGap(m),
      reason: sameModel ? 'Same model, other years' : sameMake ? `Another ${m.make}` : 'A similar car',
    }
  })
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map(({ model: m, reason }) => ({ model: m, reason }))
}
