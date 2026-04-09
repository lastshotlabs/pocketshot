/**
 * Tests for mfa-hooks.ts
 *
 * These tests verify factory behaviour without a React rendering environment.
 * The hook factories are closures — we test their mutation functions directly
 * by extracting the `mutationFn` passed to `useMutation`, mocking the API
 * client, and asserting on the calls made and data returned.
 *
 * For `useMfaRecoveryCodes` we verify the query key and that `queryFn` calls
 * the correct endpoint.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import type { PocketshotAuthContract } from '../contract'
import type { ApiClient } from '../../api/client'

// ── Globals ───────────────────────────────────────────────────────────────────

;(globalThis as any).__DEV__ = true

// ── Stub useMutation / useQuery so the factories can be called outside React ──

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    // Capture the options and return them so we can inspect mutationFn / queryFn
    useMutation: (opts: any) => ({ _opts: opts }),
    useQuery: (opts: any) => ({ _opts: opts }),
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
    }),
  }
})

import { createMfaHooks } from '../mfa-hooks'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeContract(): PocketshotAuthContract {
  return {
    endpoints: {
      me: '/auth/me',
      login: '/auth/login',
      logout: '/auth/logout',
      register: '/auth/register',
      forgotPassword: '/auth/forgot-password',
      refresh: '/auth/refresh',
      resetPassword: '/auth/reset-password',
      verifyEmail: '/auth/verify-email',
      resendVerification: '/auth/resend-verification',
      setPassword: '/auth/set-password',
      deleteAccount: '/auth/me',
      cancelDeletion: '/auth/cancel-deletion',
      sessions: '/auth/sessions',
      mfaVerify: '/auth/mfa/verify',
      mfaSetup: '/auth/mfa/setup',
      mfaVerifySetup: '/auth/mfa/verify-setup',
      mfaDisable: '/auth/mfa',
      mfaRecoveryCodes: '/auth/mfa/recovery-codes',
      mfaEmailOtpEnable: '/auth/mfa/email-otp/enable',
      mfaEmailOtpVerifySetup: '/auth/mfa/email-otp/verify-setup',
      mfaEmailOtpDisable: '/auth/mfa/email-otp',
      mfaResend: '/auth/mfa/resend',
      mfaMethods: '/auth/mfa/methods',
      oauthExchange: '/auth/oauth/exchange',
    },
    passkey: {
      registerOptions: '/auth/passkey/register/options',
      registerVerify: '/auth/passkey/register/verify',
      loginOptions: '/auth/passkey/login/options',
      loginVerify: '/auth/passkey/login/verify',
      list: '/auth/passkey/credentials',
      delete: (id) => `/auth/passkey/credentials/${id}`,
    },
    sessionRevoke: (id) => `/auth/sessions/${id}`,
    oauthUrl: (p) => `https://api.example.com/auth/${p}`,
    oauthLinkUrl: (p) => `https://api.example.com/auth/${p}/link`,
    oauthUnlink: (p) => `/auth/${p}/link`,
    headers: { userToken: 'x-user-token' },
  }
}

function makeApi(): ApiClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    fetch: vi.fn(),
  } as unknown as ApiClient
}

function makeHooks(api: ApiClient) {
  return createMfaHooks({
    api,
    queryClient: new QueryClient(),
    config: { apiUrl: 'https://api.example.com' },
    contract: makeContract(),
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useMfaRecoveryCodes', () => {
  it('uses query key ["mfa", "recovery-codes"]', () => {
    const hooks = makeHooks(makeApi())
    const result = hooks.useMfaRecoveryCodes() as any
    expect(result._opts.queryKey).toEqual(['mfa', 'recovery-codes'])
  })

  it('queryFn calls GET /auth/mfa/recovery-codes', async () => {
    const api = makeApi()
    const expected = { codes: ['a1', 'b2'], generatedAt: '2026-04-08T00:00:00Z' }
    vi.mocked(api.get).mockResolvedValue(expected)

    const hooks = makeHooks(api)
    const result = hooks.useMfaRecoveryCodes() as any
    const data = await result._opts.queryFn()

    expect(api.get).toHaveBeenCalledWith('/auth/mfa/recovery-codes')
    expect(data).toEqual(expected)
  })
})

describe('useMfaSetup', () => {
  let api: ApiClient

  beforeEach(() => {
    api = makeApi()
  })

  it('mutationFn posts to /auth/mfa/setup with empty body', async () => {
    const setupResult = { secret: 'S', qrCodeUrl: 'https://qr', recoveryCodes: ['rc1'] }
    vi.mocked(api.post).mockResolvedValue(setupResult)

    const hooks = makeHooks(api)
    const mutation = hooks.useMfaSetup() as any
    const data = await mutation._opts.mutationFn()

    expect(api.post).toHaveBeenCalledWith('/auth/mfa/setup', {})
    expect(data).toEqual(setupResult)
  })

  it('propagates API errors', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('MFA already enabled'))

    const hooks = makeHooks(api)
    const mutation = hooks.useMfaSetup() as any

    await expect(mutation._opts.mutationFn()).rejects.toThrow('MFA already enabled')
  })
})

describe('useMfaVerifySetup', () => {
  it('mutationFn posts code to /auth/mfa/verify-setup', async () => {
    const api = makeApi()
    vi.mocked(api.post).mockResolvedValue(undefined)

    const hooks = makeHooks(api)
    const mutation = hooks.useMfaVerifySetup() as any
    await mutation._opts.mutationFn({ code: '123456' })

    expect(api.post).toHaveBeenCalledWith('/auth/mfa/verify-setup', { code: '123456' })
  })
})

describe('useMfaDisable', () => {
  it('mutationFn calls DELETE /auth/mfa with code', async () => {
    const api = makeApi()
    vi.mocked(api.delete).mockResolvedValue(undefined)

    const hooks = makeHooks(api)
    const mutation = hooks.useMfaDisable() as any
    await mutation._opts.mutationFn({ code: '654321' })

    expect(api.delete).toHaveBeenCalledWith('/auth/mfa', { code: '654321' })
  })
})

describe('useMfaResend', () => {
  it('mutationFn posts to /auth/mfa/resend', async () => {
    const api = makeApi()
    vi.mocked(api.post).mockResolvedValue(undefined)

    const hooks = makeHooks(api)
    const mutation = hooks.useMfaResend() as any
    await mutation._opts.mutationFn()

    expect(api.post).toHaveBeenCalledWith('/auth/mfa/resend', {})
  })
})

describe('useMfaMethods', () => {
  it('uses query key ["mfa", "methods"]', () => {
    const hooks = makeHooks(makeApi())
    const result = hooks.useMfaMethods() as any
    expect(result._opts.queryKey).toEqual(['mfa', 'methods'])
  })

  it('queryFn calls GET /auth/mfa/methods', async () => {
    const api = makeApi()
    vi.mocked(api.get).mockResolvedValue([{ type: 'totp', enabled: true }])

    const hooks = makeHooks(api)
    const result = hooks.useMfaMethods() as any
    const data = await result._opts.queryFn()

    expect(api.get).toHaveBeenCalledWith('/auth/mfa/methods')
    expect(data).toEqual([{ type: 'totp', enabled: true }])
  })
})
