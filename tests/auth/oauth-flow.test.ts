import { describe, expect, it, vi } from 'vitest'
import { OAuthFlowController, createMemoryOAuthTransactionStorage } from '../../src/auth/oauth-flow'

const state = 'state-1234567890abcdef'
const verifier = 'v'.repeat(64)

function flow(now = () => 1000) {
  const exchange = vi.fn(async () => ({ accessToken: 'token' }))
  const controller = new OAuthFlowController({
    allowedProviders: ['apple', 'google'],
    allowedRedirectSchemes: ['hitshot', 'aicoach', 'sgforum', 'blankslate'],
    storage: createMemoryOAuthTransactionStorage(),
    createState: () => state,
    createVerifier: () => verifier,
    challenge: async () => 'challenge',
    now,
    transport: {
      authorizationUrl: ({ provider, state: value, codeChallenge }) =>
        `https://id.example/${provider}?state=${value}&code_challenge=${codeChallenge}`,
      exchange,
    },
  })
  return { controller, exchange }
}

describe('OAuthFlowController', () => {
  it('binds provider, redirect, state, and PKCE verifier through exchange', async () => {
    const { controller, exchange } = flow()
    await expect(controller.begin('apple', 'hitshot://oauth/apple')).resolves.toContain(
      'code_challenge=challenge',
    )
    await expect(
      controller.complete({ provider: 'apple', state, code: 'authorization-code' }),
    ).resolves.toEqual({ status: 'complete', result: { accessToken: 'token' } })
    expect(exchange).toHaveBeenCalledWith({
      provider: 'apple',
      redirectUri: 'hitshot://oauth/apple',
      code: 'authorization-code',
      verifier,
    })
  })

  it('rejects provider/state mismatch, replay, weak entropy, and expiry', async () => {
    const active = flow()
    await active.controller.begin('google', 'aicoach://oauth/google')
    await expect(
      active.controller.complete({ provider: 'google', state: 'wrong', code: 'code' }),
    ).rejects.toThrow('does not match')
    await active.controller.complete({ provider: 'google', state, code: 'code' })
    await expect(
      active.controller.complete({ provider: 'google', state, code: 'code' }),
    ).rejects.toThrow()

    let now = 0
    const expired = flow(() => now)
    await expired.controller.begin('apple', 'sgforum://oauth/apple')
    now = 11 * 60_000
    await expect(
      expired.controller.complete({ provider: 'apple', state, code: 'code' }),
    ).rejects.toThrow('expired')

    const weak = new OAuthFlowController({
      allowedProviders: ['apple'],
      allowedRedirectSchemes: ['app'],
      storage: createMemoryOAuthTransactionStorage(),
      createState: () => 'weak',
      createVerifier: () => 'weak',
      challenge: () => 'challenge',
      transport: { authorizationUrl: () => '', exchange: async () => ({}) },
    })
    await expect(weak.begin('apple', 'app://oauth/apple')).rejects.toThrow('entropy')
  })

  it('rejects unregistered redirect schemes and overlapping transactions', async () => {
    const { controller } = flow()
    await expect(controller.begin('apple', 'attacker://oauth/apple')).rejects.toThrow(
      'not allowlisted',
    )
    await controller.begin('apple', 'hitshot://oauth/apple')
    await expect(controller.begin('google', 'aicoach://oauth/google')).rejects.toThrow(
      'already pending',
    )
  })

  it('supports exact redirect URI binding and allowlisted HTTPS hosts', async () => {
    const exact = new OAuthFlowController({
      allowedProviders: ['apple'],
      allowedRedirectUris: ['hitshot://oauth/apple'],
      storage: createMemoryOAuthTransactionStorage(),
      createState: () => state,
      createVerifier: () => verifier,
      challenge: () => 'challenge',
      transport: {
        authorizationUrl: () => 'https://id.example/authorize',
        exchange: async () => ({}),
      },
    })
    await expect(exact.begin('apple', 'hitshot://oauth/google')).rejects.toThrow('exactly')
    await expect(exact.begin('apple', 'hitshot://oauth/apple')).resolves.toContain('id.example')

    const web = new OAuthFlowController({
      allowedProviders: ['google'],
      allowedRedirectHosts: ['links.example.test'],
      storage: createMemoryOAuthTransactionStorage(),
      createState: () => state,
      createVerifier: () => verifier,
      challenge: () => 'challenge',
      transport: {
        authorizationUrl: () => 'https://id.example/authorize',
        exchange: async () => ({}),
      },
    })
    await expect(web.begin('google', 'https://evil.test/oauth/google')).rejects.toThrow('host')
    await expect(web.begin('google', 'https://links.example.test/oauth/google')).resolves.toContain(
      'id.example',
    )
  })

  it('clears the pending transaction when the authorization endpoint is unsafe', async () => {
    const storage = createMemoryOAuthTransactionStorage()
    const unsafe = new OAuthFlowController({
      allowedProviders: ['apple'],
      allowedRedirectSchemes: ['hitshot'],
      storage,
      createState: () => state,
      createVerifier: () => verifier,
      challenge: () => 'challenge',
      transport: { authorizationUrl: () => 'http://id.example', exchange: async () => ({}) },
    })
    await expect(unsafe.begin('apple', 'hitshot://oauth/apple')).rejects.toThrow('unsafe')
    expect(await storage.get()).toBeNull()
  })

  it('returns cancellation without exchanging a code', async () => {
    const { controller, exchange } = flow()
    await controller.begin('apple', 'blankslate://oauth/apple')
    await expect(
      controller.complete({
        provider: 'apple',
        state,
        code: null,
        error: 'access_denied',
        errorDescription: 'User cancelled',
      }),
    ).resolves.toEqual({
      status: 'cancelled',
      error: 'access_denied',
      description: 'User cancelled',
    })
    expect(exchange).not.toHaveBeenCalled()
  })
})
