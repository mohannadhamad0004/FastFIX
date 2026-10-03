import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ROLE_LABELS } from '../../../authorization/roles.js'
import Notice from '../../../components/Notice.jsx'
import SearchBar from '../../../components/SearchBar.jsx'
import Select from '../../../components/Select.jsx'
import { SkeletonRows } from '../../../components/Skeleton.jsx'
import StatusBadge from '../../../components/StatusBadge.jsx'
import { formatPrice } from '../../marketplace/format.js'
import { ORDER_STATUS_BADGES, orderStatusBadge } from '../../marketplace/orderConstants.js'
import AdminPage from '../components/AdminPage.jsx'
import AdminTable from '../components/AdminTable.jsx'
import { useAdminQuery } from '../AdminContext.js'
import styles from './AdminOrders.module.css'

const loadOrders = (service) => service.getAllOrders()

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

// What the search box looks through.
const searchText = (order) => [order.checkoutNumber, order.id, order.shopName, order.buyerName].join(' ').toLowerCase()

// /admin/orders?q=FF-10002&status=placed - every order of every shop. Search by checkout number,
// shop or buyer, and filter by status. Opening an order shows it read-only, with "Cancel order".
export default function AdminOrders() {
  const { data: orders, error } = useAdminQuery(loadOrders)
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const status = searchParams.get('status') ?? ''

  const update = (changes) => {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setSearchParams(next, { replace: true })
  }

  const results = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean)
    return (orders ?? []).filter(
      (order) => (!status || order.status === status) && words.every((word) => searchText(order).includes(word)),
    )
  }, [orders, q, status])

  return (
    <AdminPage title="Orders" description="Every parts order on FastFix, newest first. Open one to see its details or cancel it.">
      <div className={styles.filters}>
        <div className={styles.search}>
          <SearchBar id="order-search" value={q} onChange={(value) => update({ q: value })} label="Search orders" placeholder="Checkout number, shop or buyer" />
        </div>
        <label className={styles.filter}>
          <span>Status</span>
          <Select value={status} onChange={(event) => update({ status: event.target.value })}>
            <option value="">All statuses</option>
            {Object.entries(ORDER_STATUS_BADGES).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {error && <Notice tone="danger">Couldn't load orders: {error.message}</Notice>}
      {!orders && !error && <SkeletonRows label="Loading…" />}
      {orders && (
        <>
          <p className={styles.muted} aria-live="polite">
            {results.length} {results.length === 1 ? 'order' : 'orders'}
          </p>
          <AdminTable
            caption="Orders"
            emptyText="No orders match your search."
            rows={results}
            columns={[
              { key: 'date', header: 'Date', nowrap: true, render: (o) => formatDateTime(o.createdAt) },
              {
                key: 'checkout',
                header: 'Order',
                nowrap: true,
                render: (o) => (
                  <>
                    <Link to={`/admin/orders/${o.id}`}>{o.checkoutNumber}</Link>
                    <span className={styles.subline}>{o.id}</span>
                  </>
                ),
              },
              { key: 'shop', header: 'Shop', render: (o) => o.shopName },
              {
                key: 'buyer',
                header: 'Buyer',
                render: (o) => (
                  <>
                    {o.buyerName}
                    <span className={styles.subline}>{ROLE_LABELS[o.buyerRole]}</span>
                  </>
                ),
              },
              { key: 'total', header: 'Total', align: 'right', nowrap: true, render: (o) => formatPrice(o.totalIls) },
              { key: 'status', header: 'Status', render: (o) => <StatusBadge {...orderStatusBadge(o.status)} /> },
            ]}
          />
        </>
      )}
    </AdminPage>
  )
}
