import { describe, expect, it } from 'vitest'
import { normalizeOAuthSystemPath, parseOAuthCallback } from '../../src/auth/oauth-routing'

describe('native OAuth callback routing', () => {
  it('normalizes allowlisted schemes/providers and retains only OAuth response fields', () => {
    expect(
      normalizeOAuthSystemPath(
        'hitshot://oauth/apple?code=abc&state=nonce&token=secret&next=https://evil.test',
        ['hitshot', 'pocketshot-party'],
      ),
    ).toBe('/oauth/apple?code=abc&state=nonce')
    expect(
      normalizeOAuthSystemPath(
        'pocketshot-party://oauth/google?error=access_denied&error_description=Cancelled',
        ['hitshot', 'pocketshot-party'],
      ),
    ).toBe('/oauth/google?error=access_denied&error_description=Cancelled')
  })

  it('leaves unrelated or unsupported routes untouched', () => {
    expect(normalizeOAuthSystemPath('hitshot://join/HIT-427', ['hitshot'])).toBe(
      'hitshot://join/HIT-427',
    )
    expect(normalizeOAuthSystemPath('hitshot://oauth/unknown?code=x', ['hitshot'])).toBe(
      'hitshot://oauth/unknown?code=x',
    )
  })

  it('parses scalar/array router parameters and rejects unknown providers', () => {
    expect(
      parseOAuthCallback(['google'], { code: ['abc'], state: 'nonce', token: 'ignored' }),
    ).toEqual({
      provider: 'google',
      code: 'abc',
      state: 'nonce',
      error: null,
      errorDescription: null,
    })
    expect(parseOAuthCallback('github', { code: 'abc' })).toBeNull()
  })
})
