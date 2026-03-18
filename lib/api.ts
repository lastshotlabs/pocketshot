/**
 * Thin API client with automatic token refresh.
 *
 * Uses x-user-token header for auth (not cookies).
 * On 401: attempts one token refresh, retries, clears tokens on second 401.
 */
import { API_BASE_URL } from './config'
import type { TokenStorage } from './tokenStorage'
import { tokenStorage as defaultStorage } from './tokenStorage'

type RequestOptions = RequestInit & { skipAuth?: boolean }

export class ApiClient {
  private storage: TokenStorage
  private isRefreshing = false
  private refreshPromise: Promise<string | null> | null = null

  constructor(storage: TokenStorage) {
    this.storage = storage
  }

  private async doRefresh(): Promise<string | null> {
    const refreshToken = await this.storage.getRefreshToken()
    if (!refreshToken) return null

    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!res.ok) return null
      const data = await res.json()
      await this.storage.set(data.token)
      if (data.refreshToken) await this.storage.setRefreshToken(data.refreshToken)
      return data.token as string
    } catch {
      return null
    }
  }

  private refreshOnce(): Promise<string | null> {
    if (this.isRefreshing && this.refreshPromise) return this.refreshPromise
    this.isRefreshing = true
    this.refreshPromise = this.doRefresh().finally(() => {
      this.isRefreshing = false
      this.refreshPromise = null
    })
    return this.refreshPromise
  }

  async fetch(path: string, options: RequestOptions = {}): Promise<Response> {
    const { skipAuth = false, ...init } = options
    const headers = new Headers(init.headers)
    headers.set('Content-Type', 'application/json')

    if (!skipAuth) {
      const token = await this.storage.get()
      if (token) headers.set('x-user-token', token)
    }

    const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })

    if (res.status === 401 && !skipAuth) {
      const newToken = await this.refreshOnce()
      if (newToken) {
        headers.set('x-user-token', newToken)
        return fetch(`${API_BASE_URL}${path}`, { ...init, headers })
      }
      await this.storage.clear()
      await this.storage.clearRefreshToken()
    }

    return res
  }

  async post<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    const res = await this.fetch(path, { method: 'POST', body: JSON.stringify(body), ...options })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw Object.assign(new Error(err.error ?? 'Request failed'), { status: res.status, data: err })
    }
    return res.json() as Promise<T>
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    const res = await this.fetch(path, { method: 'GET', ...options })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw Object.assign(new Error(err.error ?? 'Request failed'), { status: res.status, data: err })
    }
    return res.json() as Promise<T>
  }
}

export const api = new ApiClient(defaultStorage)

// Legacy named exports kept for any direct callers
export async function apiFetch(path: string, options: RequestOptions = {}): Promise<Response> {
  return api.fetch(path, options)
}

export async function apiPost<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
  return api.post<T>(path, body, options)
}

export async function apiGet<T>(path: string, options?: RequestOptions): Promise<T> {
  return api.get<T>(path, options)
}
