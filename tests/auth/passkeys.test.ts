import { describe, expect, it, vi } from 'vitest'
import {
  PasskeyLifecycleController,
  type PasskeyAuthenticator,
  type PasskeyTransport,
  type TokenStorage,
} from '../../src/auth'

function fixture() {
  let token: string | null = null
  let refreshToken: string | null = null
  const credential = {
    id: 'server-passkey-1',
    credentialId: 'credential-1',
    name: 'Phone',
    createdAt: '2026-07-25T12:00:00.000Z',
    platform: 'ios' as const,
  }
  const transport: PasskeyTransport = {
    registrationOptions: vi.fn(async () => ({ challenge: 'register' })),
    verifyRegistration: vi.fn(async () => credential),
    loginOptions: vi.fn(async () => ({ challenge: 'login' })),
    verifyLogin: vi.fn(async () => ({
      user: {
        id: 'user-1',
        email: 'alex@example.com',
        emailVerified: true,
        displayName: 'Alex',
      },
      accessToken: 'access',
      refreshToken: 'refresh',
    })),
    list: vi.fn(async () => [credential, credential]),
    remove: vi.fn(async () => undefined),
  }
  const authenticator: PasskeyAuthenticator = {
    create: vi.fn(async () => ({ rawId: 'created' })),
    get: vi.fn(async () => ({ rawId: 'asserted' })),
  }
  const storage: TokenStorage = {
    getToken: async () => token,
    setToken: async (value) => {
      token = value
    },
    clearToken: async () => {
      token = null
    },
    getRefreshToken: async () => refreshToken,
    setRefreshToken: async (value) => {
      refreshToken = value
    },
    clearRefreshToken: async () => {
      refreshToken = null
    },
  }
  return {
    controller: new PasskeyLifecycleController(transport, authenticator, storage),
    transport,
    authenticator,
    storage,
  }
}

describe('PasskeyLifecycleController', () => {
  it('registers, deduplicates, lists, and removes verified credentials', async () => {
    const { controller, transport, authenticator } = fixture()
    await controller.register(' Phone ', 'ios')
    await controller.refresh()
    expect(authenticator.create).toHaveBeenCalledWith({ challenge: 'register' })
    expect(transport.verifyRegistration).toHaveBeenCalledWith({
      credential: { rawId: 'created' },
      name: 'Phone',
      platform: 'ios',
    })
    expect(controller.snapshot.credentials).toHaveLength(1)
    await controller.remove('credential-1')
    expect(controller.snapshot.credentials).toEqual([])
  })

  it('verifies login before storing tokens and exposes the authenticated identity', async () => {
    const { controller, storage } = fixture()
    await controller.login(' alex ')
    expect(controller.snapshot).toMatchObject({
      status: 'authenticated',
      user: { id: 'user-1', email: 'alex@example.com' },
    })
    expect(await storage.getToken()).toBe('access')
    expect(await storage.getRefreshToken()).toBe('refresh')
  })

  it('surfaces authenticator cancellation without storing a session', async () => {
    const { controller, authenticator, storage } = fixture()
    vi.mocked(authenticator.get).mockResolvedValueOnce(null)
    await expect(controller.login()).rejects.toThrow('assertion')
    expect(controller.snapshot).toMatchObject({ status: 'error', error: expect.any(String) })
    expect(await storage.getToken()).toBeNull()
  })
})
