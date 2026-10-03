import { createContext, useContext } from 'react'

// Opens the VehicleDrawer ("Select by make and model") from anywhere inside the marketplace pages.
// The provider is MarketplaceLayout (pages/MarketplaceLayout.jsx).
export const VehicleDrawerContext = createContext(null)

/**
 * const openVehicleDrawer = useVehicleDrawer()
 * openVehicleDrawer({ requireYear: true, reason: 'to see it on your car in 3D', onChosen: (vehicle) => ... })
 * `requireYear`: the user must pick make, model and year (the 3D preview needs all three).
 * `onChosen(vehicle)` runs after the vehicle is saved. Returns null outside the marketplace pages.
 * @returns {((options?: { requireYear?: boolean, reason?: string, onChosen?: (vehicle: Object) => void }) => void) | null}
 */
export function useVehicleDrawer() {
  return useContext(VehicleDrawerContext)
}
