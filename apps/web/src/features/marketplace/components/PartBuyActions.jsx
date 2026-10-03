import AddToCartButton from './AddToCartButton.jsx'
import SavePartButton from './SavePartButton.jsx'
import { getShopCommerce } from '../shopCommerce.js'

// The buying actions in a part card's footer: Add to cart and Save. Each hides itself for roles
// that can't buy. When the shop isn't selling online (no delivery or pickup turned on, or no
// payment method accepted: Selling settings on its profile) there is nothing to buy, so neither
// shows and the card keeps only "Ask about this part".
export default function PartBuyActions({ part, shop }) {
  if (!shop || !getShopCommerce(shop).selling) return null
  return (
    <>
      <AddToCartButton part={part} />
      <SavePartButton part={part} />
    </>
  )
}
