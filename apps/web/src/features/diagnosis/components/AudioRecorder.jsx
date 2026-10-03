import { useEffect, useRef, useState } from 'react'
import Button from '../../../components/Button.jsx'
import { FieldError } from '../../../components/FormField.jsx'
import Notice from '../../../components/Notice.jsx'
import { useObjectUrl } from '../../../hooks/useObjectUrl.js'
import { formatFileSize } from '../../../utils/files.js'
import { MAX_MEDIA_SECONDS } from '../constants.js'
import { formatDuration } from '../mediaRules.js'
import { MicIcon } from './icons.jsx'
import MediaDropzone from './MediaDropzone.jsx'
import styles from './AudioRecorder.module.css'

// Formats MediaRecorder may produce, best first (Chrome/Firefox: WebM Opus, Safari: MP4 AAC).
const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
const EXTENSIONS = { 'audio/webm': 'webm', 'audio/mp4': 'm4a', 'audio/ogg': 'ogg' }
const LEVEL_BARS = 32
const LEVEL_INTERVAL_MS = 80

const canRecord = () =>
  typeof window !== 'undefined' &&
  Boolean(navigator.mediaDevices?.getUserMedia) &&
  typeof window.MediaRecorder !== 'undefined'

// getUserMedia errors -> what to tell the customer.
function describeMicError(error) {
  switch (error?.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return {
        title: 'Microphone access is blocked',
        text: 'To record, allow the microphone for this site: click the icon next to the address bar, allow the microphone, then press Record again. Or upload a recording instead.',
      }
    case 'NotFoundError':
    case 'DevicesNotFoundError':
    case 'OverconstrainedError':
      return { title: 'No microphone found', text: 'Connect a microphone and try again, or upload a recording instead.' }
    case 'NotReadableError':
    case 'TrackStartError':
      return {
        title: 'The microphone is busy',
        text: 'Another app may be using it. Close that app and try again, or upload a recording instead.',
      }
    default:
      return { title: "Couldn't start recording", text: 'Please try again, or upload a recording instead.' }
  }
}

/**
 * Engine sound: record it in the browser (MediaRecorder, up to 60 seconds, with a timer and a
 * level meter) or upload an audio file. The result is one File passed to onChange.
 * @param {Object} props
 * @param {string} props.id
 * @param {File | null} props.file
 * @param {'upload' | 'recording' | null} props.source
 * @param {(file: File | null, source?: 'upload' | 'recording') => void} props.onChange
 * @param {string} [props.error]
 */
