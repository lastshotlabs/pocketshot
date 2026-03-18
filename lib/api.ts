/**
 * Thin API client wrapper with automatic token refresh.
 *
 * Uses x-user-token header for auth (not cookies).
 * On 401: attempts one token refresh, retries, redirects to login on second 401.
 */
import { API_BASE_URL } from './config'
import { getToken, getRefreshToken, setTokens, clearTokens } from './tokenStorage'

type RequestOptions = RequestInit & { skipAuth?: boolean }

let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

async function doRefresh(): Promise<string | null> {
  const refreshToken = await getRefreshToken()
  if (!refreshToken) return null

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return null
    const data = await res.json()
    await setTokens(data.token, data.refreshToken)
    return data.token
  } catch {
    return null
  }
}

async function refreshOnce(): Promise<string | null> {
  // Deduplicate concurrent refresh calls
  if (isRefreshing && refreshPromise) return refreshPromise
  isRefreshing = true
  refreshPromise = doRefresh().finally(() => {
    isRefreshing = false
    refreshPromise = null
  })
  return refreshPromise
}

export async function apiFetch(path: string, options: RequestOptions = {}): Promise<Response> {
  const { skipAuth = false, ...init } = options
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')

  if (!skipAuth) {
    const token = await getToken()
    if (token) headers.set('x-user-token', token)
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })

  // Token refresh interceptor
  if (res.status === 401 && !skipAuth) {
    const newToken = await refreshOnce()
    if (newToken) {
      headers.set('x-user-token', newToken)
      return fetch(`${API_BASE_URL}${path}`, { ...init, headers })
    }
    // Refresh failed — clear tokens (caller handles redirect to login)
    await clearTokens()
  }

  return res
}

// Typed helpers
export async function apiPost<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
  const res = await apiFetch(path, { method: 'POST', body: JSON.stringify(body), ...options })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw Object.assign(new Error(err.error ?? 'Request failed'), { status: res.status, data: err })
  }
  return res.json()
}

export async function apiGet<T>(path: string, options?: RequestOptions): Promise<T> {
  const res = await apiFetch(path, { method: 'GET', ...options })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw Object.assign(new Error(err.error ?? 'Request failed'), { status: res.status, data: err })
  }
  return res.json()
}
