// TODO: replace with real API calls
// TODO: backend sends the photos/video to a 3D scanning API (e.g. KIRI Engine); the API key stays on the server
//
// "Scan my own car (beta)": a customer uploads photos taken all around one of their cars (or one
// walk-around video) and gets a 3D model of it back. Every function returns a Promise, like the
// real API will. A scan belongs to one of the customer's cars (My Cars) and only its owner can
// see it; the api must check both.
//
// Status: uploaded -> processing (with an estimated time) -> ready, or failed with a reason the
// customer sees. The customer gets a notification when it is ready (or failed). In the real app
// the scanning API calls our api back when it finishes; the browser never talks to it.
//
// Mock: scans live in ScansProvider's React state (memory only), and processing is simulated with
// timers: "processing" after a moment, done after a few seconds. Fewer than MOCK_MIN_GOOD_PHOTOS
// photos, or a video shorter than MOCK_MIN_GOOD_VIDEO_SECONDS, "fails" so that state can be tried.
// The files themselves stay in memory as File objects; nothing is uploaded.

import { ROLES } from '../../authorization/roles.js'
import { validateFile } from '../../utils/files.js'
import {
  MAX_PHOTOS,
  MAX_VIDEO_SECONDS,
  MIN_PHOTOS,
  MOCK_MIN_GOOD_PHOTOS,
  MOCK_MIN_GOOD_VIDEO_SECONDS,
  SCAN_STATUS,
} from './scanConstants.js'

/**
 * @typedef {Object} Scan
 * @property {string} id
 * @property {string} ownerId
 * @property {string} carId                 one of the owner's cars (My Cars)
 * @property {{ make: string, model: string, year: number, nickname: string }} car  a copy, for labels
 * @property {'photos' | 'video'} kind
 * @property {number} fileCount
 * @property {number} totalBytes
 * @property {number | null} durationSec    video only, when the browser could read it
 * @property {File | null} cover            the first photo, shown as a thumbnail
 * @property {'uploaded' | 'processing' | 'ready' | 'failed'} status
 * @property {number} estimatedMinutes      how long processing usually takes
 * @property {string | null} failureReason  set when status is 'failed'
 * @property {string | null} modelUrl       the GLB file, set when status is 'ready'
 * @property {string} createdAt             ISO date
 * @property {string} updatedAt             ISO date
 */

// Thrown for problems the user can fix. `field` names the form field it belongs to, if any.
export class ScanError extends Error {
  constructor(message, field = null) {
    super(message)
    this.name = 'ScanError'
    this.field = field
  }
}

// Mock timings, in milliseconds.
const START_PROCESSING_AFTER = 1500
const FINISH_AFTER = 12000

const copy = (value) => structuredClone(value)
const newestFirst = (a, b) => b.createdAt.localeCompare(a.createdAt)
const now = () => new Date().toISOString()