export default function AudioRecorder({ id, file, source, onChange, error }) {
  const [phase, setPhase] = useState('idle') // idle | requesting | recording
  const [elapsed, setElapsed] = useState(0)
  const [levels, setLevels] = useState(() => Array(LEVEL_BARS).fill(0))
  const [micError, setMicError] = useState(null)
  const [recordedSeconds, setRecordedSeconds] = useState(null)
  const session = useRef(null) // { recorder, stream, audioContext, frame, discard }
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  // Release the microphone if the page is left mid-recording (the recording is thrown away).
  useEffect(
    () => () => {
      if (session.current) {
        session.current.discard = true
        stopSession(session.current)
      }
    },
    [],
  )

  async function start() {
    setMicError(null)
    setPhase('requesting')
    let stream
    try {
      // Raw sound: the voice filters would remove exactly the engine noise we want.
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      })
    } catch (err) {
      setMicError(describeMicError(err))
      setPhase('idle')
      return
    }

    const mimeType = MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) ?? ''
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    const chunks = []
    const current = { recorder, stream, audioContext: null, frame: 0, discard: false, startedAt: 0 }
    session.current = current

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    }
    recorder.onstop = () => {
      const seconds = Math.min((performance.now() - current.startedAt) / 1000, MAX_MEDIA_SECONDS)
      stopSession(current)
      if (session.current === current) session.current = null
      if (current.discard) return
      const type = (recorder.mimeType || mimeType || 'audio/webm').split(';')[0]
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
      const recording = new File(chunks, `engine-sound-${stamp}.${EXTENSIONS[type] ?? 'webm'}`, { type })
      setRecordedSeconds(seconds)
      setPhase('idle')
      onChangeRef.current(recording, 'recording')
    }

    // Level meter: loudness of the microphone signal, sampled a few times a second.
    try {
      const audioContext = new AudioContext()
      // Created after `await getUserMedia`, so some browsers start it suspended: wake it up.
      audioContext.resume().catch(() => {})
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 1024
      audioContext.createMediaStreamSource(stream).connect(analyser)
      current.audioContext = audioContext
      const samples = new Uint8Array(analyser.fftSize)
      let lastSample = 0
      const tick = (now) => {
        const seconds = (now - current.startedAt) / 1000
        if (seconds >= MAX_MEDIA_SECONDS) {
          if (recorder.state !== 'inactive') recorder.stop()
          return
        }
        if (now - lastSample >= LEVEL_INTERVAL_MS) {
          lastSample = now
          analyser.getByteTimeDomainData(samples)
          let sum = 0
          for (const value of samples) sum += ((value - 128) / 128) ** 2
          const level = Math.min(1, Math.sqrt(sum / samples.length) * 4) // RMS, scaled up for quiet mics
          setLevels((previous) => [...previous.slice(1), level])
          setElapsed(seconds)
        }
        current.frame = requestAnimationFrame(tick)
      }
      current.frame = requestAnimationFrame(tick)
    } catch {
      // No Web Audio: record without the meter.
    }

    // The hard 60-second limit. Not in the animation loop above: browsers pause
    // requestAnimationFrame in background tabs, but timers keep running.
    current.timeout = setTimeout(() => recorder.state !== 'inactive' && recorder.stop(), MAX_MEDIA_SECONDS * 1000)
    current.startedAt = performance.now()
    recorder.start(250)
    setElapsed(0)
    setLevels(Array(LEVEL_BARS).fill(0))
    setPhase('recording')
  }

  function stop() {
    const recorder = session.current?.recorder
    if (recorder && recorder.state !== 'inactive') recorder.stop()
  }

  function rerecord() {
    onChange(null)
    setRecordedSeconds(null)
    start()
  }

  // ---- A sound is chosen: play it back, re-record or remove ----
  if (file && phase === 'idle') {
    return (
      <div className={styles.recorder}>
        <Playback
          file={file}
          title={source === 'recording' ? 'Your recording' : 'Your sound file'}
          detail={
            source === 'recording' && recordedSeconds !== null
              ? formatDuration(recordedSeconds)
              : `${file.name} · ${formatFileSize(file.size)}`
          }
          actions={
            <>
              {canRecord() && (
                <Button variant="secondary" size="sm" onClick={rerecord}>
                  <MicIcon size={16} /> Re-record
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRecordedSeconds(null)
                  onChange(null)
                }}
              >
                Remove
              </Button>
            </>
          }
        />
        <FieldError id={`${id}-error`}>{error}</FieldError>
      </div>
    )
  }

  // ---- Recording ----
  if (phase === 'recording') {
    const remaining = MAX_MEDIA_SECONDS - elapsed
    return (
      <div className={`${styles.recorder} ${styles.live}`}>
        <div className={styles.meter} aria-hidden="true">
          {levels.map((level, i) => (
            <span key={i} className={styles.bar} style={{ '--level': Math.max(0.06, level) }} />
          ))}
        </div>
        <p className={styles.timer} aria-live="off">
          <span className={styles.dot} aria-hidden="true" />
          <time>{formatDuration(elapsed)}</time>
          <span className={styles.limit}> / {formatDuration(MAX_MEDIA_SECONDS)}</span>
        </p>
        <div
          className={styles.progress}
          role="progressbar"
          aria-label="Recording time"
          aria-valuemin={0}
          aria-valuemax={MAX_MEDIA_SECONDS}
          aria-valuenow={Math.round(elapsed)}
          aria-valuetext={`${Math.round(elapsed)} of ${MAX_MEDIA_SECONDS} seconds`}
        >
          <span style={{ width: `${(elapsed / MAX_MEDIA_SECONDS) * 100}%` }} />
        </div>
        <p className={styles.status} role="status">
          Recording… {remaining <= 10 && `Stops by itself in ${Math.ceil(remaining)} seconds.`}
        </p>
        <Button variant="danger" size="lg" onClick={stop} className={styles.stopButton}>
          <span className={styles.stopSquare} aria-hidden="true" /> Stop
        </Button>
      </div>
    )
  }

  // ---- Nothing yet: record or upload ----
  return (
    <div className={styles.recorder}>
      {canRecord() ? (
        <div className={styles.start}>
          <button
            id={id}
            type="button"
            className={styles.recordButton}
            onClick={start}
            disabled={phase === 'requesting'}
            aria-describedby={[`${id}-help`, error && `${id}-error`].filter(Boolean).join(' ')}
          >
            <MicIcon size={30} />
            <span>{phase === 'requesting' ? 'Allow the microphone…' : 'Record'}</span>
          </button>
          <p id={`${id}-help`} className={styles.help}>
            Start the engine, hold your phone near the noise and press Record. Up to {MAX_MEDIA_SECONDS} seconds.
          </p>
        </div>
      ) : (
        <Notice tone="info" title="Recording isn't available in this browser">
          {window.isSecureContext
            ? 'Upload a recording of the noise instead.'
            : 'Recording needs a secure (https) connection. Upload a recording of the noise instead.'}
        </Notice>
      )}

      {micError && (
        <Notice tone="danger" title={micError.title}>
          {micError.text}
        </Notice>
      )}
      <FieldError id={`${id}-error`}>{error}</FieldError>

      <div className={styles.divider}>
        <span>or</span>
      </div>
      <MediaDropzone id={`${id}-upload`} mediaType="audio" file={null} compact onChange={(f) => f && onChange(f, 'upload')} />
    </div>
  )
}

// Player for the chosen sound, with an explicit Play back / Pause button next to the controls.
function Playback({ file, title, detail, actions }) {
  const url = useObjectUrl(file)
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)

  function toggle() {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play()
    else audio.pause()
  }

  return (
    <div className={styles.playback}>
      <div className={styles.playbackHeader}>
        <Button size="sm" onClick={toggle}>
          {playing ? '❚❚ Pause' : '▶ Play back'}
        </Button>
        <p className={styles.playbackTitle}>
          <strong>{title}</strong>
          <span className={styles.playbackDetail}>{detail}</span>
        </p>
      </div>
      {url && (
        // The customer's own recording: there are no captions for it.
        // oxlint-disable-next-line jsx-a11y/media-has-caption
        <audio
          ref={audioRef}
          src={url}
          controls
          preload="metadata"
          className={styles.audio}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
      )}
      <div className={styles.playbackActions}>{actions}</div>
    </div>
  )
}

function stopSession(current) {
  cancelAnimationFrame(current.frame)
  clearTimeout(current.timeout)
  if (current.recorder.state !== 'inactive') current.recorder.stop()
  for (const track of current.stream.getTracks()) track.stop()
  current.audioContext?.close().catch(() => {})
}
