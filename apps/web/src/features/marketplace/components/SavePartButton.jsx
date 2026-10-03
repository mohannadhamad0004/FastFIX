import { useLocation, useNavigate } from 'react-router'
import { loginPathFor } from '../../../auth/redirect.js'
import { useAuth } from '../../../auth/useAuth.js'
import { usePermission } from '../../../authorization/usePermission.js'
import Button from '../../../components/Button.jsx'
import { useToast } from '../../../components/Toast/ToastContext.js'
import { BUY_PERMISSION } from '../cartService.js'
import { useCart } from '../CartContext.js'

// "Save" / "Saved": keeps the part on the buyer's Saved parts list (/saved-parts) for later.
// Same rules as AddToCartButton: customers and mechanics only, visitors are sent to log in.
export default function SavePartButton({ part, size = 'md' }) {
  const { user } = useAuth()
  const canBuy = usePermission(BUY_PERMISSION)
  const { service, savedIds } = useCart()
  const toast = useToast()
  const location = useLocation()
  const navigate = useNavigate()

  if (user && !canBuy) return null
  const saved = savedIds.includes(part.id)

  async function handleClick() {
    if (!user) {
      navigate(loginPathFor(location))
      return
    }
    try {
      const nowSaved = await service.toggleSaved(part.id)
      toast.success(nowSaved ? 'Saved for later.' : 'Removed from saved parts.')
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <Button variant="ghost" size={size} aria-pressed={saved} aria-label={`${saved ? 'Unsave' : 'Save'} ${part.name}`} onClick={handleClick}>
      <span aria-hidden="true">{saved ? '♥' : '♡'}</span> {saved ? 'Saved' : 'Save'}
    </Button>
  )
}
