import { useState } from 'react'
import Button from '../../../components/Button.jsx'
import Notice from '../../../components/Notice.jsx'
import { useToast } from '../../../components/Toast/ToastContext.js'
import { describeChange } from '../cartService.js'
import { useCart } from '../CartContext.js'
import styles from './CartChangesNotice.module.css'

// "Some items changed since you added them": lists each change and asks the buyer to accept them
// (new prices, lower quantities, unavailable items removed) before they can check out or order.
// Renders nothing when `changes` is empty (CartView.changes).
export default function CartChangesNotice({ changes }) {
  const { service } = useCart()
  const toast = useToast()
  const [accepting, setAccepting] = useState(false)

  if (changes.length === 0) return null

  async function handleAccept() {
    setAccepting(true)
    try {
      await service.acceptChanges()
      toast.success('Your cart is up to date.')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setAccepting(false)
    }
  }

  return (
    <Notice tone="warning" title="Some items changed since you added them">
      <ul className={styles.list}>
        {changes.flatMap(({ partId, name, changes: list }) =>
          list.map((change) => <li key={`${partId}-${change.type}`}>{describeChange(name, change)}</li>),
        )}
      </ul>
      <Button size="sm" loading={accepting} onClick={handleAccept}>
        Accept changes
      </Button>
    </Notice>
  )
}
