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
export type {
  PocketshotAuthContract,
  PocketshotAuthContractConfig,
  PocketshotAuthEndpoints,
  PocketshotPasskeyEndpoints,
} from './auth/contract'
export { formatAuthError, createAuthErrorFormatter } from './auth/errors'
export type { AuthErrorConfig, AuthErrorContext } from './auth/errors'

// ── MFA types ─────────────────────────────────────────────────────────────────
export type { MfaRecoveryCodes } from './auth/mfa-hooks'

// ── OAuth hooks — new names ────────────────────────────────────────────────────
// (re-exported from hooks.ts which already spreads createOAuthHooks)

// ── WebAuthn / passkey types ──────────────────────────────────────────────────
export type {
  PasskeyCredential,
  PasskeyRegisterVars,
  PasskeyLoginVars,
} from './auth/webauthn-hooks'

// ── Community ─────────────────────────────────────────────────────────────────
export { communityContract } from './community/contract'
export type {
  ContainerResponse,
  CreateContainerBody,
  UpdateContainerBody,
  ThreadResponse,
  CreateThreadBody,
  UpdateThreadBody,
  ReplyResponse,
  CreateReplyBody,
  UpdateReplyBody,
  ReactionBody,
  ReportBody,
  ReportResponse,
  ResolveReportBody,
  BanBody,
  BanResponse,
  BanCheckResponse,
  PaginatedResponse,
  CommunitySearchParams,
  SearchResponse,
  NotificationResponse,
  ListParams,
  ThreadListParams,
  ReplyListParams,
} from './community/types'
export { createCommunityHooks } from './community/hooks'
export type { CommunityHooks } from './community/hooks'

// ── SSE ───────────────────────────────────────────────────────────────────────
export { SseManager, createSseHooks } from './sse/index'
export type { SseHooks } from './sse/index'

// ── Webhooks ──────────────────────────────────────────────────────────────────
export { webhooksContract } from './webhooks/contract'
export type {
  WebhookEndpointResponse,
  CreateWebhookEndpointBody,
  UpdateWebhookEndpointBody,
  WebhookDeliveryResponse,
  WebhookEndpointParams,
  WebhookDeliveryListParams,
  TestWebhookBody,
} from './webhooks/types'
export { createWebhookHooks } from './webhooks/hooks'
export type { WebhookHooks } from './webhooks/hooks'

// ── Haptics ───────────────────────────────────────────────────────────────────
export { haptics, impact, notification, selection, useHaptics } from './haptics/index'
export type { ImpactStyle, NotificationType, HapticOptions } from './haptics/index'

// ── Device ────────────────────────────────────────────────────────────────────
export { getDeviceInfo, createDeviceHooks } from './device/index'
export type {
  DeviceHooks,
  DeviceInfo,
  DeviceRegistrationPayload,
  DeviceRegistrationResponse,
} from './device/index'

// ── Biometrics ────────────────────────────────────────────────────────────────
export {
  checkBiometricAvailability,
  promptBiometric,
  useBiometricAvailability,
  useBiometricAuth,
  useBiometricGate,
} from './biometrics/index'
export type {
  BiometricAuthResult,
  BiometricAvailability,
  BiometricPromptOptions,
} from './biometrics/index'
