import { useState } from 'react'
// Same field styles as the shared Input, since this renders its own <input>
import inputStyles from '../components/Input.module.css'
import styles from './PasswordInput.module.css'

// Password input with a Show/Hide toggle. Takes the same props as <input>.
// Use it through TextField: <TextField as={PasswordInput} ... />
export default function PasswordInput({ className = '', ...inputProps }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className={styles.wrapper}>
      <input
        {...inputProps}
        type={visible ? 'text' : 'password'}
        className={`${inputStyles.control} ${styles.input} ${className}`.trim()}
      />
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setVisible((v) => !v)}
        aria-controls={inputProps.id}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  )
}
