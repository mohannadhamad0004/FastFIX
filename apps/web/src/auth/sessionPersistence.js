// TODO: remove when real backend auth exists
//
// Keeps the mock auth state (accounts, who is logged in, reset links) in sessionStorage, so a
// page refresh during testing doesn't log you out or forget new signups and admin decisions.
// sessionStorage is per tab: closing the tab (or "Reset mock data" in the dev login panel)
// starts fresh from mockUsers.js.
//
// Uploaded files are stored as data URLs. If the browser's storage limit (~5 MB) is reached,
// only the logged-in user id is kept, and accounts fall back to the seed data.
//
// Only auth state is kept. Marketplace edits, requests, tags and the 3D preview selection still
// reset on refresh.

const STORAGE_KEY = 'fastfix.mockAuth'
// Bump when the shape of stored accounts changes, so old sessions fall back to the seed.
// 2: notification prefs, pending changes, service modes, truck status and review status.
const FORMAT_VERSION = 2

// Stored data from an older version of mockUsers.js is ignored, so seed changes show up right
// away instead of being hidden behind an old session.
function seedFingerprint(seedUsers) {
  return seedUsers.map((u) => `${u.id}|${u.email}|${u.status}|${u.password}`).join(';')
}

function storage() {
  try {
    return window.sessionStorage
  } catch {
    return null // blocked (e.g. some private modes)
  }
}

// --- Files <-> data URLs -------------------------------------------------------------------------

const dataUrls = new WeakMap() // File -> Promise<string>, so unchanged files are read once

function readAsDataUrl(file) {
  if (!dataUrls.has(file)) {
    dataUrls.set(
      file,
      new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
      }),
    )
  }
  return dataUrls.get(file)
}

async function encode(value) {
  if (value instanceof Blob) {
    return {
      __file: {
        name: value.name ?? 'file',
        type: value.type,
        lastModified: value.lastModified ?? 0,
        dataUrl: await readAsDataUrl(value),
      },
    }
  }
  if (Array.isArray(value)) return Promise.all(value.map(encode))
  if (value && typeof value === 'object') {
    const entries = await Promise.all(Object.entries(value).map(async ([key, item]) => [key, await encode(item)]))
    return Object.fromEntries(entries)
  }
  return value
}

function dataUrlToFile({ name, type, lastModified, dataUrl }) {
  const binary = atob(dataUrl.slice(dataUrl.indexOf(',') + 1))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new File([bytes], name, { type, lastModified })
}

function decode(value) {
  if (Array.isArray(value)) return value.map(decode)
  if (value && typeof value === 'object') {
    if (value.__file) return dataUrlToFile(value.__file)
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, decode(item)]))
  }
  return value
}

// --- Load / save ---------------------------------------------------------------------------------

/**
 * The saved auth state for this tab, or `seed` when there is none (or it can't be used).
 * @param {{ users: Object[], sessionUserId: string | null, resetTokens: Object[] }} seed
 */
export function loadAuthState(seed) {
  try {
    const raw = storage()?.getItem(STORAGE_KEY)
    if (!raw) return seed
    const saved = JSON.parse(raw)
    if (saved.version !== FORMAT_VERSION || saved.seed !== seedFingerprint(seed.users)) return seed

    const users = saved.users ? decode(saved.users) : seed.users
    const sessionUserId = users.some((u) => u.id === saved.sessionUserId) ? saved.sessionUserId : null
    return { users, sessionUserId, resetTokens: saved.resetTokens ?? [] }
  } catch (error) {
    console.warn('[mock auth] Ignoring saved session:', error)
    return seed
  }
}

let latestSave = 0

/** Saves the auth state for this tab. Async because files are read as data URLs. */
export async function saveAuthState(data, seedUsers) {
  const store = storage()
  if (!store) return
  const saveId = ++latestSave
  const base = {
    version: FORMAT_VERSION,
    seed: seedFingerprint(seedUsers),
    sessionUserId: data.sessionUserId,
    resetTokens: data.resetTokens,
  }

  try {
    const users = await encode(data.users)
    if (saveId !== latestSave) return // a newer save started while files were being read
    store.setItem(STORAGE_KEY, JSON.stringify({ ...base, users }))
  } catch (error) {
    if (saveId !== latestSave) return
    // Usually the storage limit: keep at least who is logged in.
    console.warn('[mock auth] Could not save all accounts to sessionStorage; keeping only the login.', error)
    try {
      store.setItem(STORAGE_KEY, JSON.stringify(base))
    } catch {
      // Storage is unavailable - the app still works, just without surviving refreshes.
    }
  }
}

/** Forgets the saved state (used by "Reset mock data"). */
export function clearAuthState() {
  try {
    storage()?.removeItem(STORAGE_KEY)
  } catch {
    // nothing to clear
  }
}
