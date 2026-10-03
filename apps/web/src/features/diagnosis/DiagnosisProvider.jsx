import { useCallback, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../auth/useAuth.js'
import { DiagnosisContext } from './DiagnosisContext.js'
import { createDiagnosisService } from './diagnosisService.js'
import { seedDiagnoses } from './mockHistory.js'

/**
 * What the customer has entered so far. Kept here (not in the page) so nothing is lost when a
 * logged-out customer goes to /login and comes back. Memory only: a full page reload clears it.
 * @typedef {Object} DiagnosisDraft
 * @property {import('./types.js').MediaType} mediaType  the selected tab
 * @property {Record<import('./types.js').MediaType, File | null>} files  one file per tab
 * @property {'upload' | 'recording' | null} audioSource  whether the engine sound was recorded here
 * @property {{ savedId: string, make: string, model: string, year: string }} car
 *   savedId: one of the user's cars (features/cars), or '' to use make/model/year
 * @property {string} description
 * @property {boolean} awaitingLogin  "Diagnose my car" was pressed while logged out; the form
 *   greets the customer when they are back from /login
 */

/** @type {DiagnosisDraft} */
const EMPTY_DRAFT = {
  mediaType: 'photo',
  files: { photo: null, video: null, audio: null },
  audioSource: null,
  car: { savedId: '', make: '', model: '', year: '' },
  description: '',
  awaitingLogin: false,
}

const IDLE = { status: 'idle', result: null, error: null }
const SEED_DATA = { diagnoses: seedDiagnoses }

// TODO: replace mock implementation with real API calls (see diagnosisService.js)
// Must be inside AuthProvider: results are saved for the logged-in user.
export default function DiagnosisProvider({ children }) {
  const { service: auth, user } = useAuth()
  const [data, setData] = useState(SEED_DATA)
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [run, setRun] = useState(IDLE)
  const runId = useRef(0)

  const [service] = useState(() => {
    // Latest data, so a service call made right after a write sees it before React re-renders.
    let latest = SEED_DATA
    const store = {
      read: () => latest,
      write: (next) => {
        latest = next
        setData(next)
      },
    }
    return createDiagnosisService(store, auth)
  })

  const updateDraft = useCallback((changes) => setDraft((current) => ({ ...current, ...changes })), [])

  const setFile = useCallback(
    (mediaType, file, source = 'upload') =>
      setDraft((current) => ({
        ...current,
        files: { ...current.files, [mediaType]: file },
        ...(mediaType === 'audio' && { audioSource: file ? source : null }),
      })),
    [],
  )

  // Only the newest run may update the state, so a slow older run can't overwrite a newer result.
  const diagnose = useCallback(
    async (input) => {
      const id = ++runId.current
      setRun({ status: 'loading', result: null, error: null })
      try {
        const result = await service.runDiagnosis(input)
        if (id === runId.current) setRun({ status: 'done', result, error: null })
        return result
      } catch (error) {
        if (id === runId.current) setRun({ status: 'error', result: null, error })
        throw error
      }
    },
    [service],
  )

  // The history is per user, so it reloads after logging in or out too.
  const version = useMemo(() => ({ data, userId: user?.id ?? null }), [data, user?.id])
  const value = useMemo(
    () => ({ service, version, draft, updateDraft, setFile, run, diagnose }),
    [service, version, draft, updateDraft, setFile, run, diagnose],
  )
  return <DiagnosisContext value={value}>{children}</DiagnosisContext>
}
