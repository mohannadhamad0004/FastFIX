// Downloads a Pixabay photo for every group, category and subcategory of the marketplace catalogue
// (apps/web/src/features/marketplace/catalog.js) plus the offer-banner photos, converts them to
// WebP and records the credits. Run: npm run images:fetch
//
//  - Search words come from `photoQuery` in catalog.js.
//  - Existing images are kept (re-running never replaces your choices). To replace one, delete its
//    file, or pin a photo in scripts/image-overrides.json: { "brake-discs": 1234567 } (Pixabay image
//    ID, the number at the end of the photo's page URL). Keys: a category slug, a part id ("p-001"),
//    or "banner-<category slug>". `false` means "no photo for this one" (parts then show
//    their category photo, banners a gradient). An override is downloaded again when it changes.
//  - The key is read from PIXABAY_API_KEY in the root .env. It is only used here, never in the app.
//  - Pixabay doesn't allow permanent hotlinking, so every photo is downloaded into the project.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const imagesDir = path.join(root, 'apps/web/public/images')
const creditsDir = path.join(imagesDir, 'marketplace')
const creditsFile = path.join(creditsDir, 'credits.json')
const manifestFile = path.join(root, 'apps/web/src/features/marketplace/catalogImages.json')
const mechanicsManifestFile = path.join(root, 'apps/web/src/features/mechanics/mechanicImages.json')
const overridesFile = path.join(root, 'scripts/image-overrides.json')
const TILE_WIDTH = 400
const BANNER_WIDTH = 1600
const PART_WIDTH = 600
const DELAY_MS = 700 // between Pixabay requests (the limit is 100 per minute)

if (existsSync(path.join(root, '.env'))) process.loadEnvFile(path.join(root, '.env'))
const key = process.env.PIXABAY_API_KEY
if (!key) {
  console.error('PIXABAY_API_KEY is missing. Get a free key at https://pixabay.com/api/docs/ and put it in the root .env.')
  process.exit(1)
}

const readJson = (file, fallback) => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : fallback)
const marketplace = path.join(root, 'apps/web/src/features/marketplace')
const { GROUPS } = await import(pathToFileURL(path.join(marketplace, 'catalog.js')).href)
const { parts } = await import(pathToFileURL(path.join(marketplace, 'mockData.js')).href)
const mechanicsDir = path.join(root, 'apps/web/src/features/mechanics')
const { SKILL_PHOTOS, WORKSHOP_QUERIES } = await import(pathToFileURL(path.join(mechanicsDir, 'skills.js')).href)
const { seedUsers } = await import(pathToFileURL(path.join(root, 'apps/web/src/auth/mockUsers.js')).href)

// The search words for a part: its own `photoQuery`, else its name without sizes and positions,
// with "car" in front: "Front brake pad set" -> "car brake pad set", "LED headlight, left" ->
// "car LED headlight". Tools and fluids don't get "car".
const NOISE = /^(front|rear|left|right|pair|pieces?|unpainted|vented|heated)$/i
function partQuery(part) {
  const words = part.name
    .replace(/\(.*?\)/g, '')
    .split(',')[0]
    .split(/\s+/)
    .filter((word) => !/\d/.test(word) && !NOISE.test(word))
  const text = words.join(' ')
  if (part.photoQuery) return part.photoQuery
  if (part.category === 'Tools') return `${text} tool`
  if (part.category === 'Oils & Fluids') return `${text} bottle`
  return `car ${text}`
}

// Every image to fetch: { key, rel, name, query, width, banner? }.
//   key: the name in credits, the manifest and image-overrides.json (category slug, part id, or
//        "banner-<category slug>"); rel: the file under apps/web/public/images
const items = []
// Car things are searched in Pixabay's "transportation" topic, so "oil filter" isn't a cigarette filter.
const CAR_GROUPS = ['car-parts', 'tires-wheels', 'accessories-equipment']
const add = (key, folder, name, query, width, banner = false, topic = undefined) =>
  items.push({ key, rel: `${folder}/${key.replace(/^(banner|skill|workshop)-/, '')}.webp`, name, query, width, banner, topic })