const carName = (car) => `${car.nickname ? `${car.nickname} (` : ''}${car.make} ${car.model} ${car.year}${car.nickname ? ')' : ''}`

/**
 * @param {{ read: () => { scans: Scan[] }, write: (next: { scans: Scan[] }) => void }} store
 * @param {{ auth: Object, cars: Object, notifications: Object }} services
 */
export function createScanService(store, { auth, cars, notifications }) {
  async function requireCustomer() {
    const user = await auth.getCurrentUser()
    if (!user || user.role !== ROLES.CUSTOMER) throw new ScanError('Log in with a customer account to scan your car.')
    return user
  }

  function update(scanId, changes) {
    const current = store.read()
    const scan = current.scans.find((s) => s.id === scanId)
    if (!scan) return null // deleted meanwhile
    const updated = { ...scan, ...changes, updatedAt: now() }
    store.write({ ...current, scans: current.scans.map((s) => (s.id === scanId ? updated : s)) })
    return updated
  }

  // Mock of the scanning API's work: queued, then done a few seconds later.
  function simulateProcessing(scanId) {
    setTimeout(() => update(scanId, { status: SCAN_STATUS.PROCESSING }), START_PROCESSING_AFTER)
    setTimeout(() => {
      const scan = store.read().scans.find((s) => s.id === scanId)
      if (!scan) return
      const failureReason =
        scan.kind === 'photos' && scan.fileCount < MOCK_MIN_GOOD_PHOTOS
          ? `The photos didn't overlap enough to build the whole car. Try again with ${MOCK_MIN_GOOD_PHOTOS} or more photos taken all the way around.`
          : scan.kind === 'video' && scan.durationSec !== null && scan.durationSec < MOCK_MIN_GOOD_VIDEO_SECONDS
            ? 'The video was too short to see every side of the car. Walk slowly all the way around for about 1–2 minutes.'
            : null
      const done = update(
        scanId,
        failureReason
          ? { status: SCAN_STATUS.FAILED, failureReason }
          : { status: SCAN_STATUS.READY, modelUrl: `/models/scans/${scanId}.glb` },
      )
      if (!done) return
      notifications.notify(done.ownerId, {
        type: 'scan',
        title: failureReason ? 'Your 3D scan failed' : 'Your 3D model is ready',
        body: failureReason
          ? `${carName(done.car)}: ${failureReason}`
          : `${carName(done.car)} is ready to try parts on in 3D.`,
        link: `/my-cars/${done.carId}`,
      })
    }, FINISH_AFTER)
  }

  /**
   * Uploads photos (MIN_PHOTOS to MAX_PHOTOS, up to 10 MB each) or one video (up to 2 minutes) of
   * one of the customer's cars and starts building the model.
   * @param {{ carId: string, kind: 'photos' | 'video', files: File[], durationSec?: number | null }} upload
   *   durationSec: the video's length, read by the browser (null when it can't tell)
   * @returns {Promise<Scan>}
   */
  async function uploadScan({ carId, kind, files, durationSec = null }) {
    const user = await requireCustomer()
    const car = await cars.getCar(carId)
    if (!car) throw new ScanError('Choose one of your cars.', 'scanCar')

    const list = files ?? []
    if (kind === 'photos') {
      if (list.length < MIN_PHOTOS) {
        throw new ScanError(`Add at least ${MIN_PHOTOS} photos (40–80 works best). You have ${list.length}.`, 'scanPhotos')
      }
      if (list.length > MAX_PHOTOS) throw new ScanError(`Use up to ${MAX_PHOTOS} photos.`, 'scanPhotos')
      for (const file of list) {
        const problem = validateFile(file, 'photo')
        if (problem) throw new ScanError(problem, 'scanPhotos')
      }
    } else if (kind === 'video') {
      if (list.length !== 1) throw new ScanError('Add one video of the car.', 'scanVideo')
      const problem = validateFile(list[0], 'scanVideo')
      if (problem) throw new ScanError(problem, 'scanVideo')
      if (durationSec !== null && durationSec > MAX_VIDEO_SECONDS + 0.5) {
        throw new ScanError('The video is longer than 2 minutes. Trim it, or record a shorter walk-around.', 'scanVideo')
      }
    } else {
      throw new ScanError('Choose photos or a video.')
    }

    const current = store.read()
    const number = current.scans.reduce((max, s) => Math.max(max, Number(s.id.slice(5)) || 0), 0) + 1
    const created = {
      id: `scan-${number}`,
      ownerId: user.id,
      carId: car.id,
      car: { make: car.make, model: car.model, year: car.year, nickname: car.nickname },
      kind,
      fileCount: list.length,
      totalBytes: list.reduce((sum, file) => sum + file.size, 0),
      durationSec: kind === 'video' ? durationSec : null,
      cover: kind === 'photos' ? list[0] : null,
      status: SCAN_STATUS.UPLOADED,
      // Rough guide from scanning services: more photos take longer.
      estimatedMinutes: kind === 'photos' ? 5 + Math.ceil(list.length / 20) : 8,
      failureReason: null,
      modelUrl: null,
      createdAt: now(),
      updatedAt: now(),
    }
    store.write({ ...current, scans: [...current.scans, created] })
    simulateProcessing(created.id)
    return copy(created)
  }

  /** @returns {Promise<Scan | null>} one of the customer's scans, with its current status */
  async function getScanStatus(scanId) {
    const user = await requireCustomer()
    const scan = store.read().scans.find((s) => s.id === scanId && s.ownerId === user.id)
    return scan ? copy(scan) : null
  }

  /** @returns {Promise<Scan[]>} the customer's scans, newest first; [] for other roles */
  async function getMyScans() {
    const user = await auth.getCurrentUser()
    if (!user || user.role !== ROLES.CUSTOMER) return []
    return copy(store.read().scans.filter((s) => s.ownerId === user.id).sort(newestFirst))
  }

  /** @returns {Promise<void>} */
  async function deleteScan(scanId) {
    const user = await requireCustomer()
    const current = store.read()
    if (!current.scans.some((s) => s.id === scanId && s.ownerId === user.id)) throw new ScanError('Scan not found.')
    store.write({ ...current, scans: current.scans.filter((s) => s.id !== scanId) })
  }

  return { uploadScan, getScanStatus, getMyScans, deleteScan }
}
