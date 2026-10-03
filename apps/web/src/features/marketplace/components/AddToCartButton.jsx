import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { loginPathFor } from '../../../auth/redirect.js'
import { useAuth } from '../../../auth/useAuth.js'
import { usePermission } from '../../../authorization/usePermission.js'
import Button from '../../../components/Button.jsx'
import { useToast } from '../../../components/Toast/ToastContext.js'
import { BUY_PERMISSION } from '../cartService.js'
import { useCart } from '../CartContext.js'

// "Add to cart". Only customers and mechanics can buy: other roles see nothing, and visitors are
// sent to log in and then back to this page. Disabled when the part is out of stock.
export default function AddToCartButton({ part, quantity = 1, size = 'md', variant = 'primary', fullWidth = false }) {
  const { user } = useAuth()
  const canBuy = usePermission(BUY_PERMISSION)
  const { service } = useCart()
  const toast = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const [adding, setAdding] = useState(false)

  if (user && !canBuy) return null

  async function handleClick() {
    if (!user) {
      navigate(loginPathFor(location))
      return
    }
    setAdding(true)
    try {
      const { capped } = await service.addItem(part.id, quantity)
      toast.success(
        capped ? `Added to cart. Only ${part.stock} in stock, so that's the most you can order.` : `Added “${part.name}” to your cart.`,
      )
    } catch (error) {
      toast.error(error.message)
    } finally {
      setAdding(false)
    }
  }

  const outOfStock = part.stock === 0
  return (
    <Button
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      loading={adding}
      disabled={outOfStock}
      onClick={handleClick}
      aria-label={`Add ${part.name} to cart`}
    >
      {outOfStock ? 'Out of stock' : 'Add to cart'}
    </Button>
  )
}
