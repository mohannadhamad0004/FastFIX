import { Link } from 'react-router'
import Badge from '../../../components/Badge.jsx'
import Button from '../../../components/Button.jsx'
import EmptyState from '../../../components/EmptyState.jsx'
import Notice from '../../../components/Notice.jsx'
import { SkeletonRows } from '../../../components/Skeleton.jsx'
import { formatDate } from '../../../utils/formatDate.js'
import { formatPrice } from '../../marketplace/format.js'
import { formatCar } from '../carDetails.js'
import { REQUEST_TYPES } from '../constants.js'
import { useRequestsQuery } from '../RequestsContext.js'
import { useReviewPrompts } from '../ReviewsContext.js'
import styles from './ReportsPage.module.css'

const loadReports = (service) => service.getMyReports()

// /reports (customers) - the final reports of completed service and tow requests, newest first.
// Each opens a printable report (/reports/:requestId).
export default function ReportsPage() {
  const { data: reports, error } = useRequestsQuery(loadReports)
  const toRate = new Set(useReviewPrompts().map((prompt) => prompt.id)) // confirmed, no review yet

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.title}>Reports</h1>
        <p className={styles.subtitle}>
          Final reports of your completed repairs and tows. Open one to print it or save it as a PDF.
        </p>
      </header>

      {toRate.size > 0 && (
        <Notice tone="warning" title={`${toRate.size} completed ${toRate.size === 1 ? 'request has' : 'requests have'} no review yet`}>
          Look for "Not reviewed yet" below. Your review helps other customers choose.
        </Notice>
      )}

      {error && <Notice tone="danger">Couldn't load your reports: {error.message}</Notice>}
      {!reports && !error && <SkeletonRows rows={3} label="Loading your reports…" />}
      {reports?.length === 0 && (
        <EmptyState
          icon="📄"
          title="No reports yet"
          description="When a mechanic or tow company completes your request, its report appears here."
          action={<Button to="/mechanics">Find a mechanic</Button>}
        />
      )}
      {reports?.length > 0 && (
        <ul className={styles.list}>
          {reports.map((request) => {
            const isService = request.type === REQUEST_TYPES.SERVICE
            return (
              <li key={request.id}>
                <Link to={`/reports/${request.id}`} className={styles.item}>
                  <span className={styles.icon} aria-hidden="true">
                    {isService ? '🔧' : '🚚'}
                  </span>
                  <span className={styles.text}>
                    <span className={styles.name}>
                      {isService ? 'Service report' : 'Tow report'} · {request.target.name}
                    </span>
                    <span className={styles.muted}>
                      {formatDate(request.completion.completedAt)}
                      {request.details.car && ` · ${formatCar(request.details.car)}`}
                      {isService && request.completion.confirmedDiagnosis && ` · ${request.completion.confirmedDiagnosis}`}
                      {!isService && ` · ${request.details.pickup} → ${request.details.destination}`}
                    </span>
                  </span>
                  <span className={styles.badges}>
                    {toRate.has(request.id) && <Badge tone="warning">Not reviewed yet</Badge>}
                    {request.disputedAt ? (
                      <Badge tone="danger">Disputed</Badge>
                    ) : (
                      !request.customerConfirmedAt && <Badge tone="info">Confirm completion</Badge>
                    )}
                    <Badge tone="neutral" size="md">
                      {formatPrice(request.completion.totalIls)}
                    </Badge>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
