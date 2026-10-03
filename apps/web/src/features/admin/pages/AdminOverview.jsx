import { Link } from 'react-router'
import { ACCOUNT_TYPE_LABELS } from '../../../auth/constants.js'
import Notice from '../../../components/Notice.jsx'
import { SkeletonCards } from '../../../components/Skeleton.jsx'
import { formatDate } from '../../../utils/formatDate.js'
import { formatPrice } from '../../marketplace/format.js'
import AdminPage from '../components/AdminPage.jsx'
import { useAdminAttention } from '../components/useAdminAttention.js'
import { useAdminQuery } from '../AdminContext.js'
import { APPROVAL_TABS } from '../constants.js'
import styles from './AdminOverview.module.css'

const loadOverview = (service) => service.getOverview()

// A group of related numbers on one surface (a number can link to the page that acts on it).
function StatGroup({ id, title, stats }) {
  return (
    <section aria-labelledby={id} className={styles.group}>
      <h2 id={id} className={styles.groupTitle}>
        {title}
      </h2>
      <dl className={styles.stats}>
        {stats.map(({ label, value, to }) => (
          <div key={label} className={styles.stat}>
            <dt className={styles.label}>{label}</dt>
            <dd className={styles.value}>{to ? <Link to={to}>{value}</Link> : value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

// /admin - what needs a decision first, then the platform numbers in groups, then the newest signups.
export default function AdminOverview() {
  const { data, error } = useAdminQuery(loadOverview)
  const attention = useAdminAttention().data

  const needs = attention && [
    { label: 'Pending accounts', count: attention.accounts, to: '/admin/approvals' },
    { label: 'Pending mechanic skills', count: attention.skills, to: '/admin/approvals?tab=mechanic' },
    { label: 'Pending trucks', count: attention.trucks, to: '/admin/approvals?tab=tow' },
    { label: 'Reported reviews', count: attention.reports, to: '/admin/reviews' },
  ]

  return (
    <AdminPage title="Overview" description="What needs your attention on FastFix today.">
      {error && <Notice tone="danger">Couldn't load the overview: {error.message}</Notice>}
      {!data && !error && <SkeletonCards count={4} label="Loading…" />}
      {data && (
        <>
          <section aria-labelledby="attention-title" className={styles.attention}>
            <h2 id="attention-title" className={styles.attentionTitle}>
              Needs your attention
            </h2>
            {needs ? (
              <ul className={styles.needs}>
                {needs.map(({ label, count, to }) => (
                  <li key={label}>
                    <Link to={to} className={`${styles.need} ${count > 0 ? styles.pending : ''}`}>
                      <span className={styles.needCount}>{count}</span>
                      <span className={styles.needLabel}>{label}</span>
                      <span className={styles.needState}>{count > 0 ? 'Review now →' : '✓ Nothing waiting'}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <SkeletonCards count={4} label="Loading…" />
            )}
            {attention?.changes > 0 && (
              <p className={styles.note}>
                Plus {attention.changes} changed business {attention.changes === 1 ? 'name or license' : 'names or licenses'} on{' '}
                <Link to="/admin/approvals">Approvals</Link>.
              </p>
            )}
          </section>

          <div className={styles.groups}>
            <StatGroup
              id="users-title"
              title="Users"
              stats={[
                ...APPROVAL_TABS.map(({ role, label }) => ({
                  label: `Approved ${label.toLowerCase()}`,
                  value: data.approvedByRole[role],
                  to: `/admin/approvals?tab=${role}`,
                })),
                { label: 'Suspended accounts', value: data.suspendedUsers, to: '/admin/users' },
              ]}
            />
            <StatGroup
              id="marketplace-title"
              title="Marketplace"
              stats={[
                { label: 'Parts listed', value: data.partsListed, to: '/admin/listings' },
                { label: 'Parts hidden', value: data.partsHidden, to: '/admin/listings' },
              ]}
            />
            <StatGroup
              id="activity-title"
              title="Requests and orders"
              stats={[
                { label: 'Requests today', value: data.requestsToday, to: '/admin/requests' },
                { label: 'Orders in total', value: data.orders.total, to: '/admin/orders' },
                { label: 'New, waiting for the shop', value: data.orders.new, to: '/admin/orders?status=placed' },
                { label: 'In progress', value: data.orders.inProgress },
                { label: 'Completed', value: data.orders.completed },
                { label: 'Cancelled', value: data.orders.cancelled, to: '/admin/orders?status=cancelled' },
                { label: 'Order value, cancelled excluded', value: formatPrice(data.orders.valueIls) },
                { label: 'Value of completed orders', value: formatPrice(data.orders.completedValueIls) },
              ]}
            />
          </div>

          <section aria-labelledby="newest-title" className={styles.group}>
            <h2 id="newest-title" className={styles.groupTitle}>
              Newest pending signups
            </h2>
            {data.newestPending.length === 0 ? (
              <p className={styles.muted}>No signups are waiting. 🎉</p>
            ) : (
              <ul className={styles.list}>
                {data.newestPending.map((account) => (
                  <li key={account.id}>
                    <Link to={`/admin/approvals?tab=${account.role}&account=${account.id}`} className={styles.listItem}>
                      <span className={styles.listName}>{account.name}</span>
                      <span className={styles.muted}>
                        {ACCOUNT_TYPE_LABELS[account.role]} · {account.city} · {formatDate(account.createdAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </AdminPage>
  )
}
