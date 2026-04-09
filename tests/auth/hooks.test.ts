import { describe, it, expect, vi } from 'vitest'

// Mock all native/expo deps
vi.mock('expo-router', () => ({ useRouter: vi.fn(() => ({ replace: vi.fn() })) }))
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}))
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false })),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn(), clear: vi.fn() })),
  QueryClient: vi.fn(() => ({ defaultOptions: {} })),
  QueryClientProvider: vi.fn(),
}))
vi.mock('jotai', () => ({
  atom: vi.fn(() => ({})),
  useAtom: vi.fn(() => [null, vi.fn()]),
  Provider: vi.fn(),
}))
vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return actual
})

import { createAuthHooks } from '../../src/auth/hooks'
import { createSecureStoreStorage } from '../../src/auth/storage'
import { ApiClient } from '../../src/api/client'
import { defaultContract } from '../../src/auth/contract'
import { QueryClient } from '@tanstack/react-query'

describe('createAuthHooks factory shape', () => {
  const tokenStorage = createSecureStoreStorage('test_key')
  const contract = defaultContract('http://localhost:3000')
  const api = new ApiClient({ baseUrl: 'http://localhost:3000', tokenStorage, contract })
  const queryClient = new QueryClient()
  const config = { apiUrl: 'http://localhost:3000' }
  const hooks = createAuthHooks({ api, tokenStorage, queryClient, config, contract })

  const expectedHooks = [
    'useUser',
    'useLogin',
    'useRegister',
    'useLogout',
    'useVerifyMfa',
    'useExchangeOAuthCode',
    'useForgotPassword',
    'useResetPassword',
    'useVerifyEmail',
    'useResendVerification',
    'useSetPassword',
    'useSessions',
    'useRevokeSession',
    'useDeleteAccount',
    'useCancelDeletion',
    'useMfaSetup',
    'useMfaVerifySetup',
    'useMfaDisable',
    'useMfaMethods',
    'useMfaResend',
    'useEmailOtpEnable',
    'useEmailOtpVerifySetup',
    'useMfaEmailOtpDisable',
    'useOAuthUnlink',
  ]

  for (const hookName of expectedHooks) {
    it(`returns ${hookName}`, () => {
      expect(hooks).toHaveProperty(hookName)
      expect(typeof (hooks as Record<string, unknown>)[hookName]).toBe('function')
    })
  }

  it('returns getOAuthUrl function', () => {
    expect(typeof hooks.getOAuthUrl).toBe('function')
  })

  it('returns getLinkUrl function', () => {
    expect(typeof hooks.getLinkUrl).toBe('function')
  })

  it('getOAuthUrl builds correct URL', () => {
    const url = hooks.getOAuthUrl('google', 'myapp://auth')
    expect(url).toBe('http://localhost:3000/auth/google?redirect_uri=myapp%3A%2F%2Fauth')
  })

  it('getLinkUrl builds correct URL', () => {
    const url = hooks.getLinkUrl('google')
    expect(url).toBe('http://localhost:3000/auth/google/link')
  })
})
