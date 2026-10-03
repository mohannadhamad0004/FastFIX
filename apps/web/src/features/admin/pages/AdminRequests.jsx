import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ACCOUNT_TYPE_LABELS } from '../../../auth/constants.js'
import Drawer from '../../../components/Drawer.jsx'
import Notice from '../../../components/Notice.jsx'
import { SkeletonRows } from '../../../components/Skeleton.jsx'
import StatusBadge from '../../../components/StatusBadge.jsx'
import { REQUEST_TYPE_LABELS, requestStatusBadge } from '../../requests/constants.js'
import { ACTIVE_EMERGENCY, emergencyKindLabel, emergencyProblemLabel, EMERGENCY_STATUS_LABELS } from '../../requests/emergency/constants.js'
import { useEmergency } from '../../requests/emergency/EmergencyContext.js'
import { summarizeRequest, TARGET_PATHS } from '../../requests/format.js'
import AdminPage from '../components/AdminPage.jsx'
import AdminTable from '../components/AdminTable.jsx'
import DetailList from '../components/DetailList.jsx'
import FilterChips from '../components/FilterChips.jsx'
import RowMenu from '../components/RowMenu.jsx'
import ShortId from '../components/ShortId.jsx'
import { useAdminQuery } from '../AdminContext.js'
import styles from './AdminRequests.module.css'

const loadRequests = (service) => service.getAllRequests()

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

// "2 min 05 s" / "45 s" / "-" between two ISO dates
function duration(from, to) {
  if (!from || !to) return '-'
  const seconds = Math.max(0, Math.round((new Date(to) - new Date(from)) / 1000))
  return seconds < 60 ? `${seconds} s` : `${Math.floor(seconds / 60)} min ${String(seconds % 60).padStart(2, '0')} s`
}

const emergencyTone = { completed: 'success', cancelled: 'neutral', unavailable: 'danger' }
const emergencyBadge = (e) => (
  <StatusBadge label={EMERGENCY_STATUS_LABELS[e.status]} tone={emergencyTone[e.status] ?? (ACTIVE_EMERGENCY.includes(e.status) ? 'danger' : 'info')} />
)

// The status of a request: its badge, plus "Disputed" / "Not confirmed yet" when they apply.
function RequestStatus({ request: r }) {
  return (
    <>
      <StatusBadge {...requestStatusBadge(r.status)} />
      {r.disputedAt && <StatusBadge label="Disputed: didn't happen" tone="danger" />}
      {r.status === 'completed' && !r.customerConfirmedAt && !r.disputedAt && (
        <span className={styles.subline}>Not confirmed yet</span>
      )}
    </>
  )
}

// Emergency requests (features/requests/emergency): active first, then past ones, with how long it
// took until someone accepted and until they arrived. A row opens its drawer.
function EmergencyTable() {
  const { service, emergencies } = useEmergency()
  const [list, setList] = useState(null)
  const [openId, setOpenId] = useState(null)
  useEffect(() => {
    service.getAllEmergencies().then(setList, () => setList([]))
  }, [service, emergencies])
  const sorted = useMemo(
    () => [...(list ?? [])].sort((a, b) => Number(ACTIVE_EMERGENCY.includes(b.status)) - Number(ACTIVE_EMERGENCY.includes(a.status))),
    [list],
  )
  if (!list) return null
  const open = list.find((e) => e.id === openId) ?? null
  return (
    <section className={styles.emergencies} aria-labelledby="admin-emergencies">
      <h2 id="admin-emergencies" className={styles.heading}>
        Emergencies ({list.filter((e) => ACTIVE_EMERGENCY.includes(e.status)).length} active, {list.length} in total)
      </h2>
      <AdminTable
        caption="Emergencies"
        emptyText="No emergencies yet."
        rows={sorted}
        selectedKey={openId}
        onRowOpen={(e) => setOpenId(e.id)}
        columns={[
          { key: 'date', header: 'Date', nowrap: true, render: (e) => formatDateTime(e.createdAt) },
          { key: 'id', header: 'ID', nowrap: true, render: (e) => <ShortId id={e.id} /> },
          { key: 'what', header: 'What', render: (e) => <>{emergencyKindLabel(e.kind)}<span className={styles.subline}>{emergencyProblemLabel(e.details.problemType)}</span></> },
          {
            key: 'customer',
            header: 'Customer',
            render: (e) => (
              <>
                {e.customer.userId ? <Link to={`/admin/users/${e.customer.userId}`}>{e.customer.name}</Link> : e.customer.name}
                <span className={styles.subline}>{e.customer.userId ? e.customer.phone : `Visitor · ${e.customer.phone}`}</span>
              </>
            ),
          },
          {
            key: 'responder',
            header: 'Responder',
            render: (e) =>
              e.responder ? (
                <>
                  <Link to={`/admin/users/${e.responder.id}`}>{e.responder.company}</Link>
                  <span className={styles.subline}>{e.responder.simulated ? 'Simulated driver' : e.responder.name}</span>
                </>
              ) : (
                `${e.offers.length} offered, wave ${e.wave}`
              ),
          },
          { key: 'accepted', header: 'Until accepted', nowrap: true, render: (e) => duration(e.createdAt, e.acceptedAt) },
          { key: 'arrived', header: 'Until arrival', nowrap: true, render: (e) => duration(e.createdAt, e.arrivedAt) },
          { key: 'status', header: 'Status', render: emergencyBadge },
          {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            nowrap: true,
            render: (e) => <RowMenu label={`Actions for the emergency of ${e.customer.name}`} items={[{ label: 'View details', onSelect: () => setOpenId(e.id) }]} />,
          },
        ]}
      />
      <Drawer open={Boolean(open)} narrow title={open ? `Emergency · ${emergencyKindLabel(open.kind)}` : ''} onClose={() => setOpenId(null)}>
        {open && (
          <div className={styles.drawerBody}>
            {emergencyBadge(open)}
            <DetailList
              items={[
                { label: 'Problem', value: emergencyProblemLabel(open.details.problemType) },
                { label: 'Requested', value: formatDateTime(open.createdAt) },
                { label: 'Customer', value: open.customer.name },
                { label: 'Phone', value: open.customer.phone },
                { label: 'Responder', value: open.responder ? open.responder.company : `${open.offers.length} offered, wave ${open.wave}` },
                { label: 'Until accepted', value: duration(open.createdAt, open.acceptedAt) },
                { label: 'Until arrival', value: duration(open.createdAt, open.arrivedAt) },
                { label: 'ID', value: <ShortId id={open.id} full /> },
              ]}
            />
          </div>
        )}
      </Drawer>
    </section>
  )
}

