import { useMemo } from 'react'
import { useTags } from '../../context/TagsContext.js'
import { useRatingSummaries } from '../requests/ReviewsContext.js'
import { forVehicle } from './catalog.js'
import { useCart } from './CartContext.js'
import { useMarketplaceQuery } from './MarketplaceContext.js'

const NONE = []
const loadAll = async (service) => {
  const [parts, shops] = await Promise.all([service.getParts(), service.getShops()])
  return { parts, shops }
}

/**
 * Everything the marketplace pages show: the public parts and shops, tags, shop ratings, the
 * selected vehicle (from the cart, kept for the session) and the parts that fit it.
 * Reloads whenever marketplace data changes (a shop edits a part, an order reserves stock).
 */
export function useMarketplaceData() {
  const { data, error } = useMarketplaceQuery(loadAll)
  const tags = useTags()
  const ratings = useRatingSummaries()
  const { vehicle } = useCart()
  const parts = data?.parts ?? NONE
  const shops = data?.shops ?? NONE

  const shopsById = useMemo(() => Object.fromEntries(shops.map((shop) => [shop.id, shop])), [shops])
  // Parts of shops that aren't public any more are left out.
  const listed = useMemo(() => parts.filter((part) => shopsById[part.shopId]), [parts, shopsById])
  const fitting = useMemo(() => forVehicle(listed, vehicle), [listed, vehicle])

  return { loading: !data && !error, error, parts: listed, shops, shopsById, fitting, vehicle, tags, ratings }
}
