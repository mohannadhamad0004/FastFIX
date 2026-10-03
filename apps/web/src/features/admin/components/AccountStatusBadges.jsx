import { STATUS_BADGES } from '../../../auth/constants.js'
import StatusBadge from '../../../components/StatusBadge.jsx'
import styles from './AccountStatusBadges.module.css'

// Approval status plus a "Suspended" badge when the account is suspended.
export default function AccountStatusBadges({ account }) {
  const status = STATUS_BADGES[account.status]
  return (
    <span className={styles.badges}>
      {status && <StatusBadge label={status.label} tone={status.tone} />}
      {account.suspended && <StatusBadge label="Suspended" tone="danger" />}
    </span>
  )
}