for (const group of GROUPS) {
  const topic = CAR_GROUPS.includes(group.slug) ? 'transportation' : undefined
  add(group.slug, 'marketplace', group.name, group.photoQuery, TILE_WIDTH, false, topic)
  for (const category of group.categories) {
    add(category.slug, 'marketplace', category.name, category.photoQuery, TILE_WIDTH, false, topic)
    // The wide photo behind the category's offer banner
    add(`banner-${category.slug}`, 'banners', `${category.name} offer banner`, category.bannerQuery ?? category.photoQuery, BANNER_WIDTH, true, topic)
    for (const sub of category.subcategories) add(sub.slug, 'marketplace', sub.name, sub.photoQuery, TILE_WIDTH, false, topic)
  }
}
for (const part of parts) {
  const topic = ['Tools', 'Oils & Fluids'].includes(part.category) ? undefined : 'transportation'
  add(part.id, 'parts', part.name, partQuery(part), PART_WIDTH, false, topic)
}
// Skill tiles on /mechanics, and the cover photo of each approved mock mechanic's workshop
for (const { skill, slug, photoQuery } of SKILL_PHOTOS) add(`skill-${slug}`, 'skills', skill, photoQuery, 600, false, 'transportation')
seedUsers
  .filter((user) => user.role === 'mechanic' && user.status === 'approved')
  .forEach((mechanic, i) => {
    const query = mechanic.workshopQuery ?? WORKSHOP_QUERIES[i % WORKSHOP_QUERIES.length]
    add(`workshop-${mechanic.id}`, 'workshops', mechanic.workshopName, query, 800, false)
  })
const seen = new Set()
for (const item of items) {
  if (!item.query) throw new Error(`"${item.key}" has no search words (photoQuery in catalog.js)`)
  if (seen.has(item.key)) throw new Error(`Duplicate key "${item.key}"`)
  seen.add(item.key)
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const api = async (params) => {
  await sleep(DELAY_MS)
  const response = await fetch(`https://pixabay.com/api/?${new URLSearchParams({ key, ...params })}`)
  if (response.status === 429) throw new Error('Pixabay rate limit reached (100 requests/minute). Run again in a minute; finished images are kept.')
  if (response.status === 400 || response.status === 401) throw new Error(`Pixabay ${response.status}: check PIXABAY_API_KEY (${(await response.text()).slice(0, 80)})`)
  if (!response.ok) throw new Error(`Pixabay ${response.status}`)
  return (await response.json()).hits
}

const download = async (url) => Buffer.from(await (await fetch(url)).arrayBuffer())

// Brightness 0-255 of a small preview: a light, plain background scores high.
async function brightness(photo) {
  const { channels: [r, g = r, b = r] } = await sharp(await download(photo.previewURL)).toColourspace('srgb').resize(16, 16, { fit: 'cover' }).stats()
  return 0.299 * r.mean + 0.587 * g.mean + 0.114 * b.mean
}

// The best photo of the search: square or landscape (banners: clearly wide), then for tiles and
// parts the lightest preview (plain / light background); for banners the most popular one. The same
// search is only sent once per run.
const picked = new Map()
function pick({ query, banner, topic }) {
  const cacheKey = `${banner}|${topic}|${query}`
  if (!picked.has(cacheKey)) picked.set(cacheKey, search({ query, banner, topic }))
  return picked.get(cacheKey)
}
// Does the photo's tag list mention one of the search's own words ("belt" for "car engine belt")?
// A photo of something else that merely ranked high (a Scrabble board for "belt") is skipped;
// better no photo (the app then shows the category photo) than a wrong one.
const STOP = new Set(['car', 'auto', 'tool', 'bottle', 'set', 'kit', 'fully', 'semi', 'with', 'close', 'night', 'cars'])
function relevant(hit, query) {
  const words = query.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2 && !STOP.has(word))
  const tags = hit.tags.toLowerCase()
  return words.some((word) => tags.includes(word.replace(/s$/, '')))
}

