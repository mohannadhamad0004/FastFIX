import { useId } from 'react'
import Button from '../../../components/Button.jsx'
import { defaultTransform, TRANSFORM_LIMITS } from '../accessoryData.js'
import styles from './AccessoryControls.module.css'

const AXES = ['x', 'y', 'z']
const AXIS_LABELS = { x: 'Left / right', y: 'Up / down', z: 'Back / front' }
const ROTATION_LABELS = { x: 'Tilt', y: 'Turn', z: 'Roll' }

// On a scanned car: move, rotate and resize one accessory by hand. Sliders (keyboard: arrow keys)
// for each axis, the size, and "Back to default". `transform` is { position, rotation, scale }.
export default function AccessoryControls({ part, transform, onChange }) {
  const id = useId()
  const setAxis = (key, index, value) => {
    const next = [...transform[key]]
    next[index] = value
    onChange({ [key]: next })
  }

  return (
    <fieldset className={styles.controls}>
      <legend className={styles.legend}>Place “{part.name}”</legend>

      <div className={styles.group}>
        <p className={styles.groupTitle}>Move (m)</p>
        {AXES.map((axis, index) => (
          <Slider
            key={axis}
            id={`${id}-move-${axis}`}
            label={AXIS_LABELS[axis]}
            value={transform.position[index]}
            {...TRANSFORM_LIMITS.position}
            format={(v) => v.toFixed(2)}
            onChange={(v) => setAxis('position', index, v)}
          />
        ))}
      </div>

      <div className={styles.group}>
        <p className={styles.groupTitle}>Rotate (°)</p>
        {AXES.map((axis, index) => (
          <Slider
            key={axis}
            id={`${id}-rotate-${axis}`}
            label={ROTATION_LABELS[axis]}
            value={transform.rotation[index]}
            {...TRANSFORM_LIMITS.rotation}
            format={(v) => `${v}°`}
            onChange={(v) => setAxis('rotation', index, v)}
          />
        ))}
      </div>

      <div className={styles.group}>
        <p className={styles.groupTitle}>Size</p>
        <Slider
          id={`${id}-scale`}
          label="Resize"
          value={transform.scale}
          {...TRANSFORM_LIMITS.scale}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => onChange({ scale: v })}
        />
      </div>

      <Button variant="ghost" size="sm" onClick={() => onChange(defaultTransform(part))}>
        Back to default position
      </Button>
    </fieldset>
  )
}

function Slider({ id, label, value, min, max, step, format, onChange }) {
  return (
    <div className={styles.slider}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        id={id}
        type="range"
        className={styles.range}
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={format(value)}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <output htmlFor={id} className={styles.value}>
        {format(value)}
      </output>
    </div>
  )
}
