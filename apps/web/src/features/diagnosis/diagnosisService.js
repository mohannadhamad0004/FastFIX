// TODO: replace with POST /api/diagnosis (backend calls Gemini; the API key must never be in the frontend)
//
// AI diagnosis, mocked: runDiagnosis waits 2 seconds and answers with a realistic result for the
// media type (mockDiagnoses.js). Results of logged-in users are saved to their history
// automatically, with the original photo / video / sound; the AI Agent page (/ai-agent) lists,
// opens and deletes them.
//
// The data lives in DiagnosisProvider's React state (memory only). The provider passes a small
// store ({ read, write }) to createDiagnosisService, like the marketplace and requests services, so
// the real version only has to swap these functions for API calls.

import { pickScenario } from './mockDiagnoses.js'

/** @typedef {import('./types.js').Diagnosis} Diagnosis */
/** @typedef {import('./types.js').DiagnosisInput} DiagnosisInput */

const MOCK_DELAY_MS = 2000
const MEDIA_TYPES = ['photo', 'video', 'audio']

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const copy = (value) => structuredClone(value)

export class DiagnosisError extends Error {}

/**
 * @param {{ read: () => { diagnoses: Diagnosis[] }, write: (next: { diagnoses: Diagnosis[] }) => void }} store
 * @param {{ getCurrentUser: () => Promise<{ id: string } | null> }} auth  the auth service
 */
export function createDiagnosisService(store, auth) {
  let nextId = store.read().diagnoses.length + 1

  /**
   * @param {DiagnosisInput} input
   * @returns {Promise<Diagnosis>}
   */
  async function runDiagnosis({ mediaType, file, car, carId = null, description = '' }) {
    if (!MEDIA_TYPES.includes(mediaType)) throw new DiagnosisError(`Unknown media type: ${mediaType}`)
    if (!file) throw new DiagnosisError('Add a photo, video or engine sound first.')
    if (!car?.make || !car?.model) throw new DiagnosisError('Tell us which car this is.')

    await wait(MOCK_DELAY_MS)

    const { keywords: _keywords, ...scenario } = pickScenario(mediaType, `${description} ${file.name}`)
    const user = await auth.getCurrentUser()
    /** @type {Diagnosis} */
    const diagnosis = {
      id: `d-${nextId++}`,
      ...copy(scenario),
      createdAt: new Date().toISOString(),
      mediaType,
      car: { make: car.make, model: car.model, year: car.year },
      carId,
      description: description.trim(),
      fileName: file.name,
      file,
      userId: user?.id ?? null,
    }

    // Saved automatically for logged-in users only
    if (user) {
      const data = store.read()
      store.write({ ...data, diagnoses: [diagnosis, ...data.diagnoses] })
    }
    return copy(diagnosis)
  }

  /** The logged-in user's diagnoses, newest first. [] when logged out. @returns {Promise<Diagnosis[]>} */
  async function getMyDiagnoses() {
    const user = await auth.getCurrentUser()
    if (!user) return []
    return copy(
      store
        .read()
        .diagnoses.filter((d) => d.userId === user.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    )
  }

  /** @returns {Promise<Diagnosis | null>} null when it isn't one of the user's diagnoses */
  async function getDiagnosis(id) {
    const user = await auth.getCurrentUser()
    const diagnosis = store.read().diagnoses.find((d) => d.id === id && d.userId === user?.id)
    return diagnosis ? copy(diagnosis) : null
  }

  /**
   * Deletes one of the user's diagnoses with its media. Requests it was sent with keep their copy.
   * @returns {Promise<void>}
   */
  async function deleteDiagnosis(id) {
    const user = await auth.getCurrentUser()
    const data = store.read()
    if (!user || !data.diagnoses.some((d) => d.id === id && d.userId === user.id)) {
      throw new DiagnosisError('This report is no longer in your history.')
    }
    store.write({ ...data, diagnoses: data.diagnoses.filter((d) => d.id !== id) })
  }

  return { runDiagnosis, getMyDiagnoses, getDiagnosis, deleteDiagnosis }
}
