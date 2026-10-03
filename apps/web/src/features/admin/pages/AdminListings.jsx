import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import Button from '../../../components/Button.jsx'
import Drawer from '../../../components/Drawer.jsx'
import Input from '../../../components/Input.jsx'
import Notice from '../../../components/Notice.jsx'
import Select from '../../../components/Select.jsx'
import { SkeletonRows } from '../../../components/Skeleton.jsx'
import StatusBadge from '../../../components/StatusBadge.jsx'
import TagBadges from '../../../components/TagBadges.jsx'
import { useToast } from '../../../components/Toast/ToastContext.js'
import { resolveTags, useTags } from '../../../context/TagsContext.js'
import { formatDate } from '../../../utils/formatDate.js'
import { createWordIndex, searchWords } from '../../../utils/wordSearch.js'
import PartCard from '../../marketplace/components/PartCard.jsx'
import { formatPrice } from '../../marketplace/format.js'
import AdminPage from '../components/AdminPage.jsx'
import AdminTable from '../components/AdminTable.jsx'
import DetailList from '../components/DetailList.jsx'
import FilterToolbar, { FilterField } from '../components/FilterToolbar.jsx'
import ReasonDialog from '../components/ReasonDialog.jsx'
import RowMenu from '../components/RowMenu.jsx'
import ShortId from '../components/ShortId.jsx'
import { useAdminQuery, useAdminService } from '../AdminContext.js'
import styles from './AdminListings.module.css'

const loadListings = (service) => service.getListings()

const VISIBILITY = [
  { value: '', label: 'All parts' },
  { value: 'visible', label: 'Visible' },
  { value: 'hidden', label: 'Hidden' },
]

const NONE = []

// The one status of a part: hidden by an admin, its shop is suspended, or visible (text + color).
function PartStatus({ part }) {
  if (part.hidden) return <StatusBadge label="Hidden" tone="danger" />
  if (part.shopSuspended) return <StatusBadge label="Shop suspended" tone="warning" />
  return <StatusBadge label="Visible" tone="success" />
}

// /admin/listings?q=...&show=hidden - every part from every shop, including hidden ones. A row opens
// a quick-detail drawer. An admin can hide or unhide a part (hiding needs a reason the shop sees);
// part data itself belongs to the shop and is never edited here.
export default function AdminListings() {
  const { data, error } = useAdminQuery(loadListings)
  const tags = useTags()
  const navigate = useNavigate()
  const service = useAdminService()
  const toast = useToast()
  const [hiding, setHiding] = useState(null)
  const [openId, setOpenId] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const show = searchParams.get('show') ?? ''

  const parts = data ?? NONE
  const index = useMemo(
    () =>
      createWordIndex(parts, (p) => [
        p.name,
        p.oemNumber,
        p.manufacturerNumber,
        p.brand,
        p.category,
        p.shopName,
        ...resolveTags(p.tagIds, tags).map((t) => t.name),
      ]),
    [parts, tags],
  )
  const results = useMemo(
    () => searchWords(index, query).filter((p) => !show || (show === 'hidden') === Boolean(p.hidden)),
    [index, query, show],
  )
  const open = parts.find((p) => p.id === openId) ?? null

  async function unhide(part) {
    try {
      await service.unhidePart(part.id)
      toast.success('The part is visible in the marketplace again.')
    } catch (err) {
      toast.error(err.message)
    }
  }

  function setFilter(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next, { replace: true })
  }

  return (
    <AdminPage title="Listings" description="All parts from all shops. Hide a part that breaks the rules; the shop sees your reason.">
      <FilterToolbar canReset={Boolean(query || show)} onReset={() => setSearchParams({}, { replace: true })}>
        <FilterField label="Search" grow>
          <Input
            type="search"
            value={query}
            placeholder="Part name, number, brand, shop or tag"
            onChange={(event) => setFilter('q', event.target.value)}
          />
        </FilterField>
        <FilterField label="Show">
          <Select value={show} onChange={(event) => setFilter('show', event.target.value)}>
            {VISIBILITY.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FilterField>
      </FilterToolbar>

      {error && <Notice tone="danger">Couldn't load listings: {error.message}</Notice>}
      {!data && !error && <SkeletonRows label="Loading…" />}
      {data && (
        <>
          <p className={styles.muted} aria-live="polite">
            {results.length} of {parts.length} parts
          </p>
          <AdminTable
            caption="Parts"
            emptyText="No parts match."
            rows={results}
            selectedKey={openId}
            onRowOpen={(p) => setOpenId(p.id)}
            columns={[
              {
                key: 'part',
                header: 'Part',
                render: (p) => (
                  <>
                    <button type="button" className={styles.name} onClick={() => setOpenId(p.id)}>
                      {p.name}
                    </button>
                    <span className={styles.subline}>
                      {p.oemNumber} · {p.brand} · {p.category}
                    </span>
                  </>
                ),
              },
              { key: 'id', header: 'ID', nowrap: true, render: (p) => <ShortId id={p.id} /> },
              { key: 'shop', header: 'Shop', render: (p) => p.shopName },
              { key: 'price', header: 'Price', align: 'right', nowrap: true, render: (p) => formatPrice(p.priceIls) },
              {
                key: 'tags',
                header: 'Tags',
                render: (p) => {
                  const partTags = resolveTags(p.tagIds, tags)
                  return partTags.length ? <TagBadges tags={partTags} /> : '—'
                },
              },
              { key: 'status', header: 'Status', render: (p) => <PartStatus part={p} /> },
              {
                key: 'actions',
                header: 'Actions',
                align: 'right',
                nowrap: true,
                render: (p) => (
                  <RowMenu
                    label={`Actions for ${p.name}`}
                    items={[
                      { label: 'View details', onSelect: () => setOpenId(p.id) },
                      p.hidden
                        ? { label: 'Unhide part', onSelect: () => unhide(p) }
                        : { label: 'Hide part', onSelect: () => setHiding(p), danger: true },
                    ]}
                  />
                ),
              },
            ]}
          />
        </>
      )}

      <Drawer open={Boolean(open)} narrow title={open?.name ?? ''} onClose={() => setOpenId(null)}>
        {open && (
          <div className={styles.drawerBody}>
            <PartStatus part={open} />
            <PartCard part={open} showShop={false} />
            <DetailList
              items={[
                { label: 'Shop', value: open.shopName },
                { label: 'Added', value: formatDate(open.addedAt) },
                { label: 'Hidden since', value: open.hidden && formatDate(open.hidden.hiddenAt) },
                { label: 'Reason shown to shop', value: open.hidden?.reason },
                { label: 'ID', value: <ShortId id={open.id} full /> },
              ]}
            />
            <div className={styles.drawerActions}>
              <Button onClick={() => navigate(`/admin/listings/${open.id}`)}>Open full page</Button>
              {open.hidden ? (
                <Button variant="secondary" onClick={() => unhide(open)}>
                  Unhide part
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => setHiding(open)}>
                  Hide part…
                </Button>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <ReasonDialog
        open={Boolean(hiding)}
        title={hiding ? `Hide ${hiding.name}?` : ''}
        label="Reason"
        hint="The shop sees this on its dashboard. E.g. the photos show a different part, or the price is misleading."
        requiredMessage="Write why the part is hidden - the shop will see it."
        confirmLabel="Hide part"
        onCancel={() => setHiding(null)}
        onConfirm={async (reason) => {
          await service.hidePart(hiding.id, reason)
          toast.success('The part is hidden from the marketplace. The shop sees your reason.')
          setHiding(null)
        }}
      />
    </AdminPage>
  )
}