async function search({ query, banner, topic }) {
  const params = { q: query.slice(0, 100), image_type: 'photo', safesearch: 'true', orientation: 'horizontal', per_page: '20', ...(topic && { category: topic }) }
  let hits = await api(params)
  if (hits.length === 0 && topic) {
    // nothing in the topic: search everywhere
    delete params.category
    hits = await api(params)
  }
  hits = hits.filter((hit) => relevant(hit, query))
  const fitting = banner ? hits.filter((p) => p.imageWidth / p.imageHeight >= 1.4) : hits
  const candidates = (fitting.length ? fitting : hits).slice(0, 6) // the most relevant few, then the lightest
  if (banner) return candidates[0] ?? null
  const scored = await Promise.all(candidates.map(async (photo) => ({ photo, light: await brightness(photo) })))
  return scored.sort((a, b) => b.light - a.light)[0]?.photo ?? null
}

await Promise.all(['marketplace', 'parts', 'banners', 'skills', 'workshops'].map((folder) => mkdir(path.join(imagesDir, folder), { recursive: true })))
const credits = readJson(creditsFile, {})
const overrides = readJson(overridesFile, {})
const failed = []
let downloaded = 0

for (const item of items) {
  const file = path.join(imagesDir, item.rel)
  const override = overrides[item.key]
  if (override === false) continue // "no photo": the app shows the category photo instead
  const stale = override && credits[item.key]?.id !== Number(override)
  if (existsSync(file) && !stale) continue
  try {
    const photo = override ? (await api({ id: String(override) }))[0] : await pick(item)
    if (!photo) throw new Error(`no photo found for "${item.query}"`)
    const bytes = await download(photo.largeImageURL) // 1280px wide (the largest Pixabay allows without approval)
    await sharp(bytes)
      .resize({ width: item.width, withoutEnlargement: true })
      .webp({ quality: item.banner ? 78 : 80 })
      .toFile(file)
    credits[item.key] = { id: photo.id, photographer: photo.user, url: photo.pageURL, query: item.query }
    downloaded++
    console.log(`+ ${item.key}  (${item.query})  ${photo.pageURL}`)
  } catch (error) {
    if (/rate limit|Pixabay 40[01]/.test(error.message)) {
      console.error(error.message)
      break
    }
    failed.push(item.key)
    console.warn(`! ${item.key}: ${error.message}`)
  }
}

// Credits (for the files that exist) and the manifest the app reads (key -> URL).
const have = items.filter((item) => existsSync(path.join(imagesDir, item.rel)))
writeFileSync(creditsFile, JSON.stringify(credits, null, 2) + '\n')
const creditRow = (item) => {
  const c = credits[item.key]
  return c ? `| ${item.rel} | ${c.photographer} | ${c.url} |` : `| ${item.rel} | (added by hand) | |`
}
writeFileSync(
  path.join(creditsDir, 'CREDITS.md'),
  [
    '# Photo credits',
    '',
    'Photos from [Pixabay](https://pixabay.com), free to use under the [Pixabay Content License](https://pixabay.com/service/license-summary/). Generated by `npm run images:fetch`. Paths are under `apps/web/public/images/`.',
    '',
    '| File | Author | Pixabay page |',
    '| --- | --- | --- |',
    ...have.map(creditRow),
    '',
  ].join('\n'),
)
const urls = (list) => Object.fromEntries(list.map((item) => [item.key, `/images/${item.rel}`]))
const forMechanics = (item) => /^(skills|workshops)\//.test(item.rel)
writeFileSync(manifestFile, JSON.stringify(urls(have.filter((item) => !forMechanics(item))), null, 2) + '\n')
writeFileSync(mechanicsManifestFile, JSON.stringify(urls(have.filter(forMechanics)), null, 2) + '\n')

const missing = items.filter((item) => !have.includes(item))
const list = (kind) => missing.filter((item) => kind(item)).map((item) => item.key).join(', ')
console.log(`\n${downloaded} downloaded, ${have.length}/${items.length} images in place.`)
if (missing.length) {
  console.log(`No photo for - categories: ${list((i) => i.rel.startsWith('marketplace')) || 'none'}`)
  console.log(`               banners: ${list((i) => i.banner) || 'none'}`)
  console.log(`               skills: ${list((i) => i.rel.startsWith('skills')) || 'none'}`)
  console.log(`               workshops: ${list((i) => i.rel.startsWith('workshops')) || 'none'}`)
  console.log(`               parts: ${list((i) => i.rel.startsWith('parts')) || 'none'}`)
}
if (failed.length) process.exitCode = 1
