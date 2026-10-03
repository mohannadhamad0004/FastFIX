import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import Button from '../../../components/Button.jsx'
import EmptyState from '../../../components/EmptyState.jsx'
import Modal from '../../../components/Modal.jsx'
import Notice from '../../../components/Notice.jsx'
import { SkeletonRows } from '../../../components/Skeleton.jsx'
import { useToast } from '../../../components/Toast/ToastContext.js'
import DiagnosisResult from '../components/DiagnosisResult.jsx'
import MediaPlayer from '../components/MediaPlayer.jsx'
import SendToMechanicDialog from '../components/SendToMechanicDialog.jsx'
import { useDiagnosisQuery, useDiagnosisService } from '../DiagnosisContext.js'
import styles from './DiagnosisReportPage.module.css'

// /ai-agent/:diagnosisId (customers) - one saved AI report with the original photo / video / sound,
// and what to do next: send it to a mechanic (Request service with the report attached), find a
// mechanic with the suggested skill, or delete it.
export default function DiagnosisReportPage() {
  const { diagnosisId } = useParams()
  const service = useDiagnosisService()
  const navigate = useNavigate()
  const toast = useToast()
  const load = useCallback((s) => s.getDiagnosis(diagnosisId), [diagnosisId])
  const { data: diagnosis, loading } = useDiagnosisQuery(load)
  const [sending, setSending] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [busy, setBusy] = useState(false)

  if (loading) return <SkeletonRows rows={4} label="Loading the report…" />
  if (!diagnosis) {
    return (
      <EmptyState
        icon="✨"
        headingLevel="h1"
        title="Report not found"
        description="It may have been deleted."
        action={<Button to="/ai-agent">Back to AI Agent</Button>}
      />
    )
  }

  async function remove() {
    setBusy(true)
    setDeleteError(null)
    try {
      await navigate('/ai-agent')
      await service.deleteDiagnosis(diagnosis.id)
      toast.success('The report was deleted.')
    } catch (error) {
      setDeleteError(error.message)
      setBusy(false)
    }
  }

  return (
    <div className={styles.page}>
      <Button to="/ai-agent" variant="ghost" size="sm" className={styles.back}>
        ← AI Agent
      </Button>

      <DiagnosisResult
        run={{ status: 'done', result: diagnosis, error: null }}
        headingLevel="h1"
        media={<MediaPlayer file={diagnosis.file} mediaType={diagnosis.mediaType} />}
        actions={
          <>
            <Button size="lg" onClick={() => setSending(true)}>
              Send to a mechanic
            </Button>
            <Button
              size="lg"
              variant="secondary"
              to={`/mechanics?skill=${encodeURIComponent(diagnosis.suggestedSkill)}`}
            >
              Find a mechanic for this
            </Button>
            <Button size="lg" variant="ghost" className={styles.delete} onClick={() => setDeleting(true)}>
              Delete
            </Button>
          </>
        }
      />

      <SendToMechanicDialog diagnosis={diagnosis} open={sending} onClose={() => setSending(false)} />

      <Modal open={deleting} title="Delete this AI report?" onClose={() => setDeleting(false)}>
        <div className={styles.dialog}>
          <p>
            The report and its {diagnosis.mediaType === 'audio' ? 'recording' : diagnosis.mediaType} are deleted.
            Mechanics you already sent it to keep their copy.
          </p>
          {deleteError && <Notice tone="danger">{deleteError}</Notice>}
          <div className={styles.dialogActions}>
            <Button variant="secondary" onClick={() => setDeleting(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="danger" onClick={remove} loading={busy}>
              Delete report
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
