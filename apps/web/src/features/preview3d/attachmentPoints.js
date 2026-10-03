// The named attachment points on a READY car model. Accessories snap to these; on a scanned car
// there are none, so accessories are placed by hand instead (see accessoryData.js).
//
// position is where the point sits on the model: [x, y, z] in metres, x to the right, y up, z toward
// the front, measured from the middle of the car on the ground. They are placeholders until the real
// GLB models define their own attachment points.
//
// replacesOriginal: wheels and lights take the place of the original wheels / lights (the original
// is hidden while the new one is shown). Everything else is added on top of the original body.

/**
 * @typedef {Object} AttachmentAnchor
 * @property {string} label
 * @property {boolean} replacesOriginal
 * @property {[number, number, number]} position
 */

/** @type {Readonly<Record<string, AttachmentAnchor>>} */
export const ATTACHMENT_ANCHORS = Object.freeze({
  front_wheels: { label: 'Front wheels', replacesOriginal: true, position: [0, 0.33, 1.35] },
  rear_wheels: { label: 'Rear wheels', replacesOriginal: true, position: [0, 0.33, -1.35] },
  headlights: { label: 'Headlights', replacesOriginal: true, position: [0, 0.7, 2.05] },
  tail_lights: { label: 'Tail lights', replacesOriginal: true, position: [0, 0.75, -2.05] },
  front_bumper: { label: 'Front bumper', replacesOriginal: false, position: [0, 0.45, 2.1] },
  rear_bumper: { label: 'Rear bumper', replacesOriginal: false, position: [0, 0.45, -2.1] },
  trunk_lid_spoiler: { label: 'Trunk lid spoiler', replacesOriginal: false, position: [0, 1.0, -1.85] },
  roof: { label: 'Roof', replacesOriginal: false, position: [0, 1.5, 0] },
  side_mirrors: { label: 'Side mirrors', replacesOriginal: false, position: [0.95, 1.05, 0.7] },
})

export const anchorLabel = (anchor) => ATTACHMENT_ANCHORS[anchor]?.label ?? anchor
