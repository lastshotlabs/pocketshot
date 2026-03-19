export { createPocketshot } from './create-pocketshot'
export type { PocketshotConfig } from './create-pocketshot'
export { createSecureStoreStorage } from './auth/storage'
export type { TokenStorage } from './auth/storage'
export { ApiClient, ApiError } from './api/client'
export { PocketshotWS, createWsHooks } from './ws/index'
export { createAuthHooks } from './auth/hooks'
export type {
  AuthUser,
  MfaChallenge,
  MfaMethod,
  LoginResult,
  SessionInfo,
  MfaSetupResult,
} from './auth/hooks'
export { mergeContract, defaultContract } from './auth/contract'
export type { PocketshotAuthContract, PocketshotAuthContractConfig, PocketshotAuthEndpoints } from './auth/contract'
export { formatAuthError, createAuthErrorFormatter } from './auth/errors'
export type { AuthErrorConfig, AuthErrorContext } from './auth/errors'
