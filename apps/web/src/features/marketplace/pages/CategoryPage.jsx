import { useParams, useSearchParams } from 'react-router'
import Button from '../../../components/Button.jsx'
import EmptyState from '../../../components/EmptyState.jsx'
import { SkeletonCards } from '../../../components/Skeleton.jsx'
import { findCategory, findGroup, inCategory, inSubcategory, isOnOffer } from '../catalog.js'
import Breadcrumb from '../components/Breadcrumb.jsx'
import PartResults, { NoResults } from '../components/PartResults.jsx'
import TileGrid from '../components/TileGrid.jsx'
import { useMarketplaceData } from '../useMarketplaceData.js'
import styles from './CatalogPage.module.css'

// Best sellers first, then the newest: the order "Relevance" uses on category pages.
const byRelevance = (a, b) => (b.salesCount ?? 0) - (a.salesCount ?? 0) || b.addedAt.localeCompare(a.addedAt)

// /marketplace/:group/:category?sub=brake-pads&offers=1&sort=price-asc - one category: subcategory
// filters on top, then the results (only parts that fit the selected vehicle), sorted and paged.
// ?offers=1 comes from the offer banners: only parts on offer.
export default function CategoryPage() {
  const { group: groupSlug, category: categorySlug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const group = findGroup(groupSlug)
  const category = findCategory(group, categorySlug)
  const { loading, fitting, shopsById, ratings, tags } = useMarketplaceData()

  if (!category) {
    return (
      <EmptyState
        icon="🔧"
        headingLevel="h1"
        title="Category not found"
        action={<Button to={group ? `/marketplace/${group.slug}` : '/marketplace'}>Back</Button>}
      />
    )
  }

  const subSlug = searchParams.get('sub')
  const sub = category.subcategories.find((s) => s.slug === subSlug) ?? null
  const offersOnly = searchParams.get('offers') === '1'

  const setParam = (key, value) =>
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )

  const categoryParts = inCategory(fitting, category)
  let results = sub ? inSubcategory(categoryParts, sub) : categoryParts
  if (offersOnly) results = results.filter((part) => isOnOffer(part, tags))
  results = [...results].sort(byRelevance)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Breadcrumb
          items={[
            { label: 'Marketplace', to: '/marketplace' },
            { label: group.name, to: `/marketplace/${group.slug}` },
            { label: category.name },
          ]}
        />
        <h1 className={styles.title}>
          {category.name}
          {sub && `: ${sub.name}`}
        </h1>
      </header>

      {category.subcategories.length > 0 && (
        <TileGrid
          size="compact"
          label="Subcategories"
          tiles={[
            { key: 'all', label: `All ${category.name.toLowerCase()}`, icon: category.icon, image: category.image, selected: !sub, onClick: () => setParam('sub', null) },
            ...category.subcategories.map((s) => ({
              key: s.slug,
              label: s.name,
              icon: category.icon,
              image: s.image,
              selected: sub?.slug === s.slug,
              count: inSubcategory(categoryParts, s).length,
              onClick: () => setParam('sub', sub?.slug === s.slug ? null : s.slug),
            })),
          ]}
        />
      )}

      {offersOnly && (
        <div className={styles.chips}>
          <button type="button" className={styles.chip} onClick={() => setParam('offers', null)} aria-label="Remove filter: on offer only">
            On offer only <span aria-hidden="true">×</span>
          </button>
        </div>
      )}

      {loading ? (
        <SkeletonCards count={6} media label="Loading parts…" />
      ) : (
        <PartResults
          parts={results}
          shopsById={shopsById}
          ratings={ratings}
          empty={
            <NoResults
              onClear={
                sub || offersOnly
                  ? () =>
                      setSearchParams(
                        (current) => {
                          const next = new URLSearchParams(current)
                          next.delete('sub')
                          next.delete('offers')
                          return next
                        },
                        { replace: true },
                      )
                  : null
              }
            />
          }
        />
      )}
    </div>
  )
}
