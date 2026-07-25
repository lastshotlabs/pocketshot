export { createPocketshot } from './create-pocketshot'
export type { PocketshotConfig } from './create-pocketshot'
export { createSecureStoreStorage } from './auth/storage'
export type { TokenStorage } from './auth/storage'
export { ApiClient, ApiError } from './api/client'
export { PocketshotWS, createWsHooks } from './ws/index'
export {
  RealtimeChannel,
  RealtimeReconciler,
  MemoryRealtimeStorage,
  createSQLiteRealtimeStorage,
  bindRealtimeLifecycle,
  createRealtimeChannel,
  createRealtimeEventSchema,
  createRealtimeSnapshotSchema,
} from './realtime/index'
export type {
  RealtimeChannelOptions,
  RealtimeChannelStorage,
  RealtimeConnectionState,
  RealtimeDiagnostics,
  RealtimeEvent,
  RealtimeSchemas,
  RealtimeSnapshot,
  RealtimeSocket,
  RealtimeSocketFactory,
  RealtimeStateListener,
  ReconcilerResult,
} from './realtime/index'
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

// ── Push notifications ────────────────────────────────────────────────────────
export { createPushHooks } from './push/index'
export type {
  PushHooks,
  PushPermissionStatus,
  PushPermissionResult,
  PushNotification,
  NotificationTapEvent,
  PushRegistrationOptions,
  PushTokenRegistrationPayload,
  PushTokenRegistrationResponse,
} from './push/index'

// ── Deep links ────────────────────────────────────────────────────────────────
export {
  parseDeepLink,
  matchPattern,
  useDeepLink,
  useDeepLinkRouter,
  createDeepLinkUrl,
} from './deep-links/index'
export type { ParsedDeepLink, DeepLinkRoute, DeepLinkRouterOptions } from './deep-links/index'

// ── Offline ───────────────────────────────────────────────────────────────────
export {
  OfflineQueue,
  checkNetworkStatus,
  useNetworkStatus,
  createOfflineHooks,
} from './offline/index'
export type {
  OfflineHooks,
  NetworkStatus,
  QueuedOperation,
  OfflineQueueOptions,
} from './offline/index'

// ── Share / Clipboard ─────────────────────────────────────────────────────────
export {
  share,
  shareFile,
  getClipboardString,
  setClipboardString,
  hasClipboardString,
  useShare,
  useClipboard,
} from './share/index'
export type { ShareContent, ShareOptions, ShareResult, ClipboardWriteOptions } from './share/index'

// ── Organizations ─────────────────────────────────────────────────────────────
export { defaultOrgContract, createOrgHooks } from './organizations/index'
export type {
  OrgHooks,
  OrgResponse,
  CreateOrgBody,
  UpdateOrgBody,
  OrgRole,
  OrgMember,
  InviteBody,
  InviteResponse,
  UpdateMemberRoleBody,
  OrgListParams,
  OrgMemberListParams,
  PaginatedOrgResponse,
} from './organizations/index'

// ── Permissions ───────────────────────────────────────────────────────────────
export { createPermissionHooks } from './permissions/index'
export type {
  PermissionHooks,
  Permission,
  Role,
  AccessClaims,
  PermissionCheckOptions,
  OrgPermissionCheckOptions,
} from './permissions/index'

// ── Search ────────────────────────────────────────────────────────────────────
export { createSearchHooks } from './search/index'
export type {
  SearchHooks,
  SearchResult,
  SearchParams,
  SearchResponse as GlobalSearchResponse,
  UseSearchOptions,
} from './search/index'

// ── Upload ────────────────────────────────────────────────────────────────────
export { createUploadHooks } from './upload/index'
export type {
  UploadHooks,
  UploadFile,
  UploadProgress,
  PresignedUploadResponse,
  UploadResult,
  PresignedUploadOptions,
  DirectUploadOptions,
} from './upload/index'

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
