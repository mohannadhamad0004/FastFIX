import { useEffect, useId, useRef, useState } from 'react'
import { THEME_OPTIONS } from '../../context/theme.js'
import { useTheme } from '../../context/ThemeContext.js'
import styles from './ThemeToggle.module.css'

/**
 * Light / Dark / System switch.
 * - variant "menu" (navbar, tablet and up): a sun/moon/monitor button that opens a small menu
 * - variant "segmented" (mobile menu): three buttons side by side
 * @param {{ variant?: 'menu' | 'segmented', className?: string }} props
 */
export default function ThemeToggle({ variant = 'menu', className = '' }) {
  return variant === 'segmented' ? <ThemeSegmented className={className} /> : <ThemeMenu className={className} />
}

const ICONS = { light: SunIcon, dark: MoonIcon, system: MonitorIcon }
const labelOf = (value) => THEME_OPTIONS.find((option) => option.value === value).label

// Arrow keys move between the options; Home and End jump to the first and last.
function nextIndex(key, index, count) {
  const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[key]
  if (step) return (index + step + count) % count
  if (key === 'Home') return 0
  if (key === 'End') return count - 1
  return null
}

function ThemeMenu({ className }) {
  const { preference, theme, setPreference } = useTheme()
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const containerRef = useRef(null)
  const buttonRef = useRef(null)
  const itemRefs = useRef([])
  const Icon = ICONS[preference]

  // Opening moves focus to the current choice; Escape, Tab or a click outside closes the menu.
  useEffect(() => {
    if (!open) return undefined
    itemRefs.current[THEME_OPTIONS.findIndex((o) => o.value === preference)]?.focus()
    function onPointer(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
    // Only when opening, not every time the choice changes while open
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function choose(value) {
    setPreference(value)
    setOpen(false)
    buttonRef.current?.focus()
  }

  function onMenuKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      buttonRef.current?.focus()
      return
    }
    if (event.key === 'Tab') {
      setOpen(false)
      return
    }
    const current = itemRefs.current.indexOf(document.activeElement)
    const target = nextIndex(event.key, current, THEME_OPTIONS.length)
    if (target === null) return
    event.preventDefault()
    itemRefs.current[target]?.focus()
  }

  const summary = preference === 'system' ? `System (${theme})` : labelOf(preference)

  return (
    <div className={`${styles.menuWrapper} ${className}`.trim()} ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Theme: ${summary}`}
        title={`Theme: ${summary}`}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !open) {
            event.preventDefault()
            setOpen(true)
          }
        }}
      >
        <Icon />
      </button>

      {open && (
        <div id={menuId} role="menu" aria-label="Theme" className={styles.menu} onKeyDown={onMenuKeyDown}>
          {THEME_OPTIONS.map((option, index) => {
            const OptionIcon = ICONS[option.value]
            const checked = option.value === preference
            return (
              <button
                key={option.value}
                ref={(element) => {
                  itemRefs.current[index] = element
                }}
                type="button"
                role="menuitemradio"
                aria-checked={checked}
                tabIndex={checked ? 0 : -1}
                className={styles.item}
                onClick={() => choose(option.value)}
              >
                <OptionIcon />
                <span className={styles.itemLabel}>{option.label}</span>
                {checked && (
                  <span className={styles.check} aria-hidden="true">
                    ✓
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ThemeSegmented({ className }) {
  const { preference, setPreference } = useTheme()
  const buttonRefs = useRef([])
  // Unique, since the mobile menu and /account can both show this switch.
  const labelId = useId()

  function onKeyDown(event) {
    const current = THEME_OPTIONS.findIndex((o) => o.value === preference)
    const target = nextIndex(event.key, current, THEME_OPTIONS.length)
    if (target === null) return
    event.preventDefault()
    setPreference(THEME_OPTIONS[target].value)
    buttonRefs.current[target]?.focus()
  }

  return (
    <div className={`${styles.segmented} ${className}`.trim()}>
      <span className={styles.segmentedLabel} id={labelId}>
        Theme
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className={styles.options} onKeyDown={onKeyDown}>
        {THEME_OPTIONS.map((option, index) => {
          const OptionIcon = ICONS[option.value]
          const checked = option.value === preference
          return (
            <button
              key={option.value}
              ref={(element) => {
                buttonRefs.current[index] = element
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              className={styles.option}
              onClick={() => setPreference(option.value)}
            >
              <OptionIcon />
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---- Icons (decorative: the buttons have text labels) ----

function Svg({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

function SunIcon() {
  return (
    <Svg>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </Svg>
  )
}

function MoonIcon() {
  return (
    <Svg>
      <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
    </Svg>
  )
}

function MonitorIcon() {
  return (
    <Svg>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </Svg>
  )
}
