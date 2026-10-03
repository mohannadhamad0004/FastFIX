import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../../../auth/useAuth.js'
import Button from '../../../components/Button.jsx'
import Card from '../../../components/Card.jsx'
import { TextField } from '../../../components/FormField.jsx'
import Notice from '../../../components/Notice.jsx'
import Tabs, { TabPanel } from '../../../components/Tabs.jsx'
import { useToast } from '../../../components/Toast/ToastContext.js'
import { useMyCars } from '../../cars/useMyCars.js'
import { resolveCar } from '../carChoice.js'
import { MEDIA_TYPES, mediaTypeInfo } from '../constants.js'
import { useDiagnosisDraft, useDiagnosisRun } from '../DiagnosisContext.js'
import AudioRecorder from './AudioRecorder.jsx'
import CarSelector from './CarSelector.jsx'
import { CameraIcon, SoundIcon, VideoIcon } from './icons.jsx'
import MediaDropzone from './MediaDropzone.jsx'
import styles from './DiagnosisCard.module.css'

const TAB_ICONS = { photo: <CameraIcon size={18} />, video: <VideoIcon size={18} />, audio: <SoundIcon size={18} /> }
const TABS = MEDIA_TYPES.map((type) => ({ value: type.value, label: type.label, icon: TAB_ICONS[type.value] }))
const TABS_ID = 'diagnosis-media'
const DESCRIPTION_MAX = 1000
const STEPS = ['Evidence', 'Vehicle', 'Review']

