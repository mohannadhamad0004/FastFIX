import styles from './Highlight.module.css'

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Wraps every occurrence of `terms` in `text` with <mark>. Terms only match at the start of a
// word, so "rio" highlights "Rio" but not the middle of another word.
export default function Highlight({ text, terms }) {
  if (!terms || terms.length === 0) return text

  const pattern = [...terms].sort((a, b) => b.length - a.length).map(escapeRegExp).join('|')
  const parts = String(text).split(new RegExp(`(?<![a-z0-9])(${pattern})`, 'gi'))

  // split() with a capture group puts the matches at the odd indexes
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className={styles.mark}>
        {part}
      </mark>
    ) : (
      part
    ),
  )
}
