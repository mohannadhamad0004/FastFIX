import { useState } from 'react'
import { Link } from 'react-router'
import { ACCOUNT_TYPE_LABELS } from '../../../auth/constants.js'
import { changeOf, REVIEW_ITEM_KINDS } from '../../../auth/reviewItems.js'
import Button from '../../../components/Button.jsx'
import FilePreview from '../../../components/FilePreview.jsx'
import { formatWeight, truckTypeLabel } from '../../logistics/format.js'
import { formatDate } from '../../../utils/formatDate.js'
import { useAdminService } from '../AdminContext.js'
import ReasonDialog from './ReasonDialog.jsx'
import styles from './UpdateReview.module.css'

const REJECT_HINTS = {
  [REVIEW_ITEM_KINDS.CHANGE]: 'They see this on their profile, and the approved value stays. E.g. the new name does not match the business license.',
  [REVIEW_ITEM_KINDS.SKILL]: 'The mechanic sees this on their profile. E.g. the certificate is unreadable, please upload a clearer scan.',
  [REVIEW_ITEM_KINDS.TRUCK]: 'The company sees this on its trucks page. E.g. the insurance has expired.',
}

// Everything an approved account sent for review after approval, each approved or rejected on its
// own: a changed business/workshop name or license, a new or re-certified skill, a new or edited
// truck. `account` comes from getUpdatesToReview (with reviewItems). onDecided(message) runs after
// each decision. Mount with key={account.id}.
export default function UpdateReview({ account, onDecided }) {
  const service = useAdminService()
  const [busyItem, setBusyItem] = useState(null)
  const [rejecting, setRejecting] = useState(null)
  const [error, setError] = useState(null)

  async function approve(item) {
    setBusyItem(item)
    setError(null)
    try {
      await service.approveUpdate(account.id, item.kind, item.id)
      onDecided(`${item.label} approved for ${account.name}.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyItem(null)
    }
  }

  async function reject(reason) {
    await service.rejectUpdate(account.id, rejecting.kind, rejecting.id, reason)
    const { label } = rejecting
    setRejecting(null)
    onDecided(`${label} rejected. ${account.name} will see your reason.`)
  }

  return (
    <div className={styles.review}>
      <header className={styles.header}>
        <div>
          <h3 className={styles.name}>{account.name}</h3>
          <p className={styles.muted}>
            {ACCOUNT_TYPE_LABELS[account.role]} · {account.email} · approved {formatDate(account.reviewedAt)}
          </p>
        </div>
        <Link to={`/admin/users/${account.id}`}>View account</Link>
      </header>
      <p className={styles.muted}>
        This account is already approved. Decide on each update on its own - nothing else about the account changes.
      </p>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <ul className={styles.items}>
        {account.reviewItems.map((item) => (
          <li key={`${item.kind}-${item.id}`} className={styles.item}>
            <div className={styles.itemHeader}>
              <h4 className={styles.itemTitle}>{item.label}</h4>
              <span className={styles.muted}>Sent {formatDate(item.submittedAt)}</span>
            </div>
            <ItemDetails account={account} item={item} />
            <div className={styles.actions}>
              <Button size="sm" onClick={() => approve(item)} loading={busyItem === item} disabled={Boolean(busyItem)}>
                Approve
              </Button>
              <Button size="sm" variant="danger" onClick={() => setRejecting(item)} disabled={Boolean(busyItem)}>
                Reject
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <ReasonDialog
        open={Boolean(rejecting)}
        title={rejecting ? `Reject: ${rejecting.label}?` : ''}
        label="Reason"
        hint={rejecting ? REJECT_HINTS[rejecting.kind] : ''}
        requiredMessage="Write the reason so they know what to fix."
        confirmLabel="Reject"
        onCancel={() => setRejecting(null)}
        onConfirm={reject}
      />
    </div>
  )
}

function ItemDetails({ account, item }) {
  if (item.kind === REVIEW_ITEM_KINDS.CHANGE) {
    const change = changeOf(account, item.id)
    if (item.id === 'businessLicense') {
      return (
        <div className={styles.compare}>
          <Files title="Current license" files={account.businessLicense} />
          <Files title="New license" files={change.value} />
        </div>
      )
    }
    return (
      <dl className={styles.facts}>
        <Fact label="Current" value={account[item.id]} />
        <Fact label="New" value={change.value} strong />
      </dl>
    )
  }

  if (item.kind === REVIEW_ITEM_KINDS.SKILL) {
    const skill = account.skills.find((s) => s.id === item.id)
    return (
      <>
        <dl className={styles.facts}>
          <Fact label="Skill" value={skill.skill} />
          <Fact label="Experience" value={`${skill.years} ${skill.years === 1 ? 'year' : 'years'}`} />
        </dl>
        <Files title="Certificate" files={skill.certificate} />
      </>
    )
  }

  const truck = account.trucks.find((t) => t.id === item.id)
  return (
    <>
      <dl className={styles.facts}>
        <Fact label="Plate" value={truck.plateNumber} />
        <Fact label="Type" value={truckTypeLabel(truck.type)} />
        <Fact label="Max weight" value={formatWeight(truck.maxWeightKg)} />
      </dl>
      <Files title="Photos" files={truck.photos} />
      <div className={styles.compare}>
        <Files title="Registration" files={truck.registration} />
        <Files title="Insurance" files={truck.insurance} />
      </div>
    </>
  )
}

function Fact({ label, value, strong = false }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className={strong ? styles.strong : undefined}>{value}</dd>
    </div>
  )
}

function Files({ title, files }) {
  const list = (Array.isArray(files) ? files : [files]).filter(Boolean)
  return (
    <div className={styles.files}>
      <p className={styles.filesTitle}>{title}</p>
      {list.length ? (
        <ul className={styles.fileList}>
          {list.map((file) => (
            <li key={`${file.name}-${file.size}-${file.lastModified}`}>
              <FilePreview file={file} />
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.muted}>None</p>
      )}
    </div>
  )
}
