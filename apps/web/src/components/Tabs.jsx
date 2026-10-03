import { useId, useRef } from 'react'
import styles from './Tabs.module.css'

/**
 * Accessible tab list (WAI-ARIA tabs pattern): arrow keys, Home and End move between tabs.
 * Put the content in <TabPanel idPrefix={...} value={...}> so it is labelled by the selected tab.
 * @param {Object} props
 * @param {{ value: string, label: React.ReactNode, count?: number, icon?: React.ReactNode }[]} props.tabs
 * @param {string} props.value        the selected tab
 * @param {(value: string) => void} props.onChange
 * @param {string} props.label        what the tabs choose, for screen readers
 * @param {string} [props.idPrefix]   defaults to a generated id
 * @param {'underline' | 'pills'} [props.variant]  underline for page sections, pills for switches inside a card
 * @param {boolean} [props.fullWidth] tabs share the whole width
 */
export default function Tabs({ tabs, value, onChange, label, idPrefix, variant = 'underline', fullWidth = false }) {
  const generated = useId()
  const prefix = idPrefix ?? generated
  const listRef = useRef(null)

  function handleKeyDown(event) {
    const index = tabs.findIndex((tab) => tab.value === value)
    const target = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tabs.length - 1,
    }[event.key]
    if (target === undefined) return
    event.preventDefault()
    const next = tabs[(target + tabs.length) % tabs.length]
    onChange(next.value)
    requestAnimationFrame(() => listRef.current?.querySelector(`[data-value="${next.value}"]`)?.focus())
  }

  return (
    <div
      className={[styles.tabs, styles[variant], fullWidth && styles.fullWidth].filter(Boolean).join(' ')}
      role="tablist"
      aria-label={label}
      ref={listRef}
      onKeyDown={handleKeyDown}
    >
      {tabs.map((tab) => {
        const selected = tab.value === value
        return (
          <button
            key={tab.value}
            id={`${prefix}-tab-${tab.value}`}
            type="button"
            role="tab"
            data-value={tab.value}
            aria-selected={selected}
            aria-controls={`${prefix}-panel`}
            tabIndex={selected ? 0 : -1}
            className={selected ? `${styles.tab} ${styles.selected}` : styles.tab}
            onClick={() => onChange(tab.value)}
          >
            {tab.icon && (
              <span className={styles.icon} aria-hidden="true">
                {tab.icon}
              </span>
            )}
            {tab.label}
            {tab.count !== undefined && <span className={styles.count}>{tab.count}</span>}
          </button>
        )
      })}
    </div>
  )
}

// The panel under the tabs, labelled by the selected tab. Use the same idPrefix and value as Tabs.
export function TabPanel({ idPrefix, value, className, children }) {
  return (
    <div id={`${idPrefix}-panel`} role="tabpanel" aria-labelledby={`${idPrefix}-tab-${value}`} className={className}>
      {children}
    </div>
  )
}
