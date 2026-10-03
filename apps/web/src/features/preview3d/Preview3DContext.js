import { createContext, useContext } from 'react'

// The 3D preview: how the car model is chosen, the car, the parts added to it and where they sit,
// and whether the drawer is open. The provider (Preview3DProvider.jsx) wraps the whole app, so
// the selection stays while browsing between pages. Memory only - a page reload clears it.
//
// source: null      the drawer first asks how to get the car model
//         'ready'   a ready model for the car chosen in the vehicle picker (readyModel; null when
//                   we have none for that car). Accessories snap to attachment points.
//         'scan'    one of the customer's scanned cars (scanId). Accessories are placed by hand
//                   with on-screen controls (transforms).
export const Preview3DContext = createContext(null)

/**
 * @returns {{
 *   source: 'ready' | 'scan' | null,
 *   car: { make: string, model: string, year: number } | null,
 *   readyModel: import('./carModels.js').ReadyModel | null,
 *   usingClosestModel: boolean,
 *   scanId: string | null,
 *   scanCarId: string | null,
 *   items: import('../marketplace/types.js').Part[],
 *   transforms: Object<string, import('./accessoryData.js').Transform>,
 *   isOpen: boolean,
 *   chooseSource: (source: 'ready' | 'scan' | null) => void,
 *   setCar: (car: { make: string, model: string, year: number } | null) => void,
 *   chooseClosestModel: (modelId: string | null) => void,
 *   selectScan: (scan: import('./scanService.js').Scan | null) => void,
 *   startScan: (carId: string | null) => void,
 *   addPart: (part: import('../marketplace/types.js').Part) => import('../marketplace/types.js').Part | null,
 *   removePart: (partId: string) => void,
 *   isSelected: (partId: string) => boolean,
 *   updateTransform: (partId: string, changes: Partial<import('./accessoryData.js').Transform>) => void,
 *   resetPreview: () => void,
 *   open: () => void,
 *   close: () => void,
 * }}
 *   addPart returns the part it replaced on a ready model (same attachment point), or null.
 */
export function usePreview3D() {
  const value = useContext(Preview3DContext)
  if (!value) throw new Error('usePreview3D must be used inside <Preview3DProvider>')
  return value
}
