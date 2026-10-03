import Button from '../../../components/Button.jsx'
import EmptyState from '../../../components/EmptyState.jsx'
import { SkeletonCards } from '../../../components/Skeleton.jsx'
import { useToast } from '../../../components/Toast/ToastContext.js'
import { useCart, useCartQuery } from '../CartContext.js'
import PartCard from '../components/PartCard.jsx'
import { getShopCommerce } from '../shopCommerce.js'
import styles from './SavedPartsPage.module.css'

const loadSaved = (service) => service.getSavedParts()

// /saved-parts - the parts the buyer saved for later. "Move to cart" puts one in the cart and takes
// it off this list.
export default function SavedPartsPage() {
  const { service } = useCart()
  const toast = useToast()
  const { data: saved, error } = useCartQuery(loadSaved)

  async function run(action, successMessage) {
    try {
      await action()
      if (successMessage) toast.success(successMessage)
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (error) return <EmptyState icon="⚠" title="Couldn't load your saved parts" description={error.message} />

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Button to="/marketplace" variant="ghost" size="sm">
          ← Marketplace
        </Button>
        <h1 className={styles.title}>Saved parts</h1>
      </header>

      {!saved ? (
        <SkeletonCards count={3} media label="Loading saved parts…" />
      ) : saved.length === 0 ? (
        <EmptyState
          icon="♡"
          title="No saved parts yet"
          description="Tap Save on a part to keep it here for later."
          action={<Button to="/marketplace">Browse parts</Button>}
        />
      ) : (
        <ul className={styles.grid}>
          {saved.map(({ part, shop }) => (
            <li key={part.id}>
              <PartCard
                part={part}
                shop={shop}
                footer={
                  <>
                    {getShopCommerce(shop).selling ? (
                      <Button
                      disabled={part.stock === 0}
                      onClick={() => run(() => service.moveToCart(part.id), 'Moved to your cart.')}
                      aria-label={`Move ${part.name} to cart`}
                    >
                      {part.stock === 0 ? 'Out of stock' : 'Move to cart'}
                    </Button>
                    ) : (
                      <p className={styles.notSelling}>This shop isn&apos;t taking online orders right now.</p>
                    )}
                    <Button variant="ghost" onClick={() => run(() => service.toggleSaved(part.id))} aria-label={`Remove ${part.name} from saved parts`}>
                      Remove
                    </Button>
                  </>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
