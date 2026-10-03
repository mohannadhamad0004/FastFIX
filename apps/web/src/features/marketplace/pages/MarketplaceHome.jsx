import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router'
import EmptyState from '../../../components/EmptyState.jsx'
import { SkeletonCards } from '../../../components/Skeleton.jsx'
import Tabs, { TabPanel } from '../../../components/Tabs.jsx'
import {
  categoryPath,
  GROUPS,
  inCategory,
  mostPopular,
  offerBanners,
  onOffer,
  recentlyAdded,
  recentlyUpdated,
} from '../catalog.js'
import FeaturedShops from '../components/FeaturedShops.jsx'
import MarketplaceHero from '../components/MarketplaceHero.jsx'
import OfferCarousel from '../components/OfferCarousel.jsx'
import PartRow from '../components/PartRow.jsx'
import TileGrid from '../components/TileGrid.jsx'
import { vehicleName } from '../format.js'
import { useMarketplaceData } from '../useMarketplaceData.js'
import styles from './MarketplaceHome.module.css'

const TABS_ID = 'marketplace-groups'

// /marketplace - hero (search by part number, or choose the car), the main groups, offer banners,
// a tabbed grid of every category, product rows and featured shops. With a vehicle chosen, "Parts
// that fit your car" comes first and every row only shows parts that fit it.
// Old links (/marketplace?q=...) go to the search page.
export default function MarketplaceHome() {
  const [searchParams] = useSearchParams()
  const { loading, error, fitting, shops, shopsById, vehicle, tags, ratings } = useMarketplaceData()
  const [tab, setTab] = useState(GROUPS[0].slug)

  if (searchParams.get('q')) return <Navigate to={`/marketplace/search?${searchParams}`} replace />

  const group = GROUPS.find((g) => g.slug === tab)
  const rowProps = { shopsById, tags }

  return (
    <div className={styles.page}>
      <MarketplaceHero />

      <section aria-labelledby="groups-title" className={styles.section}>
        <h2 id="groups-title" className={styles.srOnly}>
          Shop by group
        </h2>
        <TileGrid
          size="large"
          label="Main groups"
          tiles={GROUPS.map((g) => ({ key: g.slug, label: g.name, icon: g.icon, image: g.image, to: `/marketplace/${g.slug}` }))}
        />
      </section>

      {error ? (
        <EmptyState icon="⚠" title="Couldn't load parts" description="Please try again in a moment." />
      ) : loading ? (
        <SkeletonCards count={4} media label="Loading parts…" />
      ) : (
        <>
          {vehicle && (
            <PartRow
              title={`Parts that fit your ${vehicleName(vehicle)}`}
              parts={[...mostPopular(fitting), ...recentlyAdded(fitting).filter((p) => !p.salesCount)]}
              viewAllTo="/marketplace/search"
              {...rowProps}
            />
          )}

          <OfferCarousel banners={offerBanners(fitting, tags)} />

          <section aria-labelledby="categories-title" className={styles.section}>
            <h2 id="categories-title" className={styles.sectionTitle}>
              Shop by category
            </h2>
            <Tabs
              tabs={GROUPS.map((g) => ({ value: g.slug, label: g.name }))}
              value={tab}
              onChange={setTab}
              idPrefix={TABS_ID}
              label="Main groups"
            />
            <TabPanel idPrefix={TABS_ID} value={tab}>
              <TileGrid
                label={`${group.name} categories`}
                tiles={group.categories.map((category) => ({
                  key: category.slug,
                  label: category.name,
                  icon: category.icon,
                  image: category.image,
                  to: categoryPath(group, category),
                  count: inCategory(fitting, category).length,
                }))}
              />
            </TabPanel>
          </section>

          <PartRow title="Most popular" parts={mostPopular(fitting)} viewAllTo="/marketplace/search?list=popular" {...rowProps} />
          <PartRow title="Recently added" parts={recentlyAdded(fitting)} viewAllTo="/marketplace/search?list=new" {...rowProps} />
          <PartRow
            title="Recently updated"
            parts={recentlyUpdated(fitting)}
            viewAllTo="/marketplace/search?list=updated"
            {...rowProps}
          />
          <PartRow title="On offer" parts={onOffer(fitting, tags)} viewAllTo="/marketplace/search?list=offers" {...rowProps} />

          <FeaturedShops shops={shops} ratings={ratings} />
        </>
      )}
    </div>
  )
}
