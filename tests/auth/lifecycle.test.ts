import { describe, expect, it, vi } from 'vitest'
import { AccountAuthController, type AccountAuthTransport } from '../../src/auth/lifecycle'
import type { TokenStorage } from '../../src/auth/storage'

function storage(initial?: { access?: string; refresh?: string }) {
  let access = initial?.access ?? null
  let refresh = initial?.refresh ?? null
  const value: TokenStorage = {
    getToken: async () => access,
    setToken: async (token) => {
      access = token
    },
    clearToken: async () => {
      access = null
    },
    getRefreshToken: async () => refresh,
    setRefreshToken: async (token) => {
      refresh = token
    },
    clearRefreshToken: async () => {
      refresh = null
    },
  }
  return value
}

const result = {
  user: { id: 'user-1', email: 'alex@example.com', emailVerified: true },
  accessToken: 'access',
  refreshToken: 'refresh',
}

function transport(): AccountAuthTransport {
  return {
    register: vi.fn(async (input) => ({
      user: {
        id: 'pending',
        email: input.email,
        emailVerified: false,
      },
      verificationRequired: true,
    })),
    verifyEmail: vi.fn(async () => result),
    login: vi.fn(async () => result),
    exchangeOAuth: vi.fn(async () => result),
    restore: vi.fn(async () => result),
    logout: vi.fn(async () => undefined),
    forgotPassword: vi.fn(async () => undefined),
    resetPassword: vi.fn(async () => undefined),
  }
}

describe('AccountAuthController', () => {
  it('registers, verifies email, persists tokens, and logs out', async () => {
    const tokens = storage()
    const auth = new AccountAuthController(transport(), tokens)
    await auth.register({ email: 'Alex@Example.com', password: 'password' })
    expect(auth.snapshot).toMatchObject({
      status: 'verification-required',
      pendingEmail: 'alex@example.com',
    })
    await auth.verifyEmail('123456')
    expect(auth.snapshot).toMatchObject({
      status: 'authenticated',
      user: { id: 'user-1', emailVerified: true },
    })
    expect(await tokens.getToken()).toBe('access')
    await auth.logout()
    expect(auth.snapshot.status).toBe('anonymous')
    expect(await tokens.getToken()).toBeNull()
  })

  it('handles password and OAuth authentication plus recovery', async () => {
    const api = transport()
    const auth = new AccountAuthController(api, storage())
    await auth.login('alex@example.com', 'password')
    expect(auth.snapshot.status).toBe('authenticated')
    await auth.completeOAuth('google', 'code', 'pocketshot://oauth')
    expect(api.exchangeOAuth).toHaveBeenCalled()
    await auth.forgotPassword('alex@example.com')
    expect(auth.snapshot.pendingEmail).toBe('alex@example.com')
    await auth.resetPassword('reset-token', 'new-password')
    expect(auth.snapshot.status).toBe('anonymous')
  })

  it('restores valid sessions and clears invalid secure storage', async () => {
    const valid = new AccountAuthController(transport(), storage({ access: 'old' }))
    expect(await valid.restore()).toBe(true)
    const invalidTransport = transport()
    invalidTransport.restore = async () => {
      throw new Error('revoked')
    }
    const tokens = storage({ access: 'revoked', refresh: 'revoked-refresh' })
    const invalid = new AccountAuthController(invalidTransport, tokens)
    expect(await invalid.restore()).toBe(false)
    expect(await tokens.getToken()).toBeNull()
    expect(await tokens.getRefreshToken()).toBeNull()
  })

  it('surfaces authentication errors without storing credentials', async () => {
    const api = transport()
    api.login = async () => {
      throw new Error('invalid credentials')
    }
    const tokens = storage()
    const auth = new AccountAuthController(api, tokens)
    await expect(auth.login('alex@example.com', 'password')).rejects.toThrow('invalid')
    expect(auth.snapshot).toMatchObject({ status: 'error', error: 'invalid credentials' })
    expect(await tokens.getToken()).toBeNull()
  })
})