// /admin/requests?type=tow - read-only monitor of every request on the platform. A row opens a
// drawer with its details and links to the sender and the target.
export default function AdminRequests() {
  const { data: requests, error } = useAdminQuery(loadRequests)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [openId, setOpenId] = useState(null)
  const type = searchParams.get('type') ?? ''
  const emergencyOnly = type === 'emergency'

  const results = useMemo(() => (requests ?? []).filter((r) => !type || r.type === type), [requests, type])
  const filters = [
    { value: '', label: 'All' },
    { value: 'emergency', label: 'Emergency' },
    ...Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => ({ value, label })),
  ]
  const open = (requests ?? []).find((r) => r.id === openId) ?? null

  return (
    <AdminPage title="Requests" description="Emergencies first, then every service, tow and part request on FastFix, newest first. Requests the sender says did not happen are marked Disputed. Read-only.">
      <FilterChips
        label="Request type"
        options={filters}
        value={type}
        onChange={(value) => setSearchParams(value ? { type: value } : {}, { replace: true })}
      />

      {(!type || emergencyOnly) && <EmergencyTable />}

      {error && !emergencyOnly && <Notice tone="danger">Couldn't load requests: {error.message}</Notice>}
      {!emergencyOnly && !requests && !error && <SkeletonRows label="Loading…" />}
      {requests && !emergencyOnly && (
        <>
          <p className={styles.muted} aria-live="polite">
            {results.length} {results.length === 1 ? 'request' : 'requests'}
          </p>
          <AdminTable
            caption="Requests"
            emptyText="No requests yet."
            rows={results}
            selectedKey={openId}
            onRowOpen={(r) => setOpenId(r.id)}
            columns={[
              { key: 'date', header: 'Date', nowrap: true, render: (r) => formatDateTime(r.createdAt) },
              { key: 'id', header: 'ID', nowrap: true, render: (r) => <ShortId id={r.id} /> },
              { key: 'type', header: 'Type', nowrap: true, render: (r) => REQUEST_TYPE_LABELS[r.type] },
              {
                key: 'sender',
                header: 'Sender',
                nowrap: true,
                render: (r) => (
                  <>
                    <Link to={`/admin/users/${r.sender.id}`}>{r.sender.name}</Link>
                    <span className={styles.subline}>{ACCOUNT_TYPE_LABELS[r.sender.role]}</span>
                  </>
                ),
              },
              {
                key: 'target',
                header: 'Target',
                nowrap: true,
                render: (r) => (
                  <>
                    <Link to={TARGET_PATHS[r.target.type](r.target.id)}>{r.target.name}</Link>
                    <span className={styles.subline}>{ACCOUNT_TYPE_LABELS[r.target.type]}</span>
                  </>
                ),
              },
              { key: 'details', header: 'Details', render: (r) => <span className={styles.details}>{summarizeRequest(r)}</span> },
              { key: 'status', header: 'Status', render: (r) => <RequestStatus request={r} /> },
              {
                key: 'actions',
                header: 'Actions',
                align: 'right',
                nowrap: true,
                render: (r) => (
                  <RowMenu
                    label={`Actions for the ${REQUEST_TYPE_LABELS[r.type].toLowerCase()} from ${r.sender.name}`}
                    items={[
                      { label: 'View details', onSelect: () => setOpenId(r.id) },
                      { label: 'View sender', onSelect: () => navigate(`/admin/users/${r.sender.id}`) },
                      { label: 'View target', onSelect: () => navigate(TARGET_PATHS[r.target.type](r.target.id)) },
                    ]}
                  />
                ),
              },
            ]}
          />
        </>
      )}

      <Drawer open={Boolean(open)} narrow title={open ? REQUEST_TYPE_LABELS[open.type] : ''} onClose={() => setOpenId(null)}>
        {open && (
          <div className={styles.drawerBody}>
            <div className={styles.badges}>
              <RequestStatus request={open} />
            </div>
            <DetailList
              items={[
                { label: 'Sent', value: formatDateTime(open.createdAt) },
                { label: 'Sender', value: <Link to={`/admin/users/${open.sender.id}`}>{open.sender.name}</Link> },
                { label: 'Sender role', value: ACCOUNT_TYPE_LABELS[open.sender.role] },
                { label: 'Target', value: <Link to={TARGET_PATHS[open.target.type](open.target.id)}>{open.target.name}</Link> },
                { label: 'Details', value: summarizeRequest(open) },
                { label: 'ID', value: <ShortId id={open.id} full /> },
              ]}
            />
          </div>
        )}
      </Drawer>
    </AdminPage>
  )
}
