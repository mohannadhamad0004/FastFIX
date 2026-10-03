import { useState } from 'react'
import Button from '../../../components/Button.jsx'
import FileUpload from '../../../components/FileUpload.jsx'
import { TextField } from '../../../components/FormField.jsx'
import Notice from '../../../components/Notice.jsx'
import Tabs, { TabPanel } from '../../../components/Tabs.jsx'
import { carLabel } from '../../cars/format.js'
import { formatDuration, readMediaDuration } from '../../diagnosis/mediaRules.js'
import { useScans } from '../ScansContext.js'
import {
  CAPTURE_TIPS,
  MAX_PHOTOS,
  MAX_VIDEO_SECONDS,
  MIN_PHOTOS,
  PRIVACY_NOTICE,
  RECOMMENDED_PHOTOS,
  RECOMMENDED_VIDEO_MINUTES,
} from '../scanConstants.js'
import { ScanError } from '../scanService.js'
import styles from './ScanUploadForm.module.css'

const TABS_ID = 'scan-upload'
const TABS = [
  { value: 'photos', label: 'Photos' },
  { value: 'video', label: '360° video' },
]

// A new 3D scan of one of the customer's cars: which car, the capture guide, then photos (several)
// or one video, with previews and limits, and the privacy notice. onDone(scan) after uploading.
export default function ScanUploadForm({ cars, initialCarId, onDone, onCancel }) {
  const { service } = useScans()
  const [chosenCarId, setCarId] = useState(initialCarId ?? '')
  // The cars can arrive after the form opens: until one is chosen, it is the first car.
  const carId = cars.some((car) => car.id === chosenCarId) ? chosenCarId : (cars[0]?.id ?? '')
  const [kind, setKind] = useState('photos')
  const [photos, setPhotos] = useState([])
  const [video, setVideo] = useState(null)
  const [videoSeconds, setVideoSeconds] = useState(null)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function chooseVideo(file) {
    setVideo(file)
    setVideoSeconds(null)
    setErrors({})
    if (!file) return
    const seconds = await readMediaDuration(file)
    setVideoSeconds(seconds)
    if (seconds !== null && seconds > MAX_VIDEO_SECONDS + 0.5) {
      setErrors({ scanVideo: `This video is ${formatDuration(seconds)} long. Videos can be up to 2 minutes.` })
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError(null)
    setSaving(true)
    try {
      const scan = await service.uploadScan({
        carId,
        kind,
        files: kind === 'photos' ? photos : video ? [video] : [],
        durationSec: kind === 'video' ? videoSeconds : null,
      })
      onDone(scan)
    } catch (error) {
      if (error instanceof ScanError && error.field) {
        setErrors({ [error.field]: error.message })
        document.getElementById(error.field)?.focus()
      } else setFormError(error.message)
      setSaving(false)
    }
  }

  const [recommendedMin, recommendedMax] = RECOMMENDED_PHOTOS
  const fewPhotos = photos.length > 0 && photos.length < recommendedMin

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <TextField
        id="scanCar"
        as="select"
        label="Which car are you scanning?"
        hint="The 3D model is saved under this car in My Cars."
        value={carId}
        onChange={(event) => {
          setCarId(event.target.value)
          setErrors({})
        }}
        error={errors.scanCar}
      >
        {cars.map((car) => (
          <option key={car.id} value={car.id}>
            {carLabel(car)}
          </option>
        ))}
      </TextField>

      <section className={styles.guide} aria-labelledby="capture-guide-title">
        <h4 id="capture-guide-title" className={styles.guideTitle}>
          How to capture your car
        </h4>
        <ul className={styles.tips}>
          {CAPTURE_TIPS.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
        <p className={styles.recommend}>
          Recommended: <strong>{recommendedMin}–{recommendedMax} photos</strong>, or a{' '}
          <strong>
            {RECOMMENDED_VIDEO_MINUTES[0]}–{RECOMMENDED_VIDEO_MINUTES[1]} minute video
          </strong>{' '}
          walking slowly around the car.
        </p>
      </section>

      <Tabs tabs={TABS} value={kind} idPrefix={TABS_ID} label="What to upload" variant="pills" onChange={(value) => { setKind(value); setErrors({}) }} />
      <TabPanel idPrefix={TABS_ID} value={kind} className={styles.panel}>
        {kind === 'photos' ? (
          <>
            <FileUpload
              id="scanPhotos"
              label="Photos of your car"
              hint={`At least ${MIN_PHOTOS}, up to ${MAX_PHOTOS}. JPG, PNG or WebP, up to 10 MB each.`}
              kind="photo"
              multiple
              value={photos}
              onChange={(files) => {
                setPhotos(files)
                setErrors({})
              }}
              error={errors.scanPhotos}
            />
            <p className={fewPhotos ? styles.warning : styles.muted} aria-live="polite">
              {photos.length} {photos.length === 1 ? 'photo' : 'photos'} chosen
              {fewPhotos && `: ${recommendedMin}–${recommendedMax} gives a much better model`}
            </p>
          </>
        ) : (
          <>
            <FileUpload
              id="scanVideo"
              label="360° video of your car"
              hint="One video, up to 2 minutes. MP4, MOV or WebM."
              kind="scanVideo"
              value={video}
              onChange={chooseVideo}
              error={errors.scanVideo}
            />
            {video && videoSeconds !== null && <p className={styles.muted}>Length: {formatDuration(videoSeconds)}</p>}
          </>
        )}
      </TabPanel>

      <Notice tone="info" title="Privacy">
        {PRIVACY_NOTICE}
      </Notice>

      {formError && <Notice tone="danger">{formError}</Notice>}
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          Upload and build my model
        </Button>
      </div>
    </form>
  )
}
