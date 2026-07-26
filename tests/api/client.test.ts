import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiClient, ApiError } from '../../src/api/client'
import { defaultContract } from '../../src/auth/contract'
import type { TokenStorage } from '../../src/auth/storage'

function storage(): TokenStorage {
  return {
    getToken: vi.fn(async () => 'access'),
    setToken: vi.fn(async () => undefined),
    clearToken: vi.fn(async () => undefined),
    getRefreshToken: vi.fn(async () => 'refresh'),
    setRefreshToken: vi.fn(async () => undefined),
    clearRefreshToken: vi.fn(async () => undefined),
  }
}

function client(tokens = storage()): ApiClient {
  return new ApiClient({
    baseUrl: 'https://api.example.test',
    tokenStorage: tokens,
    contract: defaultContract('https://api.example.test'),
  })
}

describe('ApiClient', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('requires secure origins and API-relative paths', async () => {
    expect(
      () =>
        new ApiClient({
          baseUrl: 'http://api.example.test',
          tokenStorage: storage(),
          contract: defaultContract('http://api.example.test'),
        }),
    ).toThrow('HTTPS')
    await expect(client().get('https://evil.test/data')).rejects.toThrow('relative')
    await expect(client().get('//evil.test/data')).rejects.toThrow('relative')
  })

  it('prevents callers from overriding the managed authentication header', async () => {
    const contract = defaultContract('https://api.example.test')
    await expect(
      client().get('/data', { headers: { [contract.headers.userToken]: 'attacker' } }),
    ).rejects.toThrow('managed')
  })

  it('coalesces refresh and retries with the rotated token', async () => {
    const tokens = storage()
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: 'rotated' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
    await expect(client(tokens).get('/data')).resolves.toEqual({ ok: true })
    expect(tokens.setToken).toHaveBeenCalledWith('rotated')
    const retried = fetchMock.mock.calls[2]![1]!.headers as Headers
    expect(retried.get(defaultContract('https://api.example.test').headers.userToken)).toBe(
      'rotated',
    )
  })

  it('parses and caps Retry-After on API errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'busy', code: 'rate_limit' }), {
        status: 429,
        headers: { 'content-type': 'application/json', 'retry-after': '999999' },
      }),
    )
    const error = await client()
      .get('/data')
      .catch((cause: unknown) => cause)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 429, code: 'rate_limit', retryAfterMs: 86_400_000 })
  })
})