// The /diagnose form in three stages: Evidence (photo / video / engine sound), Vehicle, Review (with
// an optional description).
// Everything typed or chosen is kept in DiagnosisProvider, so a logged-out customer who presses
// "Diagnose my car" can log in (/login?redirect=/diagnose) and come back to the same form.
export default function DiagnosisCard() {
  const { user } = useAuth()
  const { cars } = useMyCars()
  const { draft, updateDraft, setFile } = useDiagnosisDraft()
  const { run, diagnose } = useDiagnosisRun()
  const navigate = useNavigate()
  const toast = useToast()
  const [errors, setErrors] = useState({})
  const [step, setStep] = useState(draft.awaitingLogin ? 2 : 0) // back from /login: straight to the review
  const headingRef = useRef(null)
  const firstRender = useRef(true)

  // Move focus to the new stage's heading, so screen reader users know where they are.
  useEffect(() => {
    if (firstRender.current) firstRender.current = false
    else headingRef.current?.focus({ preventScroll: false })
  }, [step])

  const mediaType = draft.mediaType
  const info = mediaTypeInfo(mediaType)
  const file = draft.files[mediaType]
  const mediaId = `${TABS_ID}-${mediaType}-input`
  const loading = run.status === 'loading'
  const backFromLogin = Boolean(user) && draft.awaitingLogin

  function chooseFile(type, chosen, source) {
    setFile(type, chosen, source)
    if (chosen) setErrors((current) => ({ ...current, media: undefined }))
  }

  function updateCar(changes) {
    updateDraft({ car: { ...draft.car, ...changes } })
    setErrors((current) => ({ ...current, ...Object.fromEntries(Object.keys(changes).map((key) => [key, undefined])) }))
  }

  const resolved = resolveCar(draft.car, cars)

  // Returns the stage of the first problem (0 evidence, 1 vehicle), or -1 when all is fine.
  function validate(upTo) {
    const found = {}
    if (!file) found.media = info.emptyError
    if (upTo >= 1) Object.assign(found, resolved.errors)
    setErrors(found)
    if (found.media) return 0
    return ['make', 'model', 'year'].some((key) => found[key]) ? 1 : -1
  }

  function goNext() {
    const bad = validate(step)
    if (bad !== -1) {
      requestAnimationFrame(() => document.getElementById(bad === 0 ? mediaId : `car-${['make', 'model', 'year'].find((key) => resolved.errors[key])}`)?.focus())
      return
    }
    setStep(step + 1)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (step < 2) return goNext()
    const bad = validate(2)
    if (bad !== -1) {
      setStep(bad)
      return
    }
    const { car, carId } = resolved
    // Logged out: log in first. The draft (file included) stays in DiagnosisProvider.
    if (!user) {
      updateDraft({ awaitingLogin: true })
      navigate('/login?redirect=/diagnose')
      return
    }

    updateDraft({ awaitingLogin: false })
    try {
      const result = await diagnose({ mediaType, file, car, carId, description: draft.description })
      if (result.userId) toast.success('Saved to your diagnosis history.')
    } catch {
      // The error is shown in the result area, with a "Try again" button.
    }
  }

  const vehicle = resolved.errors && Object.keys(resolved.errors).length === 0 && resolved.car
  const vehicleLabel = vehicle ? [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' ') : ''

  return (
    <Card as="form" padding="lg" elevated className={styles.card} onSubmit={handleSubmit} noValidate aria-label="Get an AI diagnosis">
      <ol className={styles.stepper} aria-label="Diagnosis progress">
        {STEPS.map((name, index) => (
          <li key={name} className={styles.stepperItem} aria-current={index === step ? 'step' : undefined}>
            <button
              type="button"
              className={`${styles.stepperButton} ${index === step ? styles.current : ''} ${index < step ? styles.done : ''}`}
              disabled={index >= step}
              onClick={() => setStep(index)}
            >
              <span className={styles.stepNumber} aria-hidden="true">
                {index < step ? '✓' : index + 1}
              </span>
              <span>{name}</span>
              {index < step && <span className={styles.srOnly}>(completed, go back)</span>}
            </button>
          </li>
        ))}
      </ol>

      {backFromLogin && (
        <Notice tone="success" title={`Welcome, ${user.name.split(' ')[0]}!`}>
          Your {mediaType === 'audio' ? 'engine sound' : mediaType} and details are still here. Press “Diagnose my car” to continue.
        </Notice>
      )}

      {step === 0 && (
        <section className={styles.stage} aria-labelledby="diagnosis-stage-title">
          <h2 id="diagnosis-stage-title" className={styles.stageTitle} ref={headingRef} tabIndex={-1}>
            Show us the problem
          </h2>
          <Tabs
            tabs={TABS}
            value={mediaType}
            onChange={(value) => {
              updateDraft({ mediaType: value })
              setErrors((current) => ({ ...current, media: undefined }))
            }}
            label="What do you want to upload?"
            idPrefix={TABS_ID}
            variant="pills"
            fullWidth
          />
          <TabPanel idPrefix={TABS_ID} value={mediaType} className={styles.panel}>
            <p className={styles.hint}>{info.hint}</p>
            {mediaType === 'audio' ? (
              <AudioRecorder
                id={mediaId}
                file={file}
                source={draft.audioSource}
                onChange={(chosen, source) => chooseFile('audio', chosen, source)}
                error={errors.media}
              />
            ) : (
              <MediaDropzone
                key={mediaType}
                id={mediaId}
                mediaType={mediaType}
                file={file}
                onChange={(chosen) => chooseFile(mediaType, chosen)}
                error={errors.media}
              />
            )}
          </TabPanel>
        </section>
      )}

      {step === 1 && (
        <section className={styles.stage} aria-labelledby="diagnosis-stage-title">
          <h2 id="diagnosis-stage-title" className={styles.stageTitle} ref={headingRef} tabIndex={-1}>
            Which car is it?
          </h2>
          <CarSelector value={draft.car} onChange={updateCar} cars={cars} errors={errors} />
          {vehicleLabel && (
            <p className={styles.selected}>
              <span aria-hidden="true">✓</span> Selected vehicle: <strong>{vehicleLabel}</strong>
            </p>
          )}
        </section>
      )}

      {step === 2 && (
        <section className={styles.stage} aria-labelledby="diagnosis-stage-title">
          <h2 id="diagnosis-stage-title" className={styles.stageTitle} ref={headingRef} tabIndex={-1}>
            Review and describe
          </h2>
          <dl className={styles.summary}>
            <div className={styles.summaryRow}>
              <dt>{info.label}</dt>
              <dd>{file?.name}</dd>
              <button type="button" className={styles.edit} onClick={() => setStep(0)}>
                Change<span className={styles.srOnly}> evidence</span>
              </button>
            </div>
            <div className={styles.summaryRow}>
              <dt>Vehicle</dt>
              <dd>{vehicleLabel}</dd>
              <button type="button" className={styles.edit} onClick={() => setStep(1)}>
                Change<span className={styles.srOnly}> vehicle</span>
              </button>
            </div>
          </dl>
          <TextField
            as="textarea"
            id="diagnosis-description"
            label="Describe the problem"
            optional
            hint="When it happens, noises, warning lights."
            placeholder="e.g. A squeal for a few seconds after a cold start, worse when the AC is on."
            maxLength={DESCRIPTION_MAX}
            rows={4}
            value={draft.description}
            onChange={(event) => updateDraft({ description: event.target.value })}
          />
        </section>
      )}

      <div className={styles.submitRow}>
        {step > 0 && (
          <Button variant="ghost" size="lg" onClick={() => setStep(step - 1)} disabled={loading}>
            Back
          </Button>
        )}
        {step < 2 ? (
          <Button type="submit" size="lg" className={styles.submit}>
            Continue
          </Button>
        ) : (
          <Button id="diagnose-submit" type="submit" size="lg" loading={loading} className={styles.submit}>
            {loading ? 'Analyzing…' : 'Diagnose my car'}
          </Button>
        )}
        {step === 2 && (
          <p className={styles.submitNote}>
            {user
              ? 'Free preliminary AI assessment. Your report is saved to your history.'
              : "You'll log in first - your upload and details are kept."}
          </p>
        )}
      </div>
    </Card>
  )
}