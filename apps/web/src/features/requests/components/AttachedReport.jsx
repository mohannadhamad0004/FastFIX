import Badge from '../../../components/Badge.jsx'
import { EVIDENCE, mediaTypeInfo, URGENCY } from '../../diagnosis/constants.js'
import { formatDateTime } from '../format.js'
import styles from './AttachedReport.module.css'

// The AI report attached to a service request: urgency, top cause, and (when `expandable`) the
// observations, every possible cause and the recommended checks behind a disclosure.
export default function AttachedReport({ diagnosis, expandable = true }) {
  const urgency = URGENCY[diagnosis.urgency]
  const [top, ...others] = diagnosis.possibleCauses

  return (
    <div className={styles.report}>
      <div className={styles.header}>
        <span className={styles.label}>
          <span aria-hidden="true">✨ </span>AI report · {mediaTypeInfo(diagnosis.mediaType)?.label} ·{' '}
          {formatDateTime(diagnosis.createdAt)}
        </span>
        <Badge tone={urgency.tone}>{urgency.label}</Badge>
      </div>
      <p className={styles.cause}>
        Most likely: <strong>{top?.cause}</strong>
      </p>
      {expandable && (
        <details className={styles.details}>
          <summary>Full AI report</summary>
          <div className={styles.body}>
            <p>{diagnosis.observations}</p>
            {others.length > 0 && (
              <>
                <p className={styles.subtitle}>Other possible causes</p>
                <ul>
                  {others.map(({ cause, evidence }) => (
                    <li key={cause}>
                      {cause} <span className={styles.muted}>({EVIDENCE[evidence].label.toLowerCase()})</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <p className={styles.subtitle}>Recommended checks</p>
            <ol>
              {diagnosis.recommendedChecks.map((check) => (
                <li key={check}>{check}</li>
              ))}
            </ol>
          </div>
        </details>
      )}
    </div>
  )
}
