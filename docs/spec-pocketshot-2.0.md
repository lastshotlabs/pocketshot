# Pocketshot 2.0 — Full Enterprise Mobile SDK Specification

**Status:** Draft  
**Author:** Engineering  
**Date:** 2026-04-08  
**Scope:** @lastshotlabs/pocketshot — full parity with Snapshot plus native mobile enterprise capabilities

**Engineering rules:** [`CLAUDE.md`](../CLAUDE.md) and [`docs/engineering-rules.md`](./engineering-rules.md) — read before implementing any part of this spec.

---

## Table of Contents

1. [Vision](#1-vision)
2. [Architecture Principles](#2-architecture-principles)
3. [Slingshot Backend Requirements](#3-slingshot-backend-requirements)
4. [Phase 1 — SDK Core Parity](#4-phase-1--sdk-core-parity)
5. [Phase 2 — Native Mobile Modules](#5-phase-2--native-mobile-modules)
6. [Phase 3 — Organizations & Permissions](#6-phase-3--organizations--permissions)
7. [Phase 4 — File Upload & Media](#7-phase-4--file-upload--media)
8. [Phase 5 — UI Component Library](#8-phase-5--ui-component-library)
9. [Phase 6 — Config-Driven Manifest System](#9-phase-6--config-driven-manifest-system)
10. [Phase 7 — CLI Enhancements](#10-phase-7--cli-enhancements)
11. [Testing Strategy](#11-testing-strategy)
12. [Error Handling Architecture](#12-error-handling-architecture)
13. [Showcase App](#13-showcase-app)
14. [Definition of Done](#14-definition-of-done)
15. [Implementation Phases & Sequencing](#15-implementation-phases--sequencing)

---

## 1. Vision

Pocketshot is the React Native/Expo counterpart to Snapshot. Every app built on Slingshot should be shippable as a native iOS and Android app using Pocketshot — with zero compromise on capability.

**What this means in practice:**

- Every Slingshot backend feature has a Pocketshot hook or module.
- An enterprise mobile app — auth with biometrics, real-time collaboration, file uploads, push notifications, offline capability, deep linking, organization management — can be built entirely with Pocketshot primitives.
- Config-driven development works on mobile the same way it works on web. A manifest file describes screens, navigation, data bindings, and actions. The runtime renders it.
- The component library covers every interaction pattern a mobile app needs — not wrapped web components, but purpose-built React Native components that follow platform conventions.

**Non-goals:**

- Pocketshot is not a web framework. It does not target browsers, PWAs, or Capacitor.
- Pocketshot does not attempt feature-for-feature API surface identity with Snapshot. Where the platforms differ (CSS tokens vs StyleSheet, page routing vs stack navigation, service workers vs native push), Pocketshot implements the mobile-native equivalent.

---

## 2. Architecture Principles

Engineering rules are fully documented in [`CLAUDE.md`](../CLAUDE.md) and [`docs/engineering-rules.md`](./engineering-rules.md). Read both before implementing any part of this spec. The rules are non-negotiable.

Key principles for quick reference:

- **Factory pattern** — `createPocketshot(config)` is the only entry point. All hooks are closures.
- **Contract-driven** — All backend modules use a contract pattern. Override endpoints without rewriting clients.
- **Platform-native** — SecureStore not AsyncStorage, bottom sheets not CSS modals, expo-notifications not Web Push, Appearance API not CSS vars.
- **AppStateManager** — All foreground/background handling goes through one centralized manager.
- **Component file structure** — Every component is a directory with schema, component, types, index, tests.
- **Token system** — StyleSheet token objects, never raw values.
- **`src/ui/` boundary** — All config-driven UI lives here. No UI in SDK domain modules.
- **Two entry points** — `@lastshotlabs/pocketshot` (SDK) and `@lastshotlabs/pocketshot/ui` (UI).

---

## 3. Slingshot Backend Requirements

The following new Slingshot plugins are required to support the Pocketshot 2.0 feature set.

**Timing note:** Pocketshot SDK code for both features can be written before these plugins exist — the hooks just need the endpoint contract defined, and can be tested against mock endpoints. However:

- **`slingshot-native-push`** — must be deployed before end-to-end push delivery can be tested on a real device. Build in parallel with Phase B push work.
- **`slingshot-deep-links`** — must be deployed before Universal Links or App Links can be tested at all. Apple and Google resolve `.well-known/` files at the OS level before the app ever opens. Build this early — ideally before Phase B deep-link work starts.

Both plugins should be tracked as parallel workstreams in Slingshot, not as blockers gating Pocketshot Phase B.

### 3.1 `slingshot-native-push` (NEW PLUGIN)

**Purpose:** Native push notification delivery via Firebase Cloud Messaging (Android) and Apple Push Notification Service (iOS). Replaces or extends `slingshot-push` which only supports Web Push (VAPID).

**What it does:**
- Accepts device token registration from mobile clients (Expo push tokens or raw FCM/APN tokens)
- Sends push notifications to registered devices on configurable events
- Manages device token lifecycle (register, update, expire, unregister)
- Supports notification payload: title, body, data, badge count, sound, channel (Android)
- Integrates with Slingshot event bus — same pattern as `slingshot-push`

**New Routes:**
- `POST /push/native/register` — Register device token
- `DELETE /push/native/register/:token` — Unregister token
- `GET /push/native/devices` — List registered devices for current user
- `POST /push/native/send` — Admin: send manual push (internal)

**Configuration:**
```ts
nativePush: {
  provider: "expo" | "fcm" | "apns",
  expo?: { accessToken: string },
  fcm?: { serviceAccountKey: object },
  apns?: { key: string, keyId: string, teamId: string, bundleId: string },
  events: string[],  // bus events that trigger a push
  onNotification: (event, ctx) => PushPayload,  // map event → payload
}
```

**Adapters Required:** Same interface as `slingshot-push`:
- `savePushToken(userId, token, platform, metadata)`
- `listPushTokensByUserId(userId)`
- `deletePushTokenByValue(token)`
- Adapters: SQLite, PostgreSQL, MongoDB, Memory

**Dependency:** None (can coexist with `slingshot-push`)

---

### 3.2 `slingshot-deep-links` (NEW PLUGIN)

**Purpose:** Serve the platform-specific association files that enable iOS Universal Links and Android App Links. Handle deferred deep links (user lands on web → installs app → opens at original destination). Provide fallback web views for links opened without the app installed.

**What it does:**
- Serves `/.well-known/apple-app-site-association` (AASA file) for iOS Universal Links
- Serves `/.well-known/assetlinks.json` for Android App Links
- Serves smart app banner meta tags for web fallback pages
- Handles deferred deep link tokens: client registers intent → app picks it up after install
- Handles OAuth redirect URIs for mobile native OAuth flows (custom scheme callbacks)

**New Routes:**
- `GET /.well-known/apple-app-site-association` — AASA JSON (no auth)
- `GET /.well-known/assetlinks.json` — Asset links JSON (no auth)
- `GET /deep-link/banner/:path` — Web fallback page with app store redirect
- `POST /deep-link/defer` — Store deferred deep link token (returns token)
- `GET /deep-link/defer/:token` — Retrieve + consume deferred link destination
- `GET /auth/oauth/:provider/mobile-callback` — OAuth redirect for native apps (exchanges code, returns to app via scheme)

**Configuration:**
```ts
deepLinks: {
  ios: {
    appId: "TEAMID.com.example.app",       // Prefix.BundleId
    paths: ["*"],                            // Which paths to handle
    components?: ApplePathComponent[],      // Fine-grained path control
  },
  android: {
    packageName: "com.example.app",
    sha256Fingerprints: string[],           // Signing key fingerprints
  },
  scheme: "myapp",                          // Custom URL scheme for OAuth callbacks
  appStoreUrl?: string,                     // iOS App Store link
  playStoreUrl?: string,                    // Google Play link
  fallback?: {
    template?: (path: string) => string,    // Custom web fallback page
    redirectDelay?: number,                 // ms before redirect
  },
}
```

**Dependency:** None (standalone plugin)

---

### 3.3 `slingshot-organizations` Extension: Mobile Profile

`slingshot-organizations` already exists. It needs the following additions for mobile use:

- `GET /organizations/current` — User's active org context
- `POST /organizations/:orgId/switch` — Switch active org (updates session claims)
- `GET /organizations/:orgId/members/me` — Current user's org membership + role
- Organization invite deep links (generates link → deferred deep link token → app opens invite screen)

---

## 4. Phase 1 — SDK Core Parity

Everything in this phase brings Pocketshot's SDK to Snapshot parity (or mobile equivalent).

### 4.1 Auth Module Reorganization

**Current state:** All 24 auth hooks live in `src/auth/hooks.ts`. Mirrors early Snapshot before it was split.

**Required:** Split into separate files matching Snapshot's structure. This is a refactor, not new functionality. The factory (`createAuthHooks`) still returns the same unified object.

```
src/auth/
  hooks.ts              ← useUser, useLogin, useLogout, useRegister, useForgotPassword
  account-hooks.ts      ← useResetPassword, useVerifyEmail, useResendVerification,
                           useSetPassword, useDeleteAccount, useCancelDeletion,
                           useSessions, useRevokeSession
  mfa-hooks.ts          ← useVerifyMfa, useMfaMethods, useMfaSetup, useMfaVerifySetup,
                           useMfaDisable, useMfaResend, useMfaRecoveryCodes,
                           useEmailOtpEnable, useEmailOtpVerifySetup, useMfaEmailOtpDisable
  oauth-hooks.ts        ← getOAuthUrl, getLinkUrl, useOAuthExchange, useLinkAccount,
                           useUnlinkAccount
  webauthn-hooks.ts     ← (see 4.2)
  contract.ts           ← unchanged
  storage.ts            ← unchanged
  errors.ts             ← unchanged
  warnings.ts           ← (new, see 4.3)
```

**Missing hooks to add in this refactor:**

- `useMfaRecoveryCodes()` — GET recovery codes after MFA setup (Snapshot has this, pocketshot does not)
- `useLinkAccount()` — Link social account to existing session (mutation: POST /auth/oauth/:provider/link)
- `useUnlinkAccount()` — Unlink a linked social account (currently named `useOAuthUnlink` — rename)

### 4.2 WebAuthn / Passkey Module (Mobile-Native)

Snapshot uses `@simplewebauthn/browser` — browser-specific WebAuthn APIs. On mobile, passkeys work differently depending on the approach:

1. **Platform passkeys (iOS 16+ / Android 9+):** Available via `expo-passkeys` or `react-native-passkeys`. Uses platform authenticator. User experience: Face ID / fingerprint prompt that creates a passkey stored in iCloud Keychain or Google Password Manager.

2. **Security key passkeys:** USB/NFC hardware key. Edge case for mobile, not prioritized.

The distinction is critical: **passkeys on mobile are the primary auth method**, not a second factor. They replace passwords. The hook surface must reflect this.

**New file:** `src/auth/webauthn-hooks.ts`

**New hooks:**

```ts
// Registration — called during sign-up or from security settings
usePasskeyRegister(): UseMutationResult<void, ApiError, PasskeyRegisterVars>
// 1. GET /auth/passkey/register/options → gets challenge from Slingshot
// 2. Calls platform authenticator (react-native-passkeys)
// 3. POST /auth/passkey/register/verify → confirms with Slingshot

// Login — called instead of email/password
usePasskeyLogin(): UseMutationResult<LoginResult, ApiError, PasskeyLoginVars>
// 1. GET /auth/passkey/login/options → gets challenge
// 2. Calls platform authenticator
// 3. POST /auth/passkey/login/verify → Slingshot validates, returns token

// List credentials
useListPasskeys(): UseQueryResult<PasskeyCredential[]>
// GET /auth/passkey/credentials

// Delete credential
useDeletePasskey(): UseMutationResult<void, ApiError, { credentialId: string }>
// DELETE /auth/passkey/credentials/:credentialId
```

**Types:**
```ts
interface PasskeyCredential {
  id: string
  credentialId: string
  name?: string          // user-given name
  createdAt: string
  lastUsedAt?: string
  platform: "ios" | "android"
}

interface PasskeyRegisterVars {
  name?: string          // optional human name for credential
}

interface PasskeyLoginVars {
  username?: string      // optional hint for conditional UI
}
```

**Peer dependency:** `react-native-passkeys` (or `expo-passkeys` when available stable)

**Contract endpoints to add:**
```ts
passkey: {
  registerOptions: "/auth/passkey/register/options",
  registerVerify: "/auth/passkey/register/verify",
  loginOptions: "/auth/passkey/login/options",
  loginVerify: "/auth/passkey/login/verify",
  list: "/auth/passkey/credentials",
  delete: (credentialId: string) => `/auth/passkey/credentials/${credentialId}`,
}
```

### 4.3 Auth Warnings Module

**New file:** `src/auth/warnings.ts`

Dev-time validation that fires `warnOnce()` when the factory is misconfigured. Validates at `createPocketshot()` call time. Never runs in production.

Checks:
- `apiUrl` does not start with `http://` in production
- `loginPath`, `homePath`, `mfaPath` all start with `/`
- If `wsEndpoint` provided: starts with `ws://` or `wss://`
- If `wsEndpoint` is `ws://` (insecure): warn unless `__DEV__`

### 4.4 SSE Module

Snapshot has a full SSE manager (`src/sse/`). Pocketshot has nothing.

**New files:** `src/sse/manager.ts`, `src/sse/atom.ts`, `src/sse/hook.ts`

**SSE on React Native:** The browser's `EventSource` API is not available in React Native. Use `react-native-event-source` (a polyfill) or implement a lightweight SSE client via `fetch` with streaming (available in React Native 0.73+ / Hermes).

**Architecture:** Mirror Snapshot's SSE registry pattern exactly.

```
SseRegistry (per createPocketshot instance)
  Map<endpoint, SseManager>

SseManager (per endpoint)
  connection: EventSource (or custom impl)
  listeners: Map<eventType, Set<handler>>
  status: "connecting" | "open" | "closed" | "error"
  reconnect logic: exponential backoff (1s → 2s → 4s → max 30s)
  app state listener: reconnect on app foreground
```

**Hooks:**

```ts
// Lower-level: access manager
useSSE(endpoint: string): { status: SseStatus, manager: SseManager }

// Higher-level: subscribe to event type
useSseEvent<T>(endpoint: string, eventType: string): {
  data: T | null
  error: Error | null
  subscribe: () => void
  unsubscribe: () => void
}
```

**App state integration:** When app goes to background, SSE connection should be closed (battery/network). When app returns to foreground, reconnect. Use `AppState` from react-native.

**Factory integration:** `createPocketshot` creates and owns the SSE registry. Passed to hooks as closure.

### 4.5 Push Notifications Module

Snapshot has `usePushNotifications()` for Web Push. Pocketshot needs the native equivalent using `expo-notifications`.

**New file:** `src/push/hook.ts`

**Peer dependency:** `expo-notifications`

**What it does:**
1. Requests notification permissions from the OS
2. Gets the Expo push token (or raw FCM/APN token)
3. Registers the token with the Slingshot backend (`slingshot-native-push`)
4. Sets up foreground notification handler
5. Sets up notification tap handler (deep link resolution)
6. Handles token refresh (tokens can rotate)

**Hook:**

```ts
usePushNotifications(opts?: {
  onNotification?: (notification: Notification) => void  // foreground notification received
  onNotificationResponse?: (response: NotificationResponse) => void  // user tapped notification
  autoRegister?: boolean  // default true — registers on mount
}): {
  token: string | null
  permissionStatus: PermissionStatus
  requestPermission: () => Promise<PermissionStatus>
  register: () => Promise<void>
  unregister: () => Promise<void>
  isRegistered: boolean
  error: Error | null
}
```

**Backend contract endpoints:**
```ts
nativePush: {
  register: "/push/native/register",
  unregister: (token: string) => `/push/native/register/${token}`,
  devices: "/push/native/devices",
}
```

**Platform handling:**
- Android: set up notification channel in register flow
- iOS: request `alert`, `sound`, `badge` permissions
- Both: handle `getExpoPushTokenAsync` for Expo-managed projects
- Both: store token in `tokenStorage` (reuse SecureStore pattern) so it persists across launches without re-registration

### 4.6 Theme Module

Snapshot has `useTheme()` toggling CSS class on document root. Mobile equivalent uses `Appearance` API and Jotai.

**New file:** `src/theme/hook.ts`

**Implementation:**

```ts
// Jotai atom persisted to SecureStore
const themeAtom = atomWithStorage<"light" | "dark" | "system">("pocketshot_theme", "system", secureStoreStorage)

function useTheme() {
  const [preference, setPreference] = useAtom(themeAtom)
  const systemScheme = useColorScheme()  // react-native

  const resolvedScheme = preference === "system" ? systemScheme ?? "light" : preference
  const isDark = resolvedScheme === "dark"

  return {
    isDark,
    scheme: resolvedScheme,
    preference,
    setPreference,    // "light" | "dark" | "system"
    toggleDark: () => setPreference(isDark ? "light" : "dark"),
  }
}
```

**Integration with token system:** The token system (Phase 5) uses `isDark` to switch between light and dark token sets.

---

## 5. Phase 2 — Native Mobile Modules

These are features that have no Snapshot equivalent — they are mobile-native capabilities required for enterprise apps.

### 5.1 Biometrics Module

**Purpose:** Local biometric authentication (Face ID, Touch ID, fingerprint) to gate app access. This is NOT passkeys. This is a local security layer — like requiring Face ID to open your banking app. The biometric check does not communicate with the server.

**Peer dependency:** `expo-local-authentication`

**New file:** `src/biometrics/hook.ts`

**Use cases:**
- Require biometric before showing sensitive screens
- Enable "Quick Unlock" after initial login (check biometric, skip re-entering password)
- Lock app on background, require biometric to resume

**Hooks:**

```ts
useBiometrics(): {
  isAvailable: boolean           // hardware present
  isEnrolled: boolean            // biometrics enrolled on device
  supportedTypes: BiometricType[] // "fingerprint" | "facialRecognition" | "iris"
  authenticate: (opts?: AuthenticateOpts) => Promise<BiometricResult>
  // Calls expo-local-authentication.authenticateAsync
}

type BiometricResult =
  | { success: true }
  | { success: false; error: "user_cancel" | "lockout" | "lockout_permanent" | "not_enrolled" | "unavailable" | "unknown" }

interface AuthenticateOpts {
  promptMessage?: string           // "Confirm your identity"
  cancelLabel?: string             // "Cancel"
  fallbackLabel?: string           // "Use Password" (iOS)
  disableDeviceFallback?: boolean  // default false
}
```

**Persistent biometric gate pattern (Quick Unlock):**

```ts
useBiometricGate(opts: {
  enabled: boolean           // user preference
  onSuccess: () => void
  onFail: () => void
  lockOnBackground?: boolean // default true — lock when app goes to background
}): {
  isLocked: boolean
  unlock: () => Promise<void>
}
```

The gate stores a "session unlocked" boolean in Jotai. When `lockOnBackground: true`, AppState listener resets it on background.

**Biometric storage helper (secure secret + biometric gate):**

Some use cases require storing a secret (e.g., encryption key) that is only accessible after biometric authentication. This uses `expo-secure-store` with `requireAuthentication: true`.

```ts
createBiometricStorage(key: string): {
  get(): Promise<string | null>    // prompts biometric before returning
  set(value: string): Promise<void>
  clear(): Promise<void>
}
```

### 5.2 Deep Linking Module

**Purpose:** Register and handle deep links in the app. Works with `slingshot-deep-links` backend plugin and `expo-router` for routing.

**New file:** `src/deep-links/hook.ts`

**What Expo Router already handles:** URL-scheme deep links and Universal Links route to the matching screen automatically when the route exists. The pocketshot deep-links module handles the cases Expo Router doesn't cover natively:

1. **Deferred deep links** — User received a link, didn't have the app, installed it, now the app should open at the right place.
2. **Authenticated deep links** — Link requires auth state check before navigating (e.g., community invite).
3. **Dynamic param parsing** — Decode and validate deep link params.
4. **Link generation** — Build deep link URLs for sharing.

**Hooks:**

```ts
// Resolves a deferred deep link token on first launch
useDeferredDeepLink(opts?: {
  onResolve?: (destination: string) => void
}): {
  isChecking: boolean
  destination: string | null
  clear: () => void
}

// Build a shareable deep link for the current screen
useDeepLink(path: string, params?: Record<string, string>): string
// Returns: "myapp://path?params=..." or "https://example.com/path?params=..."

// Parse universal link URL into route + params
parseDeepLink(url: string): { route: string; params: Record<string, string> } | null
```

**Backend contract endpoints:**
```ts
deepLinks: {
  deferCheck: "/deep-link/defer",              // GET /:token
  deferStore: "/deep-link/defer",              // POST
}
```

**Expo Router integration:** The deferred deep link hook calls the backend on app first-launch, gets the stored destination, and navigates using `router.replace()`. `expo-linking` handles the URL parsing layer.

### 5.3 Offline Sync Module

**Purpose:** Allow apps to function without network connectivity. Write operations queue locally and sync when connectivity is restored. Read operations serve from local SQLite cache.

**This is the most architecturally complex module.** Scope for 2.0 is a practical subset, not a full offline-first framework.

**Peer dependencies:** `expo-sqlite`, `expo-network` (or `@react-native-community/netinfo`)

**New files:**
```
src/offline/
  queue.ts        ← Mutation queue (SQLite-backed)
  cache.ts        ← Read cache store
  hook.ts         ← useOffline, useNetworkStatus, useSyncQueue
  manager.ts      ← OfflineManager class
```

**Core concept: Optimistic Mutations → Queue → Sync**

When offline:
1. Mutation is applied optimistically to React Query cache (immediate UI update)
2. Mutation is serialized and stored in SQLite queue
3. When connectivity returns, queue is drained in order
4. If a queued mutation fails on sync, user is notified (configurable)

**Scope for 2.0:**
- Network status awareness
- Read cache (React Query's `staleTime` + persisted query cache via `expo-sqlite`)
- Write queue for community operations (create thread, create reply, add reaction)
- Manual sync trigger
- Sync status hooks

**Not in 2.0 scope:**
- Conflict resolution (last-write-wins assumed)
- Full entity-level sync
- Background sync (requires background task — complex, battery-sensitive)

**Hooks:**

```ts
useNetworkStatus(): {
  isOnline: boolean
  isInternetReachable: boolean | null
  type: "wifi" | "cellular" | "ethernet" | "none" | "unknown"
}

useSyncQueue(): {
  pendingCount: number
  isSyncing: boolean
  lastSyncedAt: Date | null
  sync: () => Promise<SyncResult>
  clear: () => Promise<void>    // admin: clear queue (destructive)
}

useOffline(): {
  isOnline: boolean
  queuedCount: number
  sync: () => Promise<void>
}
```

**Configuration (on createPocketshot):**
```ts
offline?: {
  enabled: boolean
  cacheStaleTime?: number       // how long read cache is considered fresh
  syncOnReconnect?: boolean     // default true
  onSyncComplete?: (result: SyncResult) => void
  onSyncError?: (errors: SyncError[]) => void
}
```

**Factory integration:** `createPocketshot` creates `OfflineManager` if `offline.enabled`. React Query persistent cache uses `expo-sqlite` via a custom `createSyncStoragePersister`.

### 5.4 Network-Aware API Client

The existing `ApiClient` does not handle offline scenarios. Extend it:

- Expose `isOnline` state via Jotai atom
- When offline: throw `ApiError` with `code: "NETWORK_OFFLINE"` (instead of a network error from fetch)
- Automatic retry when connectivity restored (if query was pending when connection dropped)
- Configurable retry policy (exponential backoff, max attempts)

No new file needed — extends `src/api/client.ts`.

### 5.5 Device Module

**Purpose:** Register the device with the backend, maintain device identity, and expose device metadata for analytics/security.

**New file:** `src/device/hook.ts`

**Peer dependencies:** `expo-device`, `expo-application`

**What it does:**
- Generates a stable device ID (stored in SecureStore — survives app updates)
- Registers device with backend on first launch
- Provides device metadata (model, OS version, app version)
- Used by push notifications and security features (session binding per device)

**Hooks:**

```ts
useDevice(): {
  deviceId: string              // stable UUID, generated on first launch
  platform: "ios" | "android"
  model: string | null
  osVersion: string
  appVersion: string
  buildVersion: string
  register: () => Promise<void> // call on first launch / after login
}
```

**Backend contract endpoints:**
```ts
device: {
  register: "/devices/register",       // POST
  unregister: "/devices/unregister",   // DELETE
}
```

**Backend requirement:** `slingshot-native-push` device registration endpoint or a lightweight `slingshot-device` plugin (TBD — may be part of `slingshot-native-push`).

### 5.6 App State Module

**Purpose:** Centralized app lifecycle management. Multiple modules need to react to app foreground/background transitions (SSE reconnect, WebSocket reconnect, biometric lock, offline sync). Centralizing this prevents N modules each registering their own `AppState` listener.

**New file:** `src/app-state/manager.ts`

```ts
class AppStateManager {
  // Subscribers register callbacks for lifecycle events
  onForeground(handler: () => void): () => void   // returns unsubscribe
  onBackground(handler: () => void): () => void
  onActive(handler: () => void): () => void        // includes initial active state
  destroy(): void
}
```

Created inside `createPocketshot`. Passed to SSE manager, WebSocket manager, biometric gate, offline manager.

**Hook:**

```ts
useAppState(): {
  state: AppStateStatus   // "active" | "background" | "inactive" | "unknown"
  isActive: boolean
  isBackground: boolean
}
```

### 5.7 Certificate Pinning (Enterprise Security)

**Purpose:** Prevent man-in-the-middle attacks by pinning the API server's TLS certificate. Required for high-security enterprise apps (banking, healthcare, government).

**Implementation:** React Native's `fetch` does not support certificate pinning natively. Options:
- `react-native-ssl-pinning` — Provides `fetch`-compatible API with pinning
- OkHttp pinning (Android) via custom native module

**New optional configuration:**

```ts
// Added to createPocketshot config
certificatePinning?: {
  enabled: boolean
  hashes: string[]          // SHA-256 public key hashes (base64)
  allowExpiredCerts?: boolean
}
```

When enabled, `ApiClient` uses the pinning-aware fetch instead of native fetch. If the server certificate does not match a pinned hash, the request fails with a security error.

**Peer dependency:** `react-native-ssl-pinning` (optional — only if `certificatePinning.enabled`)

This is opt-in via config. When disabled, no dependency is bundled.

### 5.8 Haptics Module

Mobile apps provide tactile feedback. Components use haptics for confirmations, errors, and selections.

**New file:** `src/haptics/index.ts`

**Peer dependency:** `expo-haptics`

```ts
import { impact, notification, selection } from "@lastshotlabs/pocketshot"

impact(style?: "light" | "medium" | "heavy" | "rigid" | "soft")
notification(type?: "success" | "warning" | "error")
selection()  // subtle tick for picker/slider
```

These are thin wrappers over `expo-haptics` that:
1. No-op if haptics are not available (simulator, older devices)
2. Respect the device's "Haptic Feedback" accessibility setting
3. Can be disabled globally via `createPocketshot({ haptics: false })`

Haptics are used in UI components automatically (e.g., `Button` calls `impact("light")` on press, form validation error calls `notification("error")`). Can be overridden via component config.

### 5.9 Share Module

Native share sheet integration.

**New file:** `src/share/hook.ts`

**Peer dependency:** `expo-sharing` + `expo-file-system` (for file sharing)

```ts
useShare(): {
  shareText: (text: string, title?: string) => Promise<void>
  shareUrl: (url: string, title?: string) => Promise<void>
  shareFile: (uri: string, mimeType: string) => Promise<void>
  canShare: boolean
}
```

Used in components (share button on threads, share profile link, share content).

### 5.10 Clipboard Module

```ts
useClipboard(): {
  copy: (text: string) => Promise<void>
  paste: () => Promise<string>
  hasCopied: boolean   // true for 2s after copy (for visual feedback)
}
```

**Peer dependency:** `expo-clipboard`

---

## 6. Phase 3 — Organizations & Permissions

Slingshot has `slingshot-organizations` and `slingshot-permissions`. Pocketshot has neither.

### 6.1 Organizations Module

**New files:**
```
src/organizations/
  hooks.ts
  types.ts
  contract.ts
  index.ts
```

**Types:**
```ts
interface Organization {
  id: string
  name: string
  slug: string
  logoUrl?: string
  role: string           // current user's role in this org
  memberCount: number
  createdAt: string
}

interface OrgMember {
  id: string
  userId: string
  orgId: string
  role: string
  joinedAt: string
  user: { id: string; email?: string; username?: string; avatarUrl?: string }
}

interface OrgInvite {
  id: string
  orgId: string
  email?: string
  role: string
  token: string
  expiresAt: string
  status: "pending" | "accepted" | "expired"
}

interface OrgGroup {
  id: string
  orgId: string
  name: string
  slug: string
  memberCount: number
}
```

**Hooks:**

```ts
// Org management
useOrganizations(): UseQueryResult<Organization[]>
useOrganization(orgId: string): UseQueryResult<Organization>
useCreateOrganization(): UseMutationResult<Organization, ApiError, CreateOrgBody>
useUpdateOrganization(): UseMutationResult<Organization, ApiError, UpdateOrgBody>
useDeleteOrganization(): UseMutationResult<void, ApiError, { orgId: string }>
useSwitchOrganization(): UseMutationResult<void, ApiError, { orgId: string }>
useCurrentOrganization(): UseQueryResult<Organization | null>

// Members
useOrgMembers(orgId: string, params?: ListParams): UseQueryResult<PaginatedResponse<OrgMember>>
useOrgMember(orgId: string, memberId: string): UseQueryResult<OrgMember>
useUpdateOrgMemberRole(): UseMutationResult<OrgMember, ApiError, UpdateRoleBody>
useRemoveOrgMember(): UseMutationResult<void, ApiError, { orgId: string; memberId: string }>

// Invites
useOrgInvites(orgId: string): UseQueryResult<OrgInvite[]>
useInviteOrgMember(): UseMutationResult<OrgInvite, ApiError, InviteMemberBody>
useAcceptOrgInvite(): UseMutationResult<void, ApiError, { token: string }>
useDeclineOrgInvite(): UseMutationResult<void, ApiError, { token: string }>
useCancelOrgInvite(): UseMutationResult<void, ApiError, { inviteId: string }>

// Groups
useOrgGroups(orgId: string): UseQueryResult<OrgGroup[]>
useCreateOrgGroup(): UseMutationResult<OrgGroup, ApiError, CreateGroupBody>
useUpdateOrgGroup(): UseMutationResult<OrgGroup, ApiError, UpdateGroupBody>
useDeleteOrgGroup(): UseMutationResult<void, ApiError, { groupId: string }>
useOrgGroupMembers(groupId: string): UseQueryResult<OrgMember[]>
useAddOrgGroupMember(): UseMutationResult<void, ApiError, { groupId: string; userId: string }>
useRemoveOrgGroupMember(): UseMutationResult<void, ApiError, { groupId: string; userId: string }>
```

**Factory integration:** `createOrganizationHooks(api)` factory. Optional module — only active when org endpoints are available.

### 6.2 Permissions Module

**New files:**
```
src/permissions/
  hooks.ts
  types.ts
  contract.ts
  index.ts
```

**Purpose:** Query the current user's roles and permissions. Gate UI and navigation based on permissions. This is client-side permission checking for UI purposes — the backend enforces actual authorization.

**Types:**
```ts
interface UserPermissions {
  roles: string[]
  capabilities: string[]       // fine-grained permission strings
  orgRoles?: Record<string, string>  // orgId → role in that org
}
```

**Hooks:**

```ts
usePermissions(): {
  permissions: UserPermissions | null
  hasRole: (...roles: string[]) => boolean           // OR logic
  hasAllRoles: (...roles: string[]) => boolean       // AND logic
  can: (...capabilities: string[]) => boolean        // check capabilities
  isAdmin: boolean
  isLoading: boolean
}

// Imperative gate — throws/redirects if unauthorized
useRequireRole(...roles: string[]): void
useRequireCapability(...caps: string[]): void
```

**Component integration:** Used in manifest system for `visibleTo` / `enabledFor` guards on screens and components.

### 6.3 Search Module

**New files:**
```
src/search/
  hooks.ts
  types.ts
  contract.ts
  index.ts
```

```ts
useSearch<T>(opts: {
  endpoint: string
  query: string
  params?: Record<string, unknown>
  enabled?: boolean
  debounce?: number   // default 300ms
}): UseQueryResult<SearchResult<T>>

interface SearchResult<T> {
  hits: T[]
  totalHits: number
  processingTimeMs?: number
  page?: number
  totalPages?: number
}
```

Community-specific search already exists in pocketshot (`useSearchThreads`, `useSearchReplies`). This module provides the generic search hook for any entity type — users, organizations, content, custom entities.

---

## 7. Phase 4 — File Upload & Media

### 7.1 File Upload Module

**New files:**
```
src/upload/
  hooks.ts
  types.ts
  contract.ts
  index.ts
```

**Two upload strategies:**
1. **Direct upload** — POST file to backend. Simple, no presigning required.
2. **Presigned URL upload** — Backend provides S3 presigned URL, client uploads directly to S3. Efficient for large files, reduces backend load. Matches Slingshot's `upload.presignedUrls` config.

**Peer dependencies:** `expo-image-picker`, `expo-document-picker`, `expo-file-system`

**Types:**
```ts
interface UploadResult {
  key: string         // storage key
  url: string         // public/signed URL
  filename: string
  mimeType: string
  size: number
}

interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}
```

**Hooks:**

```ts
useUpload(opts?: {
  endpoint?: string           // default "/upload"
  presign?: boolean           // default true if available
  maxFileSize?: number        // bytes
  allowedMimeTypes?: string[]
}): {
  upload: (file: PickedFile) => Promise<UploadResult>
  uploadMultiple: (files: PickedFile[]) => Promise<UploadResult[]>
  progress: Record<string, UploadProgress>  // keyed by file name
  isUploading: boolean
  error: Error | null
  cancel: () => void
}

// Convenience hooks for common sources
useImageUpload(opts?: UploadOpts): ImageUploadResult
useDocumentUpload(opts?: UploadOpts): DocumentUploadResult
useCameraUpload(opts?: UploadOpts): CameraUploadResult
```

**Multipart / chunked upload:** For large files (video), implement chunked upload with resume capability using `expo-file-system` streaming read + presigned multipart upload.

---

## 8. Phase 5 — UI Component Library

### 8.1 Design Token System (Mobile)

Snapshot uses CSS custom properties (`--sn-*`). Mobile uses a StyleSheet-based token object.

**New files:**
```
src/ui/tokens/
  schema.ts         ← Zod schema for token config
  resolve.ts        ← resolveTokens(config) → PocketshotTokens object
  flavors.ts        ← 8 built-in flavors (same as Snapshot)
  editor.ts         ← useTokenEditor hook
  types.ts
```

**Token resolution:**
```ts
interface PocketshotTokens {
  colors: {
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    muted: string
    mutedForeground: string
    accent: string
    accentForeground: string
    destructive: string
    destructiveForeground: string
    success: string
    successForeground: string
    warning: string
    warningForeground: string
    info: string
    infoForeground: string
    background: string
    card: string
    cardForeground: string
    border: string
    input: string
    ring: string
    // ... etc
  }
  radius: {
    none: number
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
    full: number
  }
  spacing: {
    "2xs": number
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
    "2xl": number
    "3xl": number
  }
  font: {
    sans: string
    mono: string
    display: string
    sizes: {
      xs: number; sm: number; base: number; md: number
      lg: number; xl: number; "2xl": number; "3xl": number; "4xl": number
    }
    weights: {
      light: "300"; normal: "400"; medium: "500"
      semibold: "600"; bold: "700"
    }
  }
  shadow: {
    none: ShadowStyle
    xs: ShadowStyle
    sm: ShadowStyle
    md: ShadowStyle
    lg: ShadowStyle
    xl: ShadowStyle
  }
  animation: {
    durationFast: number     // 150
    durationNormal: number   // 250
    durationSlow: number     // 400
  }
  opacity: {
    disabled: number   // 0.5
    hover: number      // 0.8
    muted: number      // 0.6
  }
}
```

**Dark mode:** `resolveTokens(config, "dark")` returns alternate token set. Components call `useTokens()` hook which returns the correct set based on `useTheme().isDark`.

**8 built-in flavors:** Same as Snapshot — neutral, slate, midnight, violet, rose, emerald, ocean, sunset.

**`useTokens()` hook:** Returns current `PocketshotTokens` based on active flavor + theme mode. Updates reactively when theme switches.

**`useTokenEditor()` hook:** Same API as Snapshot. Allows runtime override of any token.

### 8.2 Component Architecture

All components follow the file structure from Section 2.5. All components receive a `config` prop typed from their Zod schema. All components are wrapped with a `ComponentWrapper` that:
- Catches errors with an error boundary
- Handles loading state (Suspense fallback)
- Provides component-scoped context for from-ref resolution
- Adds `testID` prop for E2E testing

### 8.3 Component Inventory

#### Navigation & Layout

| Component | Description | Props/Config highlights |
|-----------|-------------|------------------------|
| `Screen` | Safe-area-aware screen wrapper | `scrollable`, `background`, `padding` |
| `KeyboardAvoidingScreen` | Screen that adjusts for keyboard | extends Screen |
| `TopBar` | Navigation header | `title`, `left` (back/menu), `right` (actions), `transparent` |
| `BottomTabBar` | iOS/Android tab bar | `tabs: TabItem[]`, `activeColor`, `badge` |
| `DrawerMenu` | Side drawer | `items: NavItem[]`, `header`, `footer` |
| `Row` | Flex row container | `gap`, `align`, `justify`, `wrap` |
| `Column` | Flex column container | same as Row |
| `Spacer` | Flexible space | `size` or `flex` |
| `Divider` | Horizontal/vertical rule | `orientation`, `color`, `thickness` |
| `SafeArea` | Safe area insets wrapper | `edges` |
| `ScrollView` | Styled scroll container | `showsScrollIndicator`, `refreshControl` |

#### Data Display

| Component | Description |
|-----------|-------------|
| `Avatar` | User avatar, initials fallback, online indicator |
| `AvatarGroup` | Stacked avatars with overflow count |
| `Badge` | Colored label chip |
| `Card` | Rounded card with shadow |
| `StatCard` | Single metric with trend and label |
| `DetailCard` | Key-value pairs for a single record |
| `List` | FlatList-based card list with pull-to-refresh |
| `DataList` | Table-like list optimized for mobile (no scroll tables) |
| `Feed` | Chronological activity stream with FlatList |
| `Timeline` | Vertical timeline with icons |
| `Chart` | Line/bar/pie charts (via `victory-native`) |
| `Skeleton` | Loading placeholder (shimmer animation) |
| `EmptyState` | Zero-data placeholder with icon and CTA |
| `ProgressBar` | Horizontal progress |
| `ProgressCircle` | Circular progress |
| `Alert` | Inline alert banner |
| `Toast` | Overlay notification (success/error/warning/info) |
| `NotificationBell` | Icon + unread badge |
| `FavoriteButton` | Heart/star toggle with animation |
| `SaveIndicator` | "Saving…" / "Saved" feedback |
| `Tooltip` | Long-press popover tooltip |
| `HighlightedText` | Text with search-match highlighting |

#### Forms

| Component | Description |
|-----------|-------------|
| `TextInput` | Styled text input with label, error, helper |
| `TextArea` | Multi-line input with auto-grow |
| `PinInput` | Digit-by-digit OTP / PIN input |
| `PhoneInput` | Phone with country code picker |
| `PasswordInput` | Text input with show/hide toggle |
| `Switch` | iOS/Android toggle |
| `Checkbox` | Single checkbox |
| `CheckboxGroup` | Multiple checkboxes |
| `RadioGroup` | Radio button group |
| `Select` | Bottom-sheet picker (replaces HTML select) |
| `MultiSelect` | Multi-choice with chips |
| `DatePicker` | Native date picker via bottom sheet |
| `TimePicker` | Native time picker |
| `DateRangePicker` | Start/end date selection |
| `Slider` | Range slider with haptics |
| `RatingInput` | Star rating |
| `TagSelector` | Add/remove tags |
| `LocationInput` | Geolocation with map preview |
| `AutoForm` | Auto-generate form from field config |
| `Wizard` | Multi-step form flow |
| `InlineEdit` | Tap-to-edit field |
| `QuickAdd` | Inline item creation |
| `SearchBar` | Search input with clear and debounce |

#### Overlay & Modal

| Component | Description |
|-----------|-------------|
| `BottomSheet` | Slide-up sheet (primary mobile modal pattern) |
| `Modal` | Full-screen or centered modal |
| `ActionSheet` | iOS-style action choices |
| `Popover` | Anchored floating panel |
| `ContextMenu` | Long-press context menu |
| `ConfirmDialog` | Confirmation modal with actions |
| `CommandPalette` | Searchable action launcher (Cmd+K equivalent — shake trigger or dedicated button) |

#### Content

| Component | Description |
|-----------|-------------|
| `Markdown` | Render markdown (`react-native-markdown-display`) |
| `RichTextViewer` | Read-only rich text rendering |
| `RichTextEditor` | Block-based editor (React Native equivalent, e.g., `@10play/tentap-editor`) |
| `RichInput` | Inline WYSIWYG for short content |
| `CodeBlock` | Syntax-highlighted code (`react-native-syntax-highlighter`) |
| `FileUploader` | Camera + gallery + files picker with upload |
| `ImageViewer` | Pinch-to-zoom image viewer |
| `MediaPicker` | Unified media picker (images, video, documents) |
| `VideoPlayer` | Basic video playback (`expo-av`) |
| `AudioPlayer` | Audio playback with waveform |
| `QRCode` | QR code display (`react-native-qrcode-svg`) |
| `QRScanner` | Camera-based QR scanner (`expo-barcode-scanner`) |
| `LinkEmbed` | URL preview card |
| `CompareView` | Side-by-side diff (horizontal scroll) |

#### Communication

| Component | Description |
|-----------|-------------|
| `ChatWindow` | Message list + input + WebSocket binding |
| `MessageBubble` | Individual message with avatar, timestamp, status |
| `MessageThread` | Threaded message list |
| `CommentSection` | Inline comments on content |
| `EmojiPicker` | Bottom-sheet emoji picker (`rn-emoji-keyboard`) |
| `GifPicker` | GIF search via Giphy/Tenor |
| `ReactionBar` | Emoji reactions with counts (Slack-style) |
| `ReactionPicker` | Quick emoji selection popover |
| `PresenceIndicator` | Online/offline/away dot |
| `TypingIndicator` | "User is typing…" animation |

#### Auth-Specific

| Component | Description |
|-----------|-------------|
| `OAuthButton` | Styled "Continue with [Provider]" button |
| `SocialLoginButtons` | Group of OAuth provider buttons |
| `PasskeyButton` | "Sign in with Passkey" (Face ID icon etc.) |
| `BiometricPrompt` | Visual biometric authentication trigger |
| `MfaCodeInput` | 6-digit OTP input (auto-advance, paste support) |
| `QRCodeDisplay` | TOTP secret QR code for authenticator setup |
| `RecoveryCodeList` | Display + copy recovery codes |
| `SessionCard` | Session info card (device, IP, last active) |

#### Data Tools

| Component | Description |
|-----------|-------------|
| `FilterBar` | Horizontal scrolling filter chips |
| `FilterSheet` | Bottom-sheet advanced filter panel |
| `EntityPicker` | Searchable entity selector (bottom sheet) |
| `SortPicker` | Sort options sheet |
| `Pagination` | Page navigation (or "Load More" / infinite scroll) |
| `PullToRefresh` | Wrapper adding pull-to-refresh to any scroll view |

#### Workflow

| Component | Description |
|-----------|-------------|
| `KanbanBoard` | Horizontal-scroll kanban with drag-and-drop |
| `Calendar` | Month/week/day calendar view |
| `AuditLog` | Chronological event log |
| `NotificationFeed` | Notification list with mark-read |

#### Commerce

| Component | Description |
|-----------|-------------|
| `PricingTable` | Feature comparison (vertical scroll, mobile-optimized) |

### 8.4 Headless Hooks (Level 2 Usage)

Component logic without rendering. Exported from `@lastshotlabs/pocketshot/ui`.

```ts
useDataList(config)       // list data, pagination, refresh
useAutoForm(config)       // form state, validation, submit
useWizard(config)         // step management, navigation, validation
useBottomSheet(id?)       // open/close/toggle
useModal(id?)             // open/close modal
useToast()                // show toasts imperatively
useConfirm()              // show confirm dialog imperatively
useActionSheet()          // show action sheet imperatively
```

---

## 9. Phase 6 — Config-Driven Manifest System

### 9.1 Mobile Manifest vs Web Manifest

The web manifest is page-based (URL routing). The mobile manifest is screen-based (navigation stack / tabs / drawer).

Key differences:

| Web (Snapshot) | Mobile (Pocketshot) |
|----------------|---------------------|
| Pages at URL paths | Screens in navigation structure |
| TanStack Router | Expo Router |
| Sidebar/top-nav layout | Tabs / stack / drawer navigation |
| CSS token system | StyleSheet token system |
| Modal overlays | Bottom sheets + modals |
| Click interactions | Tap + long-press + swipe |
| Keyboard always visible | Keyboard appears/disappears |

### 9.2 Manifest Schema

**New files:**
```
src/ui/manifest/
  schema.ts           ← Zod schemas for all manifest types
  compiler.ts         ← compileManifest() → CompiledManifest
  component-registry.tsx ← component registry
  renderer.tsx        ← ScreenRenderer
  app.tsx             ← ManifestApp component
  runtime.tsx         ← ManifestRuntimeProvider
  navigation.tsx      ← Navigation builder (tabs, stack, drawer)
  resources.ts        ← Data source management
  structural.tsx      ← Structural component side-effects
```

**Top-level manifest structure:**

```ts
interface MobileManifestConfig {
  theme: ThemeConfig
  navigation: NavigationConfig
  globals?: GlobalStateConfig
  resources?: ResourceConfigMap
  states?: StateConfigMap
  overlays?: Record<string, OverlayConfig>   // named bottom sheets / modals
  workflows?: WorkflowMap
  screens: Record<string, ScreenConfig>
}
```

**NavigationConfig:**

```ts
type NavigationConfig =
  | { type: "stack"; initial: string; screens: string[] }
  | { type: "tabs"; tabs: TabConfig[]; screens: string[] }
  | {
      type: "drawer"
      tabs?: TabConfig[]
      drawerItems: DrawerItemConfig[]
      screens: string[]
    }

interface TabConfig {
  key: string                   // matches screen key
  label: string
  icon: string                  // icon name
  badge?: string | { from: string }  // optional badge (from-ref supported)
  visibleTo?: string[]          // roles
}

interface DrawerItemConfig {
  label: string
  icon?: string
  screen?: string               // navigate to screen
  section?: string              // section header
  visibleTo?: string[]          // roles
}
```

**ScreenConfig:**

```ts
interface ScreenConfig {
  title?: string | { from: string }
  header?: ScreenHeaderConfig | false           // false = headerless
  guard?: RouteGuard                            // auth/role/permission guard
  params?: Record<string, ParamConfig>          // typed route params
  layout?: "scroll" | "keyboard-avoiding" | "flat" | "none"
  content: ComponentConfig[]
  pullToRefresh?: boolean | { targets: string[] }
  onMount?: Action | Action[]
  onUnmount?: Action | Action[]
}

interface ScreenHeaderConfig {
  title?: string | { from: string }
  left?: HeaderAction | "back" | "drawer"
  right?: HeaderAction | HeaderAction[]
  transparent?: boolean
  large?: boolean                               // iOS large title style
}

interface RouteGuard {
  require?: "auth" | string[]    // "auth" or role names
  redirect?: string              // screen key to redirect to
  condition?: { from: string; equals: unknown }
}
```

**ComponentConfig:**

Same philosophy as Snapshot: type-discriminated union, each type has its own schema.

```ts
type ComponentConfig =
  | { type: "stat-card"; id?: string; [key: string]: unknown }
  | { type: "list"; id?: string; [key: string]: unknown }
  | { type: "data-list"; id?: string; [key: string]: unknown }
  | { type: "auto-form"; id?: string; [key: string]: unknown }
  | { type: "chat-window"; id?: string; [key: string]: unknown }
  // ... all 60+ component types
  | { type: "custom"; name: string; config: unknown }  // user-registered
```

**OverlayConfig:**

```ts
type OverlayConfig =
  | { type: "bottom-sheet"; content: ComponentConfig[]; snapPoints?: (string | number)[] }
  | { type: "modal"; content: ComponentConfig[]; fullScreen?: boolean }
```

### 9.3 From-Ref System (id / from)

Identical to Snapshot. Components publish via `id`, subscribe via `{ from: "id" }`.

Two scopes:
- **ScreenContext** — per-screen, destroyed on navigate away
- **AppContext** — global, persists across screens

Default globals: `global.user`, `global.permissions`, `global.org`, `global.theme`, `global.notifications`

### 9.4 Action Vocabulary (Mobile Edition)

Fixed vocabulary. No arbitrary JavaScript.

| Action | Description |
|--------|-------------|
| `navigate` | Push/replace/reset to screen. Supports `{ screen, params, type: "push" \| "replace" \| "reset" \| "back" }` |
| `api` | Call endpoint. `onSuccess` / `onError` chains. `{result}` available downstream |
| `open-bottom-sheet` | Open named overlay (from `overlays` config) |
| `close-bottom-sheet` | Close topmost or named bottom sheet |
| `open-modal` | Open named modal overlay |
| `close-modal` | Close topmost or named modal |
| `action-sheet` | Show action sheet. `{ title?, message?, options: ActionSheetOption[] }` |
| `refresh` | Re-fetch component by id |
| `set-value` | Set another component's published value |
| `toast` | Show notification. `{ message, variant: "success" \| "error" \| "warning" \| "info", duration? }` |
| `haptic` | Trigger haptic. `{ type: "impact" \| "notification" \| "selection", style? }` |
| `share` | Open native share sheet. `{ text?, url? }` |
| `clipboard` | Copy to clipboard. `{ text }` |
| `confirm` | Show confirm dialog. Stops chain if cancelled |
| `download` | Download file to device |
| `open-url` | Open URL in browser or in-app browser |
| `run-workflow` | Execute named workflow |
| `camera` | Open camera. Result available as `{result}` |
| `media-picker` | Open media picker. Result available as `{result}` |
| `scan-qr` | Open QR scanner. Result available as `{result}` |

### 9.5 ManifestApp Component

Zero-config entry point.

```tsx
import { ManifestApp } from "@lastshotlabs/pocketshot/ui"
import manifest from "./pocketshot.manifest.json"

export default function App() {
  return (
    <ManifestApp
      manifest={manifest}
      apiUrl="https://api.example.com"
    />
  )
}
```

**What ManifestApp does:**
1. Creates SDK instance internally (with the `apiUrl` and any passed config)
2. Resolves tokens and makes them available via `useTokens()`
3. Sets up all providers (ScreenContextProvider, AppContextProvider, QueryClientProvider, JotaiProvider, SafeAreaProvider)
4. Registers all built-in components in the component registry
5. Builds and renders the navigation structure from `manifest.navigation`
6. Renders each screen's content via `ScreenRenderer`

### 9.6 ScreenRenderer (Runtime Rendering)

```tsx
import { ScreenRenderer, ScreenContextProvider } from "@lastshotlabs/pocketshot/ui"

export function DashboardScreen() {
  return (
    <ScreenContextProvider>
      <ScreenRenderer config={manifest.screens.dashboard} />
    </ScreenContextProvider>
  )
}
```

### 9.7 Component Registry

```ts
import { registerComponent } from "@lastshotlabs/pocketshot/ui"

// Override built-in component
registerComponent("stat-card", MyCustomStatCard)

// Register new component (for use as { type: "custom", name: "my-component" })
registerComponent("my-component", MyComponent)
registerComponentSchema("my-component", myComponentSchema)
```

### 9.8 Presets (Screen Templates)

Pre-built screen configurations for common patterns. Reduce boilerplate.

```ts
import { presets } from "@lastshotlabs/pocketshot/ui"

const screens = {
  users: presets.list({
    title: "Users",
    data: "GET /api/users",
    item: { type: "card", ... },
    actions: { create: { navigate: "user-form" } },
  }),
  userDetail: presets.detail({
    title: "User",
    data: "GET /api/users/{id}",
    fields: [...],
  }),
  userForm: presets.form({
    title: "Edit User",
    fields: [...],
    submit: "PATCH /api/users/{id}",
  }),
}
```

Available presets: `list`, `detail`, `form`, `wizard`, `settings`, `profile`, `dashboard`, `chat`, `notifications`

---

## 10. Phase 7 — CLI Enhancements

### 10.1 New Commands

**`pocketshot manifest init`**

Generates `pocketshot.manifest.json` in the current directory with a minimal starter structure.

```json
{
  "theme": { "flavor": "neutral" },
  "navigation": { "type": "tabs", "tabs": [] },
  "screens": {
    "home": {
      "title": "Home",
      "content": []
    }
  }
}
```

**`pocketshot manifest validate`**

Validates `pocketshot.manifest.json` against the Zod schema. Reports all errors with field paths.

```
pocketshot manifest validate
✓ Navigation config valid
✓ Screen "home" valid
✗ Screen "profile" — content[2].type: invalid type "chart-view", expected one of: ...
```

**`pocketshot manifest preview`** (Future)

Starts a development server with live manifest preview.

### 10.2 Enhanced `pocketshot init`

Add new wizard prompts:

10. **Push notifications?** → Adds `expo-notifications` + native push config
11. **Biometric support?** → Adds `expo-local-authentication`
12. **Offline support?** → Adds `expo-sqlite` + offline config
13. **Organizations?** → Adds org screens to scaffold
14. **Template:** `standard` | `admin` | `manifest-app`

**`pocketshot init --template admin`**

Generates a full admin mobile app:
- Users list + detail screen
- Session management
- Org management
- Audit log screen
- Notification feed
- Settings screen (password, MFA, biometrics, sessions, delete account)
- RBAC layout (admin-only screens)

**`pocketshot init --template manifest-app`**

Generates a minimal manifest-driven app:
- `pocketshot.manifest.json` with example screens
- `app/_layout.tsx` using `ManifestApp`
- No hand-written screens

### 10.3 Enhanced `pocketshot sync`

Add:
- `--manifest` flag: regenerate `pocketshot.manifest.json` screen list from OpenAPI operations
- `--push-config` flag: generate native push configuration from Slingshot config endpoint

### 10.4 New `pocketshot eas` Command

Helper for EAS Build configuration:

```
pocketshot eas setup
```

Generates `eas.json` with development, preview, and production profiles. Sets up `expo-updates` for OTA updates.

```
pocketshot eas secrets
```

Checks that required environment variables are set in EAS secrets.

---

## 11. Testing Strategy

Full detail in [`docs/engineering-rules.md`](./engineering-rules.md). Summary:

| Layer | Tool | Coverage |
|-------|------|----------|
| SDK hooks | vitest + React Native Testing Library | Success, error, loading states; cache invalidation; auth redirects |
| Zod schemas | vitest | Valid configs parse, invalid reject with readable errors, from-ref accepted |
| CLI templates | vitest string assertions | Template output matches expected scaffold |
| UI components | vitest + RNTL | Config-to-output, from-ref, action dispatch, loading/error/empty |
| E2E | Maestro | Critical user paths (see below) |

**No live network in any unit/integration test.** Mock the API client via `TestPocketshotProvider`.

**Maestro E2E critical paths (must have coverage before shipping):**
- Email/password register → verify email → login → logout
- MFA: setup TOTP → verify on next login
- OAuth: GitHub login → account link → unlink
- Passkey: register → login with passkey
- Biometric gate: enable → background app → foreground → biometric unlock
- Community: create thread → reply → add reaction → delete reply
- Push opt-in: prompt → grant → receive notification → tap to navigate
- Deep link: tap universal link → opens correct screen (authenticated)
- Offline: create thread offline → reconnect → sync

**Platform coverage:** E2E must pass on both iOS simulator and Android emulator. UI screenshots for all components on both platforms.

---

## 12. Error Handling Architecture

### Error Types

```ts
// API errors (4xx/5xx from backend)
class ApiError extends Error {
  status: number
  code?: string          // machine-readable code from backend
  data?: unknown         // raw response body
}

// Specific error codes components handle
type ApiErrorCode =
  | "NETWORK_OFFLINE"          // no connectivity
  | "UNAUTHENTICATED"          // 401 — token expired or invalid
  | "FORBIDDEN"                // 403 — insufficient permissions
  | "NOT_FOUND"                // 404
  | "RATE_LIMITED"             // 429
  | "SERVER_ERROR"             // 5xx
  | "BIOMETRIC_LOCKOUT"        // too many biometric failures
  | "BIOMETRIC_NOT_ENROLLED"   // device has no biometrics set up
  | "PERMISSION_DENIED"        // OS permission refused
  | "OPTIONAL_DEP_MISSING"     // optional peer dep not installed

// Network offline specifically
class OfflineError extends ApiError {
  code: "NETWORK_OFFLINE"
}
```

### Error Propagation

```
ApiClient throws ApiError
  ↓
React Query catches → hook exposes { error: ApiError | null }
  ↓
Component receives error → renders appropriate state:
  - NETWORK_OFFLINE: show stale data + offline indicator
  - UNAUTHENTICATED: clear tokens + navigate to login (handled in ApiClient)
  - FORBIDDEN: show "access denied" empty state
  - NOT_FOUND: show "not found" empty state
  - RATE_LIMITED: show retry UI with countdown
  - SERVER_ERROR: show generic error + retry button
  - others: show formatted error message
```

### Rules

- **Components never show raw error messages.** Error messages from the API may contain internals. Components show user-facing strings from `formatAuthError` or generic messages.
- **`UNAUTHENTICATED` is handled centrally.** The `ApiClient` intercepts 401, attempts token refresh once, and on second 401 clears tokens and calls `config.onUnauthenticated`. Components do not handle 401 individually.
- **`NETWORK_OFFLINE` shows stale data.** Components that fetch data check for `NETWORK_OFFLINE` and render stale cached data with an `OfflineBanner` indicator rather than a blank error screen. Never show "error" when the data is in cache.
- **Mutation errors are toast-able.** Mutations that fail display a toast notification by default. Components can override the `onError` behavior via config.

---

## 13. Showcase App

Pocketshot needs a `showcase/` Expo app that serves as:
1. Visual verification for every component
2. Living documentation of what configs look like
3. E2E test target

**Structure:**
```
showcase/
  app/
    _layout.tsx              ← Root layout with all providers
    index.tsx                ← Component browser (searchable list)
    (components)/
      [group]/
        [component].tsx      ← Showcase screen for each component
    (sdk)/
      auth.tsx               ← Auth flow showcase
      community.tsx          ← Community features
      push.tsx               ← Push notifications
      biometrics.tsx         ← Biometric gate
      ...
  fixtures/
    auth.ts                  ← Mock auth responses
    community.ts             ← Mock community data
    ...
```

**Per-component showcase requirements (identical to Snapshot's playground rules):**
- Populated state (real-looking data)
- Loading state (skeleton)
- Error state
- Empty state
- All significant variants
- Light and dark mode side-by-side
- Token responsiveness: flavor switch must visibly change the component
- iOS and Android screenshots taken automatically via Maestro

A component not in the showcase is not considered done, regardless of whether it passes unit tests.

---

## 14. Definition of Done

For every module/phase:

```sh
bun run typecheck        # zero errors
bun run format:check     # prettier clean
bun run build            # builds both entry points (index + ui)
bun test                 # all tests pass
```

Additionally:
- [ ] All exported symbols have JSDoc
- [ ] `docs/` has a page for the new module
- [ ] Schema tests exist for all new Zod schemas
- [ ] CLI template changes have string-assertion tests
- [ ] All new interactive elements have `testID` (engineering-rules.md Rule 31)
- [ ] All new interactive elements have accessibility props (engineering-rules.md Rule 32)
- [ ] Component appears in showcase app with all states: populated, loading, error, empty
- [ ] Showcase verified in both light and dark mode
- [ ] `CLAUDE.md` / `docs/engineering-rules.md` updated if any rules changed

---

## 15. Implementation Phases & Sequencing

Work must be sequenced because later phases depend on earlier ones. Within a phase, items can be parallelized.

### Phase A: Foundation (Do First)

**Dependency-free. All other phases build on this.**

1. `CLAUDE.md` + `docs/engineering-rules.md` ← **already done**
2. Token system (`src/ui/tokens/`) — all component work depends on this
3. Auth refactor (file split, add `useMfaRecoveryCodes`, `useLinkAccount`, `useUnlinkAccount`)
4. Auth warnings module
5. `AppStateManager` — SSE, WebSocket, biometrics all depend on this
6. Theme hook (`useTheme`)
7. Showcase app scaffold (`showcase/`) — needed before any component work begins

### Phase B: SDK Modules (No UI dependency)

**Can run in parallel after Phase A.**

7. SSE module
8. Push notifications module (requires `slingshot-native-push` backend)
9. Biometrics module
10. Deep linking module (requires `slingshot-deep-links` backend)
11. Offline sync module
12. Network-aware API client
13. Device module
14. Haptics module
15. Share + Clipboard modules
16. Organizations module
17. Permissions module
18. Search module
19. File upload module
20. WebAuthn / Passkey module (mobile)

### Phase C: Slingshot Plugins (Parallel with Phase B)

21. `slingshot-native-push` plugin
22. `slingshot-deep-links` plugin
23. `slingshot-organizations` extensions

### Phase D: Core UI Components (Requires Phase A tokens)

**Build in this order — later components compose from earlier ones.**

24. Primitive components: `Screen`, `Row`, `Column`, `Spacer`, `Divider`, `SafeArea`, `ScrollView`
25. Text/typography: `TextInput`, `TextArea`, `PinInput`, `PasswordInput`
26. Selection: `Switch`, `Checkbox`, `RadioGroup`, `Select`, `MultiSelect`
27. Feedback: `Toast`, `Alert`, `Skeleton`, `ProgressBar`, `ProgressCircle`
28. Display: `Avatar`, `AvatarGroup`, `Badge`, `Card`, `Separator`, `Tooltip`
29. Navigation: `TopBar`, `BottomTabBar`, `DrawerMenu`
30. Overlay: `BottomSheet`, `Modal`, `ActionSheet`, `ConfirmDialog`, `Popover`
31. Forms: `AutoForm`, `Wizard`, `DatePicker`, `Slider`, `TagSelector`, etc.
32. Data: `StatCard`, `DetailCard`, `List`, `DataList`, `Feed`, `Chart`, `EmptyState`
33. Content: `Markdown`, `CodeBlock`, `QRCode`, `QRScanner`, `RichTextViewer`
34. Communication: `ChatWindow`, `MessageBubble`, `EmojiPicker`, `ReactionBar`
35. Auth: `OAuthButton`, `PasskeyButton`, `MfaCodeInput`, `BiometricPrompt`

### Phase E: Advanced UI Components (Requires Phase D)

36. `RichTextEditor` (complex native dep)
37. `VideoPlayer`, `AudioPlayer`
38. `KanbanBoard` (drag-and-drop)
39. `Calendar`
40. `CommandPalette`
41. `GifPicker`

### Phase F: Manifest System (Requires all of Phase D)

42. Component registry
43. Zod schemas for all component configs
44. ScreenContext / AppContext
45. Action executor (mobile vocabulary)
46. ScreenRenderer
47. Navigation builder (tabs/stack/drawer)
48. ManifestApp component
49. Presets (list, detail, form, settings, etc.)
50. Compiler + validator

### Phase G: CLI (Can run partially in parallel with Phase F)

51. `manifest init` command
52. `manifest validate` command
53. Enhanced `init` wizard (new prompts, admin template, manifest-app template)
54. Enhanced `sync` (manifest generation)
55. `eas` command

---

## Appendix A: New Peer Dependencies Summary

| Package | Module | Required / Optional |
|---------|--------|-------------------|
| `expo-notifications` | Push | Optional (peer) |
| `expo-local-authentication` | Biometrics | Optional (peer) |
| `react-native-passkeys` | WebAuthn | Optional (peer) |
| `expo-sqlite` | Offline | Optional (peer) |
| `expo-network` | Offline | Optional (peer) |
| `expo-device` | Device | Optional (peer) |
| `expo-application` | Device | Optional (peer) |
| `expo-image-picker` | Upload | Optional (peer) |
| `expo-document-picker` | Upload | Optional (peer) |
| `expo-file-system` | Upload | Optional (peer) |
| `expo-av` | Media | Optional (peer) |
| `expo-barcode-scanner` | QR Scanner | Optional (peer) |
| `expo-sharing` | Share | Optional (peer) |
| `expo-clipboard` | Clipboard | Required (peer) |
| `expo-haptics` | Haptics | Required (peer) |
| `expo-linking` | Deep Links | Required (peer) |
| `react-native-passkeys` | Passkeys | Optional (peer) |
| `react-native-ssl-pinning` | Cert Pinning | Optional (peer) |
| `victory-native` | Charts | Optional (peer) |
| `react-native-markdown-display` | Markdown | Optional (peer) |
| `rn-emoji-keyboard` | Emoji Picker | Optional (peer) |
| `react-native-syntax-highlighter` | CodeBlock | Optional (peer) |
| `@10play/tentap-editor` | RichTextEditor | Optional (peer) |
| `@gorhom/bottom-sheet` | BottomSheet | Required (peer) |
| `react-native-reanimated` | Animations | Required (peer) |
| `react-native-gesture-handler` | Gestures | Required (peer) |
| `react-native-safe-area-context` | SafeArea | Required (peer) |
| `react-native-svg` | Charts/QR | Required (peer) |

---

## Appendix B: Missing Slingshot Auth Endpoints

The following endpoints are needed by Pocketshot 2.0 and should be verified as present in `slingshot-auth`:

| Endpoint | Module | Notes |
|----------|--------|-------|
| `GET /auth/passkey/register/options` | WebAuthn | Challenge for registration |
| `POST /auth/passkey/register/verify` | WebAuthn | Verify registration |
| `GET /auth/passkey/login/options` | WebAuthn | Challenge for login |
| `POST /auth/passkey/login/verify` | WebAuthn | Verify login assertion |
| `GET /auth/passkey/credentials` | WebAuthn | List credentials |
| `DELETE /auth/passkey/credentials/:id` | WebAuthn | Remove credential |
| `GET /auth/mfa/recovery-codes` | MFA | Get recovery codes |
| `POST /auth/oauth/:provider/link` | OAuth | Link existing account |
| `POST /devices/register` | Native Push | Register device token |
| `DELETE /devices/register/:token` | Native Push | Unregister token |

---

## Appendix C: Slingshot Plugin → Pocketshot Module Mapping

| Slingshot Plugin | Pocketshot Module |
|----------------|-------------------|
| `slingshot-auth` | `src/auth/*` |
| `slingshot-push` | (Web Push — not needed on mobile) |
| `slingshot-native-push` *(new)* | `src/push/hook.ts` |
| `slingshot-deep-links` *(new)* | `src/deep-links/hook.ts` |
| `slingshot-community` | `src/community/*` |
| `slingshot-webhooks` | `src/webhooks/*` |
| `slingshot-organizations` | `src/organizations/*` |
| `slingshot-permissions` | `src/permissions/*` |
| `slingshot-search` | `src/search/*` |
| `slingshot-websockets` | `src/ws/*` |
| `slingshot-sse` | `src/sse/*` |
| `slingshot-embeds` | `src/ui/components/content/link-embed/` |
| `slingshot-emoji` | `src/ui/components/communication/emoji-picker/` |
| `slingshot-gifs` | `src/ui/components/communication/gif-picker/` |
| `slingshot-entity` | `pocketshot sync` (generates hooks from OpenAPI) |
| `slingshot-admin` | `pocketshot init --template admin` |
| `slingshot-m2m` | Not needed (mobile clients are user-facing) |
| `slingshot-saml` | Not in scope (enterprise SSO typically handled by IdP app) |
| `slingshot-scim` | Not in scope (user provisioning is backend-only) |
| `slingshot-oidc` | Not in scope |
