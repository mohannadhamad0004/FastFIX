import { createContext, useContext, useEffect, useState } from 'react'

// Holds the diagnosis service, the saved diagnoses (history), the form draft and the current run.
// The provider is DiagnosisProvider.jsx, mounted in app/AppProviders.jsx above the router, so the
// draft (including the chosen file) survives going to /login and back.
export const DiagnosisContext = createContext(null)

function useDiagnosisContext() {
  const value = useContext(DiagnosisContext)
  if (!value) throw new Error('Diagnosis hooks must be used inside <DiagnosisProvider>')
  return value
}

// The service from diagnosisService.js: runDiagnosis, getMyDiagnoses, getDiagnosis, deleteDiagnosis.
export function useDiagnosisService() {
  return useDiagnosisContext().service
}

// Loads data through the service, like useMarketplaceQuery: `load` must keep the same identity
// between renders. Reloads after every new or deleted diagnosis, and after logging in or out.
export function useDiagnosisQuery(load) {
  const { service, version } = useDiagnosisContext()
  const [state, setState] = useState({ data: undefined, error: null, loading: true })

  useEffect(() => {
    let ignore = false
    load(service).then(
      (data) => !ignore && setState({ data, error: null, loading: false }),
      (error) => !ignore && setState({ data: undefined, error, loading: false }),
    )
    return () => {
      ignore = true
    }
  }, [load, service, version])

  return state
}

/**
 * The diagnosis form's inputs, kept outside the page.
 * @returns {{
 *   draft: import('./DiagnosisProvider.jsx').DiagnosisDraft,
 *   updateDraft: (changes: Partial<import('./DiagnosisProvider.jsx').DiagnosisDraft>) => void,
 *   setFile: (mediaType: import('./types.js').MediaType, file: File | null, source?: 'upload' | 'recording') => void,
 * }}
 */
export function useDiagnosisDraft() {
  const { draft, updateDraft, setFile } = useDiagnosisContext()
  return { draft, updateDraft, setFile }
}

/**
 * The current diagnosis: { status: 'idle' | 'loading' | 'done' | 'error', result, error }, and
 * diagnose(input) to start one (it calls runDiagnosis and resolves with the result).
 */
export function useDiagnosisRun() {
  const { run, diagnose } = useDiagnosisContext()
  return { run, diagnose }
}

const loadMyDiagnoses = (service) => service.getMyDiagnoses()

// The logged-in user's saved diagnoses, newest first ({ data, error, loading }). Reloads after
// every new diagnosis. Used by the AI Agent page (/ai-agent).
export function useMyDiagnoses() {
  return useDiagnosisQuery(loadMyDiagnoses)
}
