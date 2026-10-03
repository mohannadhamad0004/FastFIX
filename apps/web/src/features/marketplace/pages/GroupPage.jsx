import { useParams } from 'react-router'
import Button from '../../../components/Button.jsx'
import EmptyState from '../../../components/EmptyState.jsx'
import { SkeletonCards } from '../../../components/Skeleton.jsx'
import { categoryPath, findGroup, inCategory, inGroup, mostPopular, onOffer, recentlyAdded } from '../catalog.js'
import Breadcrumb from '../components/Breadcrumb.jsx'
import PartRow from '../components/PartRow.jsx'
import Preview3DBanner from '../components/Preview3DBanner.jsx'
import TileGrid from '../components/TileGrid.jsx'
import VehicleBar from '../components/VehicleBar.jsx'
import { useMarketplaceData } from '../useMarketplaceData.js'
import styles from './CatalogPage.module.css'

// /marketplace/:group - one main group: its categories as tiles, then its product rows (only parts
// that fit the selected vehicle). "Accessories & equipment" starts with the 3D preview banner.
export default function GroupPage() {
  const { group: groupSlug } = useParams()
  const group = findGroup(groupSlug)
  const { loading, fitting, shopsById, tags } = useMarketplaceData()

  if (!group) {
    return (
      <EmptyState
        icon="🔧"
        headingLevel="h1"
        title="Page not found"
        description="This part of the marketplace doesn't exist."
        action={<Button to="/marketplace">Back to marketplace</Button>}
      />
    )
  }

  const groupParts = inGroup(fitting, group)
  const rowProps = { shopsById, tags }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Breadcrumb items={[{ label: 'Marketplace', to: '/marketplace' }, { label: group.name }]} />
        <h1 className={styles.title}>{group.name}</h1>
        <p className={styles.subtitle}>{group.description}</p>
      </header>

      {group.slug === 'accessories-equipment' && <Preview3DBanner />}

      <VehicleBar />

      <section className={styles.section} aria-labelledby="group-categories">
        <h2 id="group-categories" className={styles.sectionTitle}>
          Categories
        </h2>
        <TileGrid
          label={`${group.name} categories`}
          tiles={group.categories.map((category) => ({
            key: category.slug,
            label: category.name,
            icon: category.icon,
            image: category.image,
            to: categoryPath(group, category),
            count: loading ? undefined : inCategory(fitting, category).length,
          }))}
        />
      </section>

      {loading ? (
        <SkeletonCards count={4} media label="Loading parts…" />
      ) : groupParts.length === 0 ? (
        <EmptyState
          compact
          icon="🔍"
          title="No parts in this group fit your car yet"
          description="Clear the vehicle to see every part, or check back soon."
        />
      ) : (
        <>
          <PartRow title="Most popular" parts={mostPopular(groupParts)} {...rowProps} />
          <PartRow title="Recently added" parts={recentlyAdded(groupParts)} {...rowProps} />
          <PartRow title="On offer" parts={onOffer(groupParts, tags)} {...rowProps} />
        </>
      )}
    </div>
  )
}
