// Central API client: every call to apps/api goes through here. Paths start at /api, which the Vite
// dev server proxies to the api (vite.config.js).
// TODO: attach the auth token and handle 401 once real login exists (interceptors.js)

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * GET /api{path}. Resolves with the JSON body, rejects with ApiError when the api answers with an
 * error status.
 * @param {string} path  e.g. '/marketplace/parts'
 * @param {{ params?: Record<string, string>, signal?: AbortSignal }} [options]
 */
export async function apiGet(path, { params, signal } = {}) {
  const query = params ? `?${new URLSearchParams(params)}` : ''
  const response = await fetch(`/api${path}${query}`, { signal, headers: { Accept: 'application/json' } })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(body?.error ?? `Request failed (${response.status})`, response.status)
  return body
}
