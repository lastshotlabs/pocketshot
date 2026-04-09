import { describe, it, expect } from 'vitest'
import { defaultContract, mergeContract } from '../contract'

describe('defaultContract', () => {
  const contract = defaultContract('https://api.example.com')

  it('returns all required endpoint strings', () => {
    const { endpoints } = contract
    expect(endpoints.me).toBe('/auth/me')
    expect(endpoints.login).toBe('/auth/login')
    expect(endpoints.logout).toBe('/auth/logout')
    expect(endpoints.register).toBe('/auth/register')
    expect(endpoints.forgotPassword).toBe('/auth/forgot-password')
    expect(endpoints.refresh).toBe('/auth/refresh')
    expect(endpoints.resetPassword).toBe('/auth/reset-password')
    expect(endpoints.verifyEmail).toBe('/auth/verify-email')
    expect(endpoints.resendVerification).toBe('/auth/resend-verification')
    expect(endpoints.setPassword).toBe('/auth/set-password')
    expect(endpoints.deleteAccount).toBe('/auth/me')
    expect(endpoints.cancelDeletion).toBe('/auth/cancel-deletion')
    expect(endpoints.sessions).toBe('/auth/sessions')
    expect(endpoints.mfaVerify).toBe('/auth/mfa/verify')
    expect(endpoints.mfaSetup).toBe('/auth/mfa/setup')
    expect(endpoints.mfaVerifySetup).toBe('/auth/mfa/verify-setup')
    expect(endpoints.mfaDisable).toBe('/auth/mfa')
    expect(endpoints.mfaRecoveryCodes).toBe('/auth/mfa/recovery-codes')
    expect(endpoints.mfaEmailOtpEnable).toBe('/auth/mfa/email-otp/enable')
    expect(endpoints.mfaEmailOtpVerifySetup).toBe('/auth/mfa/email-otp/verify-setup')
    expect(endpoints.mfaEmailOtpDisable).toBe('/auth/mfa/email-otp')
    expect(endpoints.mfaResend).toBe('/auth/mfa/resend')
    expect(endpoints.mfaMethods).toBe('/auth/mfa/methods')
    expect(endpoints.oauthExchange).toBe('/auth/oauth/exchange')
  })

  it('includes all passkey endpoints', () => {
    const { passkey } = contract
    expect(passkey.registerOptions).toBe('/auth/passkey/register/options')
    expect(passkey.registerVerify).toBe('/auth/passkey/register/verify')
    expect(passkey.loginOptions).toBe('/auth/passkey/login/options')
    expect(passkey.loginVerify).toBe('/auth/passkey/login/verify')
    expect(passkey.list).toBe('/auth/passkey/credentials')
  })

  it('generates passkey delete URL from credential ID', () => {
    const { passkey } = contract
    expect(passkey.delete('cred-abc-123')).toBe('/auth/passkey/credentials/cred-abc-123')
  })

  it('generates sessionRevoke URL from session ID', () => {
    expect(contract.sessionRevoke('sess-xyz')).toBe('/auth/sessions/sess-xyz')
  })

  it('generates oauthUrl including base URL', () => {
    expect(contract.oauthUrl('google')).toBe('https://api.example.com/auth/google')
  })

  it('generates oauthLinkUrl including base URL', () => {
    expect(contract.oauthLinkUrl('github')).toBe('https://api.example.com/auth/github/link')
  })

  it('generates oauthUnlink URL for provider', () => {
    expect(contract.oauthUnlink('google')).toBe('/auth/google/link')
  })

  it('strips trailing slash from apiUrl', () => {
    const c = defaultContract('https://api.example.com/')
    expect(c.oauthUrl('google')).toBe('https://api.example.com/auth/google')
  })
})

describe('mergeContract', () => {
  it('returns default contract when no partial provided', () => {
    const def = defaultContract('https://api.example.com')
    const merged = mergeContract('https://api.example.com')
    expect(merged.endpoints.me).toBe(def.endpoints.me)
    expect(merged.passkey.list).toBe(def.passkey.list)
  })

  it('overrides specific endpoint strings', () => {
    const merged = mergeContract('https://api.example.com', {
      endpoints: { login: '/v2/auth/login' },
    })
    expect(merged.endpoints.login).toBe('/v2/auth/login')
    // Other endpoints remain default
    expect(merged.endpoints.me).toBe('/auth/me')
  })

  it('overrides specific passkey endpoints', () => {
    const merged = mergeContract('https://api.example.com', {
      passkey: { list: '/v2/passkeys' },
    })
    expect(merged.passkey.list).toBe('/v2/passkeys')
    // Other passkey endpoints remain default
    expect(merged.passkey.registerOptions).toBe('/auth/passkey/register/options')
  })

  it('overrides the passkey delete function', () => {
    const merged = mergeContract('https://api.example.com', {
      passkey: { delete: (id) => `/v2/credentials/${id}` },
    })
    expect(merged.passkey.delete('cred-42')).toBe('/v2/credentials/cred-42')
  })

  it('overrides session revoke helper', () => {
    const merged = mergeContract('https://api.example.com', {
      sessionRevoke: (id) => `/v2/sessions/${id}`,
    })
    expect(merged.sessionRevoke('s1')).toBe('/v2/sessions/s1')
  })

  it('merges headers', () => {
    const merged = mergeContract('https://api.example.com', {
      headers: { userToken: 'x-custom-token' },
    })
    expect(merged.headers.userToken).toBe('x-custom-token')
  })
})
