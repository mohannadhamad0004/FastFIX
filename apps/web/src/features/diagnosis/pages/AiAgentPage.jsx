import { Link } from 'react-router'
import Badge from '../../../components/Badge.jsx'
import Button from '../../../components/Button.jsx'
import EmptyState from '../../../components/EmptyState.jsx'
import Notice from '../../../components/Notice.jsx'
import { SkeletonRows } from '../../../components/Skeleton.jsx'
import { formatDateTime } from '../../requests/format.js'
import { mediaTypeInfo, URGENCY } from '../constants.js'
import { useMyDiagnoses } from '../DiagnosisContext.js'
import { CameraIcon, SoundIcon, SparkIcon, VideoIcon } from '../components/icons.jsx'
import styles from './AiAgentPage.module.css'

const MEDIA_ICONS ={ photo: CameraIcon, video: VideoIcon, audio: SoundIcon }

// /ai-agent (customers) - every AI diagnosis the customer ran, newest first. Each opens the full
// report with the original photo / video / sound (/ai-agent/:diagnosisId).
export default function AiAgentPage() {
  const { data: diagnoses, error } = useMyDiagnoses()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>AI Agent</h1>
          <p className={styles.subtitle}>
            Your AI diagnoses. Open one to see the full report, send it to a mechanic or find one with the right
            skill.
          </p>
        </div>
        <Button to="/diagnose">
          <SparkIcon size={18} /> New diagnosis
        </Button>
      </header>

      {error && <Notice tone="danger">Couldn't load your diagnoses: {error.message}</Notice>}
      {!diagnoses && !error && <SkeletonRows rows={3} label="Loading your diagnoses…" />}
      {diagnoses?.length === 0 && (
        <EmptyState
          icon="✨"
          title="No diagnoses yet"
          description="Upload a photo, a video or the sound of your engine and get a first AI assessment in seconds."
          action={<Button to="/diagnose">Start a diagnosis</Button>}
        />
      )}
      {diagnoses?.length > 0 && (
        <ul className={styles.list}>
          {diagnoses.map((diagnosis) => {
            const Icon = MEDIA_ICONS[diagnosis.mediaType]
            const urgency = URGENCY[diagnosis.urgency]
            const { car } = diagnosis
            return (
              <li key={diagnosis.id}>
                <Link to={`/ai-agent/${diagnosis.id}`} className={styles.item}>
                  <span className={styles.icon} title={mediaTypeInfo(diagnosis.mediaType).label}>
                    <Icon size={22} />
                    <span className={styles.srOnly}>{mediaTypeInfo(diagnosis.mediaType).label}</span>
                  </span>
                  <span className={styles.text}>
                    <span className={styles.cause}>{diagnosis.possibleCauses[0]?.cause}</span>
                    <span className={styles.muted}>
                      {car.make} {car.model} {car.year} · {formatDateTime(diagnosis.createdAt)}
                    </span>
                  </span>
                  <Badge tone={urgency.tone}>{urgency.label}</Badge>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
