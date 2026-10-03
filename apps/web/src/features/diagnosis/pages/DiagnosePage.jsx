import { useEffect, useRef } from 'react'
import DiagnosisCard from '../components/DiagnosisCard.jsx'
import DiagnosisResult from '../components/DiagnosisResult.jsx'
import { useDiagnosisRun } from '../DiagnosisContext.js'
import styles from './DiagnosePage.module.css'

// /diagnose - the staged AI diagnosis (Evidence, Vehicle, Review) and the report under it. The
// draft lives in DiagnosisProvider, so a half-finished upload survives leaving and coming back.
export default function DiagnosePage() {
  const { run } = useDiagnosisRun()
  const resultHeadingRef = useRef(null)
  const resultAreaRef = useRef(null)
  const previousStatus = useRef(run.status)

  // Show the result as it arrives: scroll to the loading card, then to the report and move focus to
  // its heading so screen reader users hear it. Only on a change, not when coming back to the page.
  useEffect(() => {
    const before = previousStatus.current
    previousStatus.current = run.status
    if (run.status === before || !['loading', 'done'].includes(run.status)) return
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    resultAreaRef.current?.scrollIntoView({ behavior, block: 'start' })
    if (run.status === 'done') resultHeadingRef.current?.focus({ preventScroll: true })
  }, [run.status])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>AI diagnosis</h1>
        <p className={styles.subtitle}>
          Show us the problem in three quick steps. You get a preliminary assessment in seconds, and a verified
          mechanic confirms it.
        </p>
      </header>
      <DiagnosisCard />
      <div ref={resultAreaRef} className={styles.resultArea}>
        <DiagnosisResult
          run={run}
          headingRef={resultHeadingRef}
          onRetry={() => document.getElementById('diagnose-submit')?.click()}
        />
      </div>
    </div>
  )
}
