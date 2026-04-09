import type { PocketshotAuthContract } from '../auth/contract'
import type { TokenStorage } from '../auth/storage'

export class ApiError extends Error {
  status: number
  code?: string
  data?: unknown

  constructor(message: string, status: number, code?: string, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.data = data
  }
}

type RequestOptions = RequestInit & { skipAuth?: boolean }

export class ApiClient {
  private readonly baseUrl: string
  private readonly tokenStorage: TokenStorage
  private readonly contract: PocketshotAuthContract
  private isRefreshing = false
  private refreshPromise: Promise<string | null> | null = null

  constructor(opts: {
    baseUrl: string
    tokenStorage: TokenStorage
    contract: PocketshotAuthContract
  }) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '')
    this.tokenStorage = opts.tokenStorage
    this.contract = opts.contract
  }

  private async doRefresh(): Promise<string | null> {
    const refreshToken = await this.tokenStorage.getRefreshToken()
    if (!refreshToken) return null

    try {
      const res = await fetch(`${this.baseUrl}${this.contract.endpoints.refresh}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!res.ok) return null
      const data = (await res.json()) as { token: string; refreshToken?: string }
      await this.tokenStorage.setToken(data.token)
      if (data.refreshToken) {
        await this.tokenStorage.setRefreshToken(data.refreshToken)
      }
      return data.token
    } catch {
      return null
    }
  }

  private async refreshOnce(): Promise<string | null> {
    if (this.isRefreshing && this.refreshPromise) return this.refreshPromise
    this.isRefreshing = true
    this.refreshPromise = this.doRefresh().finally(() => {
      this.isRefreshing = false
      this.refreshPromise = null
    })
    return this.refreshPromise
  }

  private async buildHeaders(skipAuth: boolean): Promise<Headers> {
    const headers = new Headers()
    headers.set('Content-Type', 'application/json')

    if (!skipAuth) {
      const token = await this.tokenStorage.getToken()
      if (token) headers.set(this.contract.headers.userToken, token)
    }

    return headers
  }

  async fetch(path: string, options: RequestOptions = {}): Promise<Response> {
    const { skipAuth = false, ...init } = options
    const headers = await this.buildHeaders(skipAuth)

    // Merge any caller-supplied headers
    if (init.headers) {
      new Headers(init.headers as Record<string, string>).forEach((val, key) =>
        headers.set(key, val),
      )
    }

    const res = await fetch(`${this.baseUrl}${path}`, { ...init, headers })

    if (res.status === 401 && !skipAuth) {
      const newToken = await this.refreshOnce()
      if (newToken) {
        headers.set(this.contract.headers.userToken, newToken)
        return fetch(`${this.baseUrl}${path}`, { ...init, headers })
      }
      await this.tokenStorage.clearToken()
      await this.tokenStorage.clearRefreshToken()
    }

    return res
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ error: res.statusText }))
      const msg: string = ((errBody as Record<string, unknown>).error as string) ?? 'Request failed'
      const code: string | undefined = (errBody as Record<string, unknown>).code as
        | string
        | undefined
      throw new ApiError(msg, res.status, code, errBody)
    }
    const contentType = res.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      return undefined as T
    }
    return res.json() as Promise<T>
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    const res = await this.fetch(path, { method: 'GET', ...options })
    return this.handleResponse<T>(res)
  }

  async post<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    const res = await this.fetch(path, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    })
    return this.handleResponse<T>(res)
  }

  async put<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    const res = await this.fetch(path, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options,
    })
    return this.handleResponse<T>(res)
  }

  async patch<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    const res = await this.fetch(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
      ...options,
    })
    return this.handleResponse<T>(res)
  }

  async delete<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const res = await this.fetch(path, {
      method: 'DELETE',
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      ...options,
    })
    return this.handleResponse<T>(res)
  }
}
