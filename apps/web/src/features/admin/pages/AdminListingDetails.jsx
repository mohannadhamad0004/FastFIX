import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router'
import Button from '../../../components/Button.jsx'
import Notice from '../../../components/Notice.jsx'
import { SkeletonRows } from '../../../components/Skeleton.jsx'
import { formatDate } from '../../../utils/formatDate.js'
import PartCard from '../../marketplace/components/PartCard.jsx'
import AdminPage from '../components/AdminPage.jsx'
import ReasonDialog from '../components/ReasonDialog.jsx'
import TagPicker from '../components/TagPicker.jsx'
import { useAdminQuery, useAdminService } from '../AdminContext.js'
import styles from './AdminListingDetails.module.css'

// /admin/listings/:partId - one part: how it looks publicly, its tags, and hide / unhide.
export default function AdminListingDetails() {
  const { partId } = useParams()
  const service = useAdminService()
  const loadPart = useCallback((s) => s.getListing(partId), [partId])
  const { data: part, error } = useAdminQuery(loadPart)
  const [hiding, setHiding] = useState(false)
  const [notice, setNotice] = useState(null)

  if (error) {
    return (
      <AdminPage title="Part not found">
        <Notice tone="danger">{error.message}</Notice>
        <Button to="/admin/listings" variant="secondary">
          ← All listings
        </Button>
      </AdminPage>
    )
  }
  if (!part) return <SkeletonRows rows={3} label="Loading…" />

  async function hide(reason) {
    await service.hidePart(part.id, reason)
    setHiding(false)
    setNotice({ tone: 'success', text: 'The part is hidden from the marketplace. The shop sees your reason on its dashboard.' })
  }

  async function unhide() {
    try {
      await service.unhidePart(part.id)
      setNotice({ tone: 'success', text: 'The part is visible in the marketplace again.' })
    } catch (err) {
      setNotice({ tone: 'danger', text: err.message })
    }
  }

  return (
    <AdminPage
      title={part.name}
      description={`${part.shopName} · added ${formatDate(part.addedAt)}`}
      actions={
        <>
          <Button to="/admin/listings" variant="secondary">
            ← All listings
          </Button>
          {part.hidden ? (
            <Button onClick={unhide}>Unhide part</Button>
          ) : (
            <Button variant="danger" onClick={() => setHiding(true)}>
              Hide part
            </Button>
          )}
        </>
      }
    >
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

      {part.hidden ? (
        <Notice tone="danger" title={`Hidden since ${formatDate(part.hidden.hiddenAt)}`}>
          <p>Reason shown to the shop: {part.hidden.reason}</p>
        </Notice>
      ) : (
        part.shopSuspended && (
          <Notice tone="warning">
            This part isn't public because its shop is suspended.{' '}
            <Link to={`/admin/users/${part.shopId}`}>View the shop account</Link>
          </Notice>
        )
      )}

      <div className={styles.layout}>
        <div className={styles.preview}>
          <p className={styles.label}>Public card</p>
          <PartCard part={part} showShop={false} />
        </div>
        <section className={styles.card}>
          <TagPicker targetType="part" targetId={part.id} tagIds={part.tagIds ?? []} />
        </section>
      </div>

      <ReasonDialog
        open={hiding}
        title="Hide this part?"
        label="Reason"
        hint="The shop sees this on its dashboard. E.g. the photos show a different part, or the price is misleading."
        requiredMessage="Write why the part is hidden - the shop will see it."
        confirmLabel="Hide part"
        onCancel={() => setHiding(false)}
        onConfirm={hide}
      />
    </AdminPage>
  )
}
