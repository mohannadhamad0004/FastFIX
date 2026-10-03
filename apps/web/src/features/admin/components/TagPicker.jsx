import { useState } from 'react'
import { Link } from 'react-router'
import Notice from '../../../components/Notice.jsx'
import { useTags } from '../../../context/TagsContext.js'
import { tagColor } from '../../../utils/tagColors.js'
import { useAdminService } from '../AdminContext.js'
import styles from './TagPicker.module.css'

// Checkboxes for the tags of one type, saved as soon as one is toggled.
// targetType: 'part' | 'mechanic' | 'tow'; tagIds: the item's current tags.
export default function TagPicker({ targetType, targetId, tagIds }) {
  const service = useAdminService()
  const tags = useTags().filter((tag) => tag.type === targetType)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function toggle(tagId) {
    const next = tagIds.includes(tagId) ? tagIds.filter((id) => id !== tagId) : [...tagIds, tagId]
    setSaving(true)
    setError(null)
    try {
      await service.setTags(targetType, targetId, next)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <fieldset className={styles.picker} disabled={saving}>
      <legend className={styles.legend}>Tags</legend>
      {tags.length === 0 ? (
        <p className={styles.muted}>
          No tags of this type yet. <Link to={`/admin/tags?type=${targetType}`}>Create one</Link>.
        </p>
      ) : (
        <ul className={styles.options}>
          {tags.map((tag) => {
            const checked = tagIds.includes(tag.id)
            return (
              <li key={tag.id}>
                <label className={checked ? `${styles.option} ${styles.checked}` : styles.option}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(tag.id)} />
                  <span className={styles.swatch} style={{ backgroundColor: tagColor(tag.color) }} aria-hidden="true" />
                  {tag.name}
                </label>
              </li>
            )
          })}
        </ul>
      )}
      <p className={styles.muted}>Changes are saved right away and show on public pages.</p>
      {error && <Notice tone="danger">{error}</Notice>}
    </fieldset>
  )
}
