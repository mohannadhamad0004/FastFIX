import { createContext, useContext, useEffect, useState } from 'react'

// Holds the marketplace service and a `version` that changes whenever marketplace data changes.
// The provider is MarketplaceProvider.jsx.
export const MarketplaceContext = createContext(null)

function useMarketplaceContext() {
  const value = useContext(MarketplaceContext)
  if (!value) throw new Error('Marketplace hooks must be used inside <MarketplaceProvider>')
  return value
}

// The service from marketplaceService.js: getShops, getShopById, getParts, getPartById, getPartsByShop,
// addPart, updatePart, deletePart, adjustStock.
export function useMarketplaceService() {
  return useMarketplaceContext().service
}

// Loads data through the service: useMarketplaceQuery(loadParts), where
// `const loadParts = (service) => service.getParts()`.
// `load` must keep the same identity between renders (define it outside the component, or use
// useCallback when it depends on props). Reloads when `load` changes and whenever marketplace
// data changes (e.g. a shop adds a part), so every page shows the latest data. The previous data
// stays visible while reloading.
export function useMarketplaceQuery(load) {
  const { service, version } = useMarketplaceContext()
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
