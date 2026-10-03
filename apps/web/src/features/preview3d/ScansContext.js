import { createContext, useContext } from 'react'

// Holds the scan service and the logged-in customer's scans (newest first), so pages update as soon
// as a scan moves from uploaded to processing to ready. The provider is ScansProvider.jsx.
export const ScansContext = createContext(null)

/**
 * const { scans, service } = useScans()
 * `service` is scanService.js: uploadScan, getScanStatus, getMyScans, deleteScan.
 * @returns {{ scans: import('./scanService.js').Scan[], service: Object }}
 */
export function useScans() {
  const value = useContext(ScansContext)
  if (!value) throw new Error('useScans must be used inside <ScansProvider>')
  return value
}
