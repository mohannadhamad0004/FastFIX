import { ATTACHMENT_ANCHORS } from './attachmentPoints.js'

// How a part is placed on a 3D car. A part can carry this as `part.accessory` (filled in by the
// shop or a parts catalogue, see marketplace/types.js). The mock parts don't have it yet, so until
// they do it is worked out from the part's category and name.
//
//   placementType     'anchor': snaps to attachmentAnchor on a ready model
//                     'free':   no fixed point; the user places it by hand
//   attachmentAnchor  one of ATTACHMENT_ANCHORS (null for 'free' parts)
//   defaultPosition   [x, y, z] in metres where it starts (the anchor's position, or above the car)
//   defaultRotation   [x, y, z] in degrees
//   defaultScale      1 = the size the GLB file was made at
//   glbUrl            the accessory's 3D file
// TODO: replace with React Three Fiber viewer loading GLB files

/**
 * @typedef {Object} AccessoryData
 * @property {'anchor' | 'free'} placementType
 * @property {string | null} attachmentAnchor
 * @property {[number, number, number]} defaultPosition
 * @property {[number, number, number]} defaultRotation
 * @property {number} defaultScale
 * @property {string} glbUrl
 */

/**
 * Where an accessory sits on a scanned car: position in metres, rotation in degrees.
 * @typedef {{ position: [number, number, number], rotation: [number, number, number], scale: number }} Transform
 */

// Body and accessory parts, by name. null = front or rear bumper, decided by the name.
const ANCHOR_BY_NAME = [
  [/spoiler|wing/, 'trunk_lid_spoiler'],
  [/mirror/, 'side_mirrors'],
  [/roof|rack|cross ?bar|antenna/, 'roof'],
  [/bumper|splitter|lip|grille/, null],
]

function guessAnchor(part) {
  const name = part.name.toLowerCase()
  const rear = /rear|tail|trunk|back/.test(name)
  if (part.category === 'Tires & Wheels') return rear ? 'rear_wheels' : 'front_wheels'
  if (part.category === 'Lighting') return rear || /brake light|stop light/.test(name) ? 'tail_lights' : 'headlights'
  for (const [pattern, anchor] of ANCHOR_BY_NAME) {
    if (pattern.test(name)) return anchor ?? (rear ? 'rear_bumper' : 'front_bumper')
  }
  if (part.category === 'Body') return rear ? 'rear_bumper' : 'front_bumper'
  return null // other accessories have no obvious spot: the user places them
}

/** @returns {AccessoryData} */
export function getAccessoryData(part) {
  const given = part.accessory ?? {}
  const anchor = given.attachmentAnchor !== undefined ? given.attachmentAnchor : guessAnchor(part)
  const placementType = given.placementType ?? (anchor ? 'anchor' : 'free')
  return {
    placementType,
    attachmentAnchor: anchor ?? null,
    defaultPosition: given.defaultPosition ?? (anchor ? [...ATTACHMENT_ANCHORS[anchor].position] : [0, 1.6, 0]),
    defaultRotation: given.defaultRotation ?? [0, 0, 0],
    defaultScale: given.defaultScale ?? 1,
    glbUrl: given.glbUrl ?? `/models/accessories/${part.id}.glb`,
  }
}

/** The part's starting transform on a scanned car. @returns {Transform} */
export function defaultTransform(part) {
  const { defaultPosition, defaultRotation, defaultScale } = getAccessoryData(part)
  return { position: [...defaultPosition], rotation: [...defaultRotation], scale: defaultScale }
}

// Ranges of the on-screen controls for scanned cars.
export const TRANSFORM_LIMITS = Object.freeze({
  position: { min: -3, max: 3, step: 0.05 },
  rotation: { min: -180, max: 180, step: 5 },
  scale: { min: 0.25, max: 3, step: 0.05 },
})
