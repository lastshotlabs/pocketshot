// ── Types ─────────────────────────────────────────────────────────────────────

export interface PocketshotAuthEndpoints {
  me: string
  login: string
  logout: string
  register: string
  forgotPassword: string
  refresh: string
  resetPassword: string
  verifyEmail: string
  resendVerification: string
  setPassword: string
  deleteAccount: string
  cancelDeletion: string
  sessions: string
  mfaVerify: string
  mfaSetup: string
  mfaVerifySetup: string
  mfaDisable: string
  mfaRecoveryCodes: string
  mfaEmailOtpEnable: string
  mfaEmailOtpVerifySetup: string
  mfaEmailOtpDisable: string
  mfaResend: string
  mfaMethods: string
  oauthExchange: string
}

export interface PocketshotAuthHeaders {
  userToken: string
}

export interface PocketshotAuthContract {
  endpoints: PocketshotAuthEndpoints
  sessionRevoke: (id: string) => string
  oauthUrl: (provider: string) => string
  oauthLinkUrl: (provider: string) => string
  oauthUnlink: (provider: string) => string
  headers: PocketshotAuthHeaders
}

export interface PocketshotAuthContractConfig {
  endpoints?: Partial<PocketshotAuthEndpoints>
  sessionRevoke?: (id: string) => string
  oauthUrl?: (provider: string) => string
  oauthLinkUrl?: (provider: string) => string
  oauthUnlink?: (provider: string) => string
  headers?: Partial<PocketshotAuthHeaders>
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function defaultContract(apiUrl: string): PocketshotAuthContract {
  const base = apiUrl.replace(/\/$/, '')
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
    sessionRevoke: (id) => `/auth/sessions/${id}`,
    oauthUrl: (provider) => `${base}/auth/${provider}`,
    oauthLinkUrl: (provider) => `${base}/auth/${provider}/link`,
    oauthUnlink: (provider) => `/auth/${provider}/link`,
    headers: {
      userToken: 'x-user-token',
    },
  }
}

export function mergeContract(apiUrl: string, partial?: PocketshotAuthContractConfig): PocketshotAuthContract {
  const def = defaultContract(apiUrl)
  if (!partial) return def
  return {
    endpoints: { ...def.endpoints, ...partial.endpoints },
    sessionRevoke: partial.sessionRevoke ?? def.sessionRevoke,
    oauthUrl: partial.oauthUrl ?? def.oauthUrl,
    oauthLinkUrl: partial.oauthLinkUrl ?? def.oauthLinkUrl,
    oauthUnlink: partial.oauthUnlink ?? def.oauthUnlink,
    headers: { ...def.headers, ...partial.headers },
  }
}
