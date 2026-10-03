import { GROUPS } from '../catalog.js'
import images from '../catalogImages.json'
import { parts } from '../mockData.js'
import styles from './DevImagesPage.module.css'

// /dev/images - development only (routes.jsx leaves it out of production builds). Every catalogue
// item, offer banner and part with its photo and key, to spot wrong pictures. To fix one: put the
// Pixabay image ID (the number at the end of its page URL) in scripts/image-overrides.json as
// { "<key>": 123 } and run `npm run images:fetch`. Keys: a category slug, "banner-<category slug>"
// or a part id.
const categories = GROUPS.flatMap((group) => [
  { key: group.slug, name: group.name, detail: 'group' },
  ...group.categories.flatMap((category) => [
    { key: category.slug, name: category.name, detail: 'category' },
    ...category.subcategories.map((s) => ({ key: s.slug, name: s.name, detail: 'subcategory' })),
  ]),
])
const banners = GROUPS.flatMap((group) =>
  group.categories.map((category) => ({ key: `banner-${category.slug}`, name: `${category.name} offer`, detail: category.bannerQuery ?? category.photoQuery })),
)
const partRows = parts.map((part) => ({ key: part.id, name: part.name, detail: part.category }))

const SECTIONS = [
  { title: 'Categories', rows: categories },
  { title: 'Banners', rows: banners, wide: true },
  { title: 'Parts', rows: partRows },
]

export default function DevImagesPage() {
  const missing = SECTIONS.flatMap((section) => section.rows).filter((row) => !images[row.key])
  return (
    <div className={styles.page}>
      <h1>Marketplace images</h1>
      <p className={styles.muted}>
        {missing.length === 0 ? 'Every item has a photo.' : `Missing: ${missing.map((row) => row.key).join(', ')}.`} Wrong picture? Add{' '}
        <code>{'{ "key": pixabayImageId }'}</code> to <code>scripts/image-overrides.json</code> and run <code>npm run images:fetch</code>. Parts without a
        photo show their category photo.
      </p>
      {SECTIONS.map((section) => (
        <section key={section.title} className={styles.section}>
          <h2>
            {section.title} ({section.rows.filter((row) => images[row.key]).length}/{section.rows.length})
          </h2>
          <ul className={styles.grid}>
            {section.rows.map((row) => (
              <li key={row.key} className={styles.item}>
                {images[row.key] ? (
                  <img src={images[row.key]} alt={row.name} loading="lazy" className={section.wide ? styles.wide : styles.photo} />
                ) : (
                  <div className={styles.none}>No photo</div>
                )}
                <strong>{row.name}</strong>
                <code>{row.key}</code>
                <span className={styles.muted}>{row.detail}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
