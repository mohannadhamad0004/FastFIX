import { useState } from 'react'
import { useToast } from '../../components/Toast/ToastContext.js'
import { DEFAULT_NOTIFICATION_PREFS, NOTIFICATION_TYPES } from '../constants.js'
import { useAuth, useProfileService } from '../useAuth.js'
import styles from './NotificationSettings.module.css'

// Email on/off for each notification type. Each switch saves right away.
// TODO: emails are not sent yet; the api will read these preferences before sending one.
export default function NotificationSettings() {
  const { user } = useAuth()
  const service = useProfileService()
  const toast = useToast()
  const [saving, setSaving] = useState(null)
  const prefs = { ...DEFAULT_NOTIFICATION_PREFS, ...user.notificationPrefs }

  async function toggle(type, enabled) {
    setSaving(type.value)
    try {
      await service.updateNotificationPrefs({ [type.value]: enabled })
      toast.success(`Emails for ${type.label.toLowerCase()} turned ${enabled ? 'on' : 'off'}.`)
    } catch (error) {
      toast.error(error.message || "Couldn't save this setting. Please try again.")
    } finally {
      setSaving(null)
    }
  }

  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>Email notifications</legend>
      <ul className={styles.list}>
        {NOTIFICATION_TYPES.map((type) => {
          const id = `notify-${type.value}`
          return (
            <li key={type.value} className={styles.row}>
              <span className={styles.text}>
                <label htmlFor={id} className={styles.label}>
                  {type.label}
                </label>
                <span id={`${id}-hint`} className={styles.hint}>
                  {type.hint}
                </span>
              </span>
              <input
                id={id}
                type="checkbox"
                role="switch"
                className={styles.switch}
                checked={prefs[type.value]}
                disabled={saving === type.value}
                aria-describedby={`${id}-hint`}
                onChange={(event) => toggle(type, event.target.checked)}
              />
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}
