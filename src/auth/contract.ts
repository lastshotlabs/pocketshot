// ── Types ─────────────────────────────────────────────────────────────────────

/** All fixed-path API endpoints used by the auth module. */
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

/** Passkey / WebAuthn endpoint configuration. */
export interface PocketshotPasskeyEndpoints {
  /** Endpoint to fetch WebAuthn registration options. */
  registerOptions: string
  /** Endpoint to verify and store a new WebAuthn credential. */
  registerVerify: string
  /** Endpoint to fetch WebAuthn authentication options. */
  loginOptions: string
  /** Endpoint to verify a WebAuthn authentication assertion. */
  loginVerify: string
  /** Endpoint to list all registered passkeys for the current user. */
  list: string
  /** Returns the endpoint to delete the passkey with the given credential ID. */
  delete: (credentialId: string) => string
}

/** HTTP header names used by the auth module. */
export interface PocketshotAuthHeaders {
  userToken: string
}

/** Full resolved auth contract consumed by hooks and the API client. */
export interface PocketshotAuthContract {
  endpoints: PocketshotAuthEndpoints
  passkey: PocketshotPasskeyEndpoints
  sessionRevoke: (id: string) => string
  oauthUrl: (provider: string) => string
  oauthLinkUrl: (provider: string) => string
  oauthUnlink: (provider: string) => string
  headers: PocketshotAuthHeaders
}

/** Partial override config accepted by `createPocketshot` to customise the contract. */
export interface PocketshotAuthContractConfig {
  endpoints?: Partial<PocketshotAuthEndpoints>
  passkey?: Partial<Omit<PocketshotPasskeyEndpoints, 'delete'>> & {
    delete?: (credentialId: string) => string
  }
  sessionRevoke?: (id: string) => string
  oauthUrl?: (provider: string) => string
  oauthLinkUrl?: (provider: string) => string
  oauthUnlink?: (provider: string) => string
  headers?: Partial<PocketshotAuthHeaders>
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Returns the default auth contract for the given API base URL.
 * All endpoint paths follow Pocketshot server conventions.
 *
 * @param apiUrl - The base URL of the Pocketshot API, e.g. `"https://api.example.com"`.
 */
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
    passkey: {
      registerOptions: '/auth/passkey/register/options',
      registerVerify: '/auth/passkey/register/verify',
      loginOptions: '/auth/passkey/login/options',
      loginVerify: '/auth/passkey/login/verify',
      list: '/auth/passkey/credentials',
      delete: (credentialId) => `/auth/passkey/credentials/${credentialId}`,
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

/**
 * Merges a partial contract config on top of the defaults for the given API URL.
 * Any omitted fields fall back to the Pocketshot defaults.
 *
 * @param apiUrl  - The base URL of the Pocketshot API.
 * @param partial - Optional overrides for endpoints, helpers, or headers.
 */
export function mergeContract(
  apiUrl: string,
  partial?: PocketshotAuthContractConfig,
): PocketshotAuthContract {
  const def = defaultContract(apiUrl)
  if (!partial) return def
  return {
    endpoints: { ...def.endpoints, ...partial.endpoints },
    passkey: { ...def.passkey, ...partial.passkey } as PocketshotPasskeyEndpoints,
    sessionRevoke: partial.sessionRevoke ?? def.sessionRevoke,
    oauthUrl: partial.oauthUrl ?? def.oauthUrl,
    oauthLinkUrl: partial.oauthLinkUrl ?? def.oauthLinkUrl,
    oauthUnlink: partial.oauthUnlink ?? def.oauthUnlink,
    headers: { ...def.headers, ...partial.headers },
  }
}
