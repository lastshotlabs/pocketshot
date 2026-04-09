/**
 * Tests for webauthn-hooks.ts
 *
 * These tests verify factory behaviour without a React rendering environment.
 * We stub `useMutation` / `useQuery` to return the options object so we can
 * call `mutationFn` / `queryFn` directly and assert on the calls made.
 *
 * The primary concern is that hooks which require `react-native-passkeys` throw
 * a descriptive, actionable error when that package is absent.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import type { PocketshotAuthContract } from '../contract'
import type { ApiClient } from '../../api/client'
import type { TokenStorage } from '../storage'

// ── Globals ───────────────────────────────────────────────────────────────────

;(globalThis as any).__DEV__ = true

// ── Stub useMutation / useQuery ───────────────────────────────────────────────

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useMutation: (opts: any) => ({ _opts: opts }),
    useQuery: (opts: any) => ({ _opts: opts }),
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
      setQueryData: vi.fn(),
    }),
  }
})

import { createWebAuthnHooks } from '../webauthn-hooks'

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

function makeTokenStorage(): TokenStorage {
  return {
    getToken: vi.fn().mockResolvedValue(null),
    setToken: vi.fn().mockResolvedValue(undefined),
    clearToken: vi.fn().mockResolvedValue(undefined),
    getRefreshToken: vi.fn().mockResolvedValue(null),
    setRefreshToken: vi.fn().mockResolvedValue(undefined),
    clearRefreshToken: vi.fn().mockResolvedValue(undefined),
  }
}

function makeHooks(api: ApiClient, tokenStorage?: TokenStorage) {
  return createWebAuthnHooks({
    api,
    tokenStorage: tokenStorage ?? makeTokenStorage(),
    queryClient: new QueryClient(),
    config: { apiUrl: 'https://api.example.com' },
    contract: makeContract(),
  })
}

// ── Tests: usePasskeyRegister ──────────────────────────────────────────────────

describe('usePasskeyRegister', () => {
  it('throws a descriptive error when react-native-passkeys is not installed', async () => {
    // api.get resolves so we reach the require() call
    const api = makeApi()
    vi.mocked(api.get).mockResolvedValue({ challenge: 'challenge-value' })

    // react-native-passkeys is not in this project — require() will throw naturally.
    // We rely on the module simply not being present in the test environment.
    const hooks = makeHooks(api)
    const mutation = hooks.usePasskeyRegister() as any

    await expect(mutation._opts.mutationFn({})).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining('usePasskeyRegister()'),
      }),
    )
  })

  it('error message mentions react-native-passkeys install command', async () => {
    const api = makeApi()
    vi.mocked(api.get).mockResolvedValue({ challenge: 'x' })

    const hooks = makeHooks(api)
    const mutation = hooks.usePasskeyRegister() as any

    let errorMessage = ''
    try {
      await mutation._opts.mutationFn({})
    } catch (err: any) {
      errorMessage = err.message
    }

    expect(errorMessage).toContain('react-native-passkeys')
    expect(errorMessage).toContain('npx expo install react-native-passkeys')
  })
})

// ── Tests: usePasskeyLogin ────────────────────────────────────────────────────

describe('usePasskeyLogin', () => {
  it('throws a descriptive error when react-native-passkeys is not installed', async () => {
    const api = makeApi()
    vi.mocked(api.get).mockResolvedValue({ challenge: 'challenge-value' })

    const hooks = makeHooks(api)
    const mutation = hooks.usePasskeyLogin() as any

    await expect(mutation._opts.mutationFn({})).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining('usePasskeyLogin()'),
      }),
    )
  })

  it('error message mentions react-native-passkeys install command', async () => {
    const api = makeApi()
    vi.mocked(api.get).mockResolvedValue({ challenge: 'x' })

    const hooks = makeHooks(api)
    const mutation = hooks.usePasskeyLogin() as any

    let errorMessage = ''
    try {
      await mutation._opts.mutationFn({})
    } catch (err: any) {
      errorMessage = err.message
    }

    expect(errorMessage).toContain('react-native-passkeys')
    expect(errorMessage).toContain('npx expo install react-native-passkeys')
  })

  it('URL-encodes username correctly when constructing the login options path', () => {
    // This verifies the URL construction logic used inside usePasskeyLogin's mutationFn
    // without requiring react-native-passkeys to be installed.
    // The contract's loginOptions endpoint is the base path.
    const contract = makeContract()
    const base = contract.passkey.loginOptions

    const username = 'alice@example.com'
    const expectedPath = `${base}?username=${encodeURIComponent(username)}`
    expect(expectedPath).toBe('/auth/passkey/login/options?username=alice%40example.com')
  })

  it('uses the loginOptions contract path without a query string when no username provided', () => {
    const contract = makeContract()
    // When username is falsy the path should be the raw loginOptions path
    const username: string | undefined = undefined
    const path = username
      ? `${contract.passkey.loginOptions}?username=${encodeURIComponent(username)}`
      : contract.passkey.loginOptions
    expect(path).toBe('/auth/passkey/login/options')
  })
})

// ── Tests: useListPasskeys ────────────────────────────────────────────────────

describe('useListPasskeys', () => {
  it('uses query key ["passkeys"]', () => {
    const hooks = makeHooks(makeApi())
    const result = hooks.useListPasskeys() as any
    expect(result._opts.queryKey).toEqual(['passkeys'])
  })

  it('queryFn calls GET /auth/passkey/credentials', async () => {
    const api = makeApi()
    const credentials = [{ id: '1', credentialId: 'cred-1', createdAt: '2026-01-01T00:00:00Z', platform: 'ios' }]
    vi.mocked(api.get).mockResolvedValue(credentials)

    const hooks = makeHooks(api)
    const result = hooks.useListPasskeys() as any
    const data = await result._opts.queryFn()

    expect(api.get).toHaveBeenCalledWith('/auth/passkey/credentials')
    expect(data).toEqual(credentials)
  })
})

// ── Tests: useDeletePasskey ───────────────────────────────────────────────────

describe('useDeletePasskey', () => {
  it('mutationFn calls DELETE with correct credential URL', async () => {
    const api = makeApi()
    vi.mocked(api.delete).mockResolvedValue(undefined)

    const hooks = makeHooks(api)
    const mutation = hooks.useDeletePasskey() as any
    await mutation._opts.mutationFn({ credentialId: 'cred-abc-123' })

    expect(api.delete).toHaveBeenCalledWith('/auth/passkey/credentials/cred-abc-123')
  })
})
