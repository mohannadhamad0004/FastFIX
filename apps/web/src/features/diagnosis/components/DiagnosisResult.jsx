import { Link } from 'react-router'
import Badge from '../../../components/Badge.jsx'
import Button from '../../../components/Button.jsx'
import Card from '../../../components/Card.jsx'
import Notice from '../../../components/Notice.jsx'
import Skeleton, { SkeletonText } from '../../../components/Skeleton.jsx'
import { DISCLAIMER, EVIDENCE, mediaTypeInfo, URGENCY } from '../constants.js'
import { SparkIcon, TruckIcon, WrenchIcon } from './icons.jsx'
import styles from './DiagnosisResult.module.css'

const URGENCY_ICONS = { safe: '✓', soon: '!', stop: '■' }

/**
 * The AI report under the diagnosis card: loading skeleton, error, or the result. The AI Agent page
 * shows saved reports with it too.
 * `headingRef` goes on the report heading, so the page can move focus there when the result arrives.
 * `actions` replaces the default buttons ("Find a mechanic for this", "Request a tow"); `media`
 * (e.g. the original photo / video / sound) is shown under the header.
 * @param {{ run: { status: string, result: import('../types.js').Diagnosis | null, error: Error | null },
 *   onRetry?: () => void, headingRef?: React.Ref<HTMLHeadingElement>, actions?: React.ReactNode,
 *   media?: React.ReactNode, headingLevel?: 'h1' | 'h2' }} props
 */
export default function DiagnosisResult({ run, onRetry, headingRef, actions = null, media = null, headingLevel = 'h2' }) {
  const Heading = headingLevel
  if (run.status === 'loading') return <ResultLoading />

  if (run.status === 'error') {
    return (
      <Notice tone="danger" title="We couldn't analyze your car">
        <p>{run.error?.message || 'Something went wrong. Please try again.'}</p>
        <div>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      </Notice>
    )
  }

  if (run.status !== 'done' || !run.result) return null
  const result = run.result
  const urgency = URGENCY[result.urgency]
  const { car } = result
  const [topCause, ...otherCauses] = result.possibleCauses

  return (
    <Card as="section" padding="lg" elevated className={styles.report} aria-labelledby="diagnosis-report-title">
      <header className={styles.header}>
        <span className={styles.headerIcon} aria-hidden="true">
          <SparkIcon size={22} />
        </span>
        <div>
          <Heading id="diagnosis-report-title" className={styles.title} ref={headingRef} tabIndex={-1}>
            Your AI report
          </Heading>
          <p className={styles.meta}>
            {mediaTypeInfo(result.mediaType).label} ·{' '}
            {new Date(result.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
      </header>

      <div className={styles.vehicle}>
        <span className={styles.vehicleLabel}>Vehicle</span>
        <span className={styles.vehicleName}>
          {car.make} {car.model}
          {car.year ? ` ${car.year}` : ''}
        </span>
      </div>

      {media}

      <div className={`${styles.urgency} ${styles[result.urgency]}`} role={result.urgency === 'stop' ? 'alert' : undefined}>
        <span className={styles.urgencyIcon} aria-hidden="true">
          {URGENCY_ICONS[result.urgency]}
        </span>
        <div>
          <p className={styles.urgencyLabel}>{urgency.label}</p>
          <p className={styles.urgencyText}>{urgency.text}</p>
        </div>
      </div>

      {topCause && (
        <section className={styles.lead} aria-labelledby="diagnosis-lead">
          <h3 id="diagnosis-lead" className={styles.sectionTitle}>
            Most likely issue
          </h3>
          <p className={styles.leadCause}>{topCause.cause}</p>
          <p className={styles.leadEvidence}>
            Evidence strength: <EvidenceBadge evidence={topCause.evidence} />
          </p>
        </section>
      )}

      <div className={styles.columns}>
        <div className={styles.column}>
          <section aria-labelledby="diagnosis-observed">
            <h3 id="diagnosis-observed" className={styles.sectionTitle}>
              What the AI observed
            </h3>
            <p className={styles.observations}>{result.observations}</p>
          </section>

          {otherCauses.length > 0 && (
            <section aria-labelledby="diagnosis-causes">
              <h3 id="diagnosis-causes" className={styles.sectionTitle}>
                Other possible causes
              </h3>
              <ol className={styles.causes}>
                {otherCauses.map(({ cause, evidence }) => (
                  <li key={cause} className={styles.cause}>
                    <span className={styles.causeText}>{cause}</span>
                    <EvidenceBadge evidence={evidence} />
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <section className={styles.column} aria-labelledby="diagnosis-checks">
          <h3 id="diagnosis-checks" className={styles.sectionTitle}>
            Recommended checks for the mechanic
          </h3>
          <ol className={styles.checks}>
            {result.recommendedChecks.map((check) => (
              <li key={check}>{check}</li>
            ))}
          </ol>
        </section>
      </div>

      <div className={styles.nextSteps}>
        <div className={styles.skill}>
          <span className={styles.skillLabel}>Recommended mechanic specialty</span>
          <Badge tone="primary" size="md">
            <WrenchIcon size={14} /> {result.suggestedSkill}
          </Badge>
        </div>
        <div className={styles.actions}>
          {actions ?? (
            <>
              <Button to={`/mechanics?skill=${encodeURIComponent(result.suggestedSkill)}`} size="lg">
                Find a mechanic
              </Button>
              <Button to="/tow-companies" variant={result.urgency === 'stop' ? 'danger' : 'secondary'} size="lg">
                <TruckIcon size={18} /> Request towing
              </Button>
            </>
          )}
        </div>
      </div>
      <footer className={styles.footer}>
        <p className={styles.disclaimer}>
          <span aria-hidden="true">ⓘ </span>
          {DISCLAIMER}
        </p>
        {result.userId && !actions && (
          <p className={styles.saved}>
            ✓ Saved to your <Link to="/ai-agent">AI Agent history</Link>
          </p>
        )}
      </footer>
    </Card>
  )
}

// "Strong evidence" with a 3-step meter. Never a percentage.
function EvidenceBadge({ evidence }) {
  const info = EVIDENCE[evidence]
  return (
    <Badge tone={info.tone} className={styles.evidence}>
      <span className={styles.meter} aria-hidden="true">
        {[1, 2, 3].map((step) => (
          <span key={step} className={step <= info.level ? styles.filled : styles.empty} />
        ))}
      </span>
      <span aria-hidden="true">{info.short}</span>
      <span className={styles.srOnly}>{info.label}</span>
    </Badge>
  )
}

function ResultLoading() {
  return (
    <Card as="section" padding="lg" className={styles.report} aria-busy="true" aria-labelledby="diagnosis-loading-title">
      <div className={styles.loadingHeader} role="status">
        <span className={styles.spinner} aria-hidden="true" />
        <div>
          <h2 id="diagnosis-loading-title" className={styles.title}>
            Analyzing your car…
          </h2>
          <p className={styles.meta}>This usually takes a few seconds.</p>
        </div>
      </div>
      <Skeleton variant="rect" height={64} />
      <div className={styles.columns}>
        <div className={styles.column}>
          <SkeletonText lines={4} />
          <SkeletonText lines={3} />
        </div>
        <div className={styles.column}>
          <SkeletonText lines={4} />
        </div>
      </div>
    </Card>
  )
}
