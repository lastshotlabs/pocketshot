# @lastshotlabs/pocketshot

Expo / React Native framework library for Slingshot backends — scaffold a new app with `pocketshot init` or drop the runtime into an existing project.

## Registry setup

`@lastshotlabs/*` packages are published to **GitHub Packages**, not the public npm
registry. They're public, but GitHub still requires authentication to install them.
One-time setup:

1. Create a GitHub [personal access token](https://github.com/settings/tokens/new)
   with the **`read:packages`** scope.
2. Add to your project's `.npmrc` (or `~/.npmrc`):

   ```ini
   @lastshotlabs:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
   ```

3. Export the token where you install: `export GITHUB_TOKEN=ghp_…` (do the same in CI).

The default registry stays npmjs.org, so your other dependencies are unaffected.

## Install

```bash
npm install @lastshotlabs/pocketshot
# peer dependencies
npm install expo-router expo-secure-store @tanstack/react-query jotai react react-native
```

## Quick start

Call `createPocketshot()` once in your app and destructure everything from it. The canonical pattern (from `lib/pocketshot.ts` in a scaffolded app):

```ts
import { createPocketshot } from '@lastshotlabs/pocketshot'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'
const WS_ENDPOINT = process.env.EXPO_PUBLIC_WS_ENDPOINT ?? 'ws://localhost:3000/chat'

export const pocketshot = createPocketshot({ apiUrl: API_BASE_URL, wsEndpoint: WS_ENDPOINT })

export const {
  useUser,
  useLogin,
  useRegister,
  useLogout,
  useVerifyMfa,
  useExchangeOAuthCode,
  useForgotPassword,
  useResetPassword,
  useVerifyEmail,
  useResendVerification,
  useSetPassword,
  useSessions,
  useRevokeSession,
  useDeleteAccount,
  useCancelDeletion,
  useMfaSetup,
  useMfaVerifySetup,
  useMfaDisable,
  useMfaMethods,
  useMfaResend,
  useEmailOtpEnable,
  useEmailOtpVerifySetup,
  useRoom,
  useRoomEvent,
  Providers,
  api,
  queryClient,
  tokenStorage,
} = pocketshot
```

Wrap your root layout with `Providers`:

```tsx
import { Providers } from '@/lib/pocketshot'

export default function RootLayout() {
  return (
    <Providers>
      <Stack />
    </Providers>
  )
}
```

## `pocketshot init`

```bash
npx pocketshot init
# or with flags
npx pocketshot init --yes          # skip prompts, use defaults
npx pocketshot init --dir ./myapp  # output to a specific directory
```

The interactive wizard asks 9 questions:

1. **Project name** — display name (e.g. `My App`)
2. **Package name** — slugified (e.g. `my-app`)
3. **App ID** — bundle identifier (e.g. `com.example.myapp`)
4. **Deep link scheme** — alphanumeric only (e.g. `myapp`)
5. **Auth screens** — forgot password, reset password, verify email, settings pages
6. **MFA screens** — TOTP setup + email OTP (only shown if auth screens selected)
7. **OAuth callback screen** — handles deep link after OAuth redirect
8. **WebSocket support** — WS client + `useRoom`/`useRoomEvent` hooks
9. **Git init** — initialise a git repo in the output directory

After scaffolding, run `expo start` then `npx pocketshot sync` to generate typed API hooks.

## `pocketshot sync`

Generates `lib/api/` and `lib/hooks/` from your Slingshot OpenAPI spec.

```bash
npx pocketshot sync --file openapi.json       # from a local spec file
npx pocketshot sync --api http://localhost:3000/openapi.json
npx pocketshot sync --watch                   # re-generate on spec changes
```

Additional flags:

| Flag                         | Default            | Description                                      |
| ---------------------------- | ------------------ | ------------------------------------------------ |
| `--api-dir <dir>`            | `lib/api`          | Output directory for generated API functions     |
| `--hooks-dir <dir>`          | `lib/hooks`        | Output directory for generated React Query hooks |
| `--types-path <path>`        | `lib/types/api.ts` | Path for generated TypeScript types              |
| `--pocketshot-import <path>` | `@/lib/pocketshot` | Import path used in generated hooks              |
| `--zod`                      | off                | Also generate Zod schemas                        |

Project-level defaults live in `pocketshot.config.json` at your project root.

## Runtime API

### `createPocketshot(config)`

| Field        | Type     | Default              | Description                                                                                               |
| ------------ | -------- | -------------------- | --------------------------------------------------------------------------------------------------------- |
| `apiUrl`     | `string` | required             | Slingshot backend base URL                                                                                |
| `wsEndpoint` | `string` | —                    | Full WebSocket endpoint URL including path (e.g. `ws://host/chat`). Optional — omit to disable WebSocket. |
| `tokenKey`   | `string` | `"pocketshot_token"` | Key name in `expo-secure-store`                                                                           |
| `loginPath`  | `string` | `"/(auth)/login"`    | Route to redirect to on logout / unauthenticated                                                          |
| `homePath`   | `string` | `"/(app)/"`          | Route to redirect to after login                                                                          |
| `mfaPath`    | `string` | `"/(auth)/mfa"`      | Route to redirect to when MFA is required                                                                 |
| `staleTime`  | `number` | `300000`             | React Query stale time in ms                                                                              |

### Hooks

**Auth**

| Hook            | Description                                                           |
| --------------- | --------------------------------------------------------------------- |
| `useUser()`     | Current user (`GET /auth/me`), returns `{ user, isLoading, isError }` |
| `useLogin()`    | Login mutation — handles MFA redirect automatically                   |
| `useRegister()` | Register mutation — stores token and redirects to home                |
| `useLogout()`   | Logout mutation — clears tokens and redirects to login                |

**Account management**

| Hook                      | Description                                       |
| ------------------------- | ------------------------------------------------- |
| `useForgotPassword()`     | `POST /auth/forgot-password`                      |
| `useResetPassword()`      | `POST /auth/reset-password`                       |
| `useVerifyEmail()`        | `POST /auth/verify-email`                         |
| `useResendVerification()` | `POST /auth/resend-verification`                  |
| `useSetPassword()`        | `POST /auth/set-password` (change password)       |
| `useSessions()`           | `GET /auth/sessions` — list active sessions       |
| `useRevokeSession()`      | `DELETE /auth/sessions` — revoke a session by ID  |
| `useDeleteAccount()`      | `DELETE /auth/me` — delete account, clears tokens |
| `useCancelDeletion()`     | `POST /auth/cancel-deletion`                      |

**MFA**

| Hook                       | Description                                            |
| -------------------------- | ------------------------------------------------------ |
| `useVerifyMfa()`           | `POST /auth/mfa/verify` — complete MFA login challenge |
| `useMfaSetup()`            | `POST /auth/mfa/setup` — initiate TOTP setup           |
| `useMfaVerifySetup()`      | `POST /auth/mfa/verify-setup` — confirm TOTP setup     |
| `useMfaDisable()`          | `DELETE /auth/mfa` — disable TOTP                      |
| `useMfaMethods()`          | `GET /auth/mfa/methods` — list enabled MFA methods     |
| `useMfaResend()`           | `POST /auth/mfa/resend` — resend email OTP             |
| `useEmailOtpEnable()`      | `POST /auth/mfa/email-otp/enable`                      |
| `useEmailOtpVerifySetup()` | `POST /auth/mfa/email-otp/verify-setup`                |

**OAuth**

| Hook / function                      | Description                                                      |
| ------------------------------------ | ---------------------------------------------------------------- |
| `useExchangeOAuthCode()`             | `POST /auth/oauth/exchange` — exchange one-time code for session |
| `getOAuthUrl(provider, redirectUri)` | Build the OAuth initiation URL                                   |

**WebSocket** (only available when `wsEndpoint` is configured)

| Hook                                 | Description                                  |
| ------------------------------------ | -------------------------------------------- |
| `useRoom(room)`                      | Subscribe to a room, returns latest message  |
| `useRoomEvent(room, event, handler)` | Subscribe to a specific event type in a room |

These hooks retain the original unversioned room protocol. New applications that
need reconnect correctness, cursor resume, ordered delivery, or offline recovery
should use the reliable realtime channel below.

### Durable media pipeline

Import `MediaPipelineController` from `@lastshotlabs/pocketshot/media` for a
single recoverable capture-to-analysis workflow shared by iOS and Android. It
supports contextual camera/library permission results (including an app-settings
recovery action), metadata and quota validation, injected resize/compression and
orientation normalization, direct/presigned/resumable upload strategies,
progress persisted by byte offset, pause/cancel/retry, relaunch recovery,
idempotent analysis jobs, and temporary-file cleanup.

The native picker is deliberately injected so applications retain control of
their Expo dependency versions:

```ts
import * as ImagePicker from 'expo-image-picker'
import * as Linking from 'expo-linking'
import {
  createExpoMediaCaptureAdapter,
  createSQLiteMediaStorage,
  MediaPipelineController,
} from '@lastshotlabs/pocketshot/media'

const media = new MediaPipelineController({
  capture: createExpoMediaCaptureAdapter({
    imagePicker: ImagePicker,
    openSettings: Linking.openSettings,
  }),
  storage: createSQLiteMediaStorage(),
  upload: resumableUploadAdapter,
  transform: imageAndVideoTransformAdapter,
  analysis: coachAnalysisAdapter,
})

const item = await media.acquire('camera')
if (item) await media.run(item.id)
```

### Streaming AI conversations

`@lastshotlabs/pocketshot/ai` provides durable conversation history and a strict,
resumable streaming-turn controller. It applies ordered text deltas, structured
parts, citations, usage state, and action proposals; suppresses replayed events;
supports stop/retry/resume; and keeps conversation rename/archive/delete and
paginated history independent from UI.

Actions default to explicit review. Applications provide an action adapter and
call `confirmAction`, `rejectAction`, or `undoAction`; every proposal carries the
attempt, conversation, and message provenance needed for server-side
idempotency and auditing. Automatic commit is available only when
`reviewPolicy: 'auto'` is explicitly configured.

### Native audio and second screens

`@lastshotlabs/pocketshot/audio` supplies provider-neutral catalog and track
contracts, an ownership-safe playback state machine, interruption/background/
headphone-route policies, remote media commands, expiring pairing tokens, and a
typed display-only second-screen projection.

For Expo apps, install `expo-audio`, enable its background playback config
plugin when needed, and inject it with `createExpoAudioPlaybackAdapter`. On
Android, sustained background playback requires the generated foreground media
service and active lock-screen controls; on iOS it requires the generated audio
background mode. PocketShot’s adapter configures the runtime audio session and
lock-screen metadata, while the Expo plugin owns those native declarations.

### Coaching, metrics, workouts, and entitlements

`@lastshotlabs/pocketshot/coach` contains headless, injected controllers for
health and coaching products:

- `MetricLogController` deduplicates offline logs, acknowledges server IDs,
  exposes conflicts explicitly, and produces unit-normalized chart points.
- `GoalController` validates goals and computes bounded, unit-safe progress.
- `WorkoutController` builds programs and restores, deduplicates, and completes
  interrupted workout sessions.
- `EntitlementController` handles purchase, restore, refresh, active/grace/
  expired access, loading, and store failures through a `BillingAdapter`.

```ts
import {
  EntitlementController,
  MetricLogController,
  WorkoutController,
} from '@lastshotlabs/pocketshot/coach'

const metrics = new MetricLogController()
const workouts = new WorkoutController()
const entitlements = new EntitlementController(storeAdapter)
```

### Reliable realtime channels

Import the headless API from `@lastshotlabs/pocketshot/realtime`. Each channel
validates versioned events, applies them exactly once in cursor order, persists
its acknowledged cursor, reconciles gaps from an authoritative snapshot, pauses
in the background, and reconnects with heartbeat monitoring and exponential
backoff.

```ts
import {
  bindRealtimeLifecycle,
  createRealtimeChannel,
  createSQLiteRealtimeStorage,
} from '@lastshotlabs/pocketshot/realtime'
import { z } from 'zod'
import { pocketshot } from '@/lib/pocketshot'

const channel = createRealtimeChannel({
  channel: 'party:abc',
  url: 'wss://api.example.com/realtime',
  schemas: {
    payload: z.object({ title: z.string() }),
    state: z.object({ titles: z.array(z.string()) }),
  },
  getToken: () => pocketshot.tokenStorage.getToken(),
  refreshAuth: async () => {
    // Refresh the app session before the reconnect attempt.
  },
  fetchSnapshot: async (afterCursor) => {
    return pocketshot.api.get(`/parties/abc/snapshot?after=${afterCursor ?? ''}`)
  },
  reduce: (state, event) => ({
    titles: [...state.titles, event.payload.title],
  }),
  storage: createSQLiteRealtimeStorage(),
})

const unbindLifecycle = bindRealtimeLifecycle(channel, pocketshot.appStateManager)
const unsubscribe = channel.subscribe((state, diagnostics) => {
  console.log(state, diagnostics.state, diagnostics.lastCursor)
})

await channel.start()
```

`createSQLiteRealtimeStorage()` requires `expo-sqlite`. You can instead provide
your own `RealtimeChannelStorage` implementation; `MemoryRealtimeStorage` is
available for ephemeral sessions and tests. The server event envelope is:

```ts
type RealtimeEvent<T> = {
  version: number
  channel: string
  id: string
  cursor: number
  type: string
  timestamp: string
  payload: T
}
```

Call `unsubscribe()`, `unbindLifecycle()`, and `channel.stop()` when the owning
session is destroyed.

> **SSE (Server-Sent Events):** PocketShot also exports `SseManager` for
> one-way streams through the optional `react-native-sse` peer dependency.

### Durable offline commands

`@lastshotlabs/pocketshot/offline` provides a schema-versioned FIFO mutation
queue and replay processor. Every command has a stable idempotency key, retry
schedule, processing state, optional optimistic context, and recoverable
dead-letter state. The SQLite backend automatically recovers commands left in
`processing` after process death and migrates the original PocketShot queue.

```ts
import { OfflineCommandProcessor, OfflineQueue } from '@lastshotlabs/pocketshot/offline'

const queue = new OfflineQueue()
const command = await queue.enqueue({
  method: 'POST',
  path: '/community/threads',
  body: { title: 'Offline draft' },
  idempotencyKey: 'create-thread:local-123',
  optimisticContext: { localId: 'local-123' },
})

const processor = new OfflineCommandProcessor(queue, pocketshot.api, {
  onDeadLetter: async (failed) => {
    // Roll back or reconcile optimistic state using failed.optimisticContext.
  },
})
await processor.flush()
```

Replay sends `Idempotency-Key` on every attempt and preserves strict FIFO
ordering. Retryable failures use bounded exponential delay; terminal failures
remain visible through `queue.getDeadLetters()` until explicitly retried or
removed.

### Durable drafts and conflict-safe autosave

`@lastshotlabs/pocketshot/drafts` persists every accepted edit before scheduling
remote autosave. Local durability is separate from publish validation, so an
incomplete draft survives navigation or process death while `publishBlocks`
prevents an invalid publish.

```ts
import {
  bindDraftLifecycle,
  createDurableDraft,
  createSQLiteDraftStorage,
} from '@lastshotlabs/pocketshot/drafts'
import { z } from 'zod'

const draft = createDurableDraft({
  id: 'deck:123',
  initialValue: { title: '', cards: [] as string[] },
  initialServerVersion: 'etag-1',
  storage: createSQLiteDraftStorage(),
  publishSchema: z.object({
    title: z.string().min(1),
    cards: z.array(z.string()).min(1),
  }),
  saveRemote: async ({ value, expectedVersion, idempotencyKey }) => {
    return saveDeck(value, { expectedVersion, idempotencyKey })
  },
})

const unbindLifecycle = bindDraftLifecycle(draft, pocketshot.appStateManager)
await draft.initialize()
await draft.update((current) => ({ ...current, title: 'Party mix' }))
```

The snapshot exposes independent `isDirty`, `isSaving`, `health`,
`publishBlocks`, history, undo/redo and three-way conflict state. Resolve a
conflict with `keep_mine`, `use_server`, or a field-merge function. The drafts
entry point also includes import review with row-level errors/truncation and
bounded-concurrency bulk mutation utilities.

### Deterministic reliability testing

`@lastshotlabs/pocketshot/testing` provides a shared, sleep-free harness for
reproducing mobile failure modes in controller and reference-shell tests:

```ts
import {
  ReliabilityHarness,
  createRestartableOfflineStorage,
  disorderEvents,
} from '@lastshotlabs/pocketshot/testing'

const harness = new ReliabilityHarness({ online: true })
const storage = createRestartableOfflineStorage(harness.processStore)

await harness.network.flap(3)
harness.lifecycle.transition('background')
harness.restartProcess()

const delivery = disorderEvents(events, {
  order: [2, 0, 1],
  duplicate: [2],
})
```

The harness includes deterministic time, lifecycle transitions, network
generations, scripted resolve/reject/defer outcomes, persistent restartable
stores, event disorder, and interruptible transfers. The realtime, offline, and
draft adapters let the exact same failure scripts run against SDK controllers
and the Party, Coach, and Community acceptance shells.

**Community** (call `createCommunityHooks(api)` to create)

| Hook                                         | Description                                     |
| -------------------------------------------- | ----------------------------------------------- |
| `useListContainers(params?)`                 | List all containers (paginated)                 |
| `useGetContainer(containerId)`               | Get a single container                          |
| `useCreateContainer()`                       | Create a container                              |
| `useUpdateContainer()`                       | Update a container                              |
| `useDeleteContainer()`                       | Delete a container                              |
| `useListThreads({ containerId, ...params })` | List threads in a container                     |
| `useGetThread(threadId)`                     | Get a single thread                             |
| `useCreateThread()`                          | Create a thread                                 |
| `useUpdateThread()`                          | Update a thread                                 |
| `useDeleteThread()`                          | Delete a thread                                 |
| `useListReplies({ threadId, ...params })`    | List replies to a thread                        |
| `useGetReply(replyId)`                       | Get a single reply                              |
| `useCreateReply()`                           | Create a reply                                  |
| `useUpdateReply()`                           | Update a reply                                  |
| `useDeleteReply()`                           | Delete a reply                                  |
| `useAddThreadReaction()`                     | Add a reaction to a thread                      |
| `useRemoveThreadReaction()`                  | Remove a reaction from a thread                 |
| `useAddReplyReaction()`                      | Add a reaction to a reply                       |
| `useRemoveReplyReaction()`                   | Remove a reaction from a reply                  |
| `useListReports(params?)`                    | List reports (mod/admin)                        |
| `useCreateReport()`                          | File a report                                   |
| `useResolveReport()`                         | Resolve a report                                |
| `useListBans(params?)`                       | List bans (mod/admin)                           |
| `useCheckBan(userId, containerId?)`          | Check if a user is banned (scoped or site-wide) |
| `useCreateBan()`                             | Ban a user                                      |
| `useDeleteBan()`                             | Remove a ban                                    |
| `useListNotifications(params?)`              | List notifications for the current user         |
| `useMarkNotificationRead()`                  | Mark a notification read                        |
| `useMarkAllNotificationsRead()`              | Mark all notifications read                     |
| `useSearch(params)`                          | Search threads and replies (requires `q` param) |

```ts
import { createCommunityHooks } from '@lastshotlabs/pocketshot'
import { api } from '@/lib/pocketshot'

export const community = createCommunityHooks(api)
export const { useListThreads, useCreateThread, useCheckBan } = community
```

Community state controllers cover the mobile recovery and reconciliation layer
that sits below screens and above generated hooks:

| Controller                    | Guarantees                                                           |
| ----------------------------- | -------------------------------------------------------------------- |
| `CursorFeedController`        | Stable cursor merge, dedupe, stale-page rejection, optimistic upsert |
| `DiscussionController`        | Nested replies, tombstones, edit/delete, idempotent reactions        |
| `NotificationInboxController` | Sequence dedupe, unread state, category preferences                  |
| `MessagingController`         | Client-id dedupe, pending/ack/failure, authorization revocation      |
| `ModerationController`        | Report assignment/resolution/dismissal with an audit trail           |
| `PrivacyController`           | Block/mute plus export and deletion request lifecycles               |

```ts
import {
  CursorFeedController,
  DiscussionController,
  NotificationInboxController,
} from '@lastshotlabs/pocketshot'

const feed = new CursorFeedController<ThreadResponse>()
const discussion = new DiscussionController()
const notifications = new NotificationInboxController()
```

**Webhooks** (call `createWebhookHooks(api)` to create)

| Hook                                                  | Description                                                |
| ----------------------------------------------------- | ---------------------------------------------------------- |
| `useListWebhookEndpoints()`                           | List all registered webhook endpoints                      |
| `useGetWebhookEndpoint(endpointId)`                   | Get a single endpoint                                      |
| `useCreateWebhookEndpoint()`                          | Register a new endpoint                                    |
| `useUpdateWebhookEndpoint()`                          | Update an endpoint (PATCH)                                 |
| `useDeleteWebhookEndpoint()`                          | Soft-delete an endpoint                                    |
| `useListWebhookDeliveries({ endpointId, ...params })` | List delivery history for an endpoint                      |
| `useGetWebhookDelivery(deliveryId)`                   | Get a single delivery record                               |
| `useTestWebhookEndpoint()`                            | Fire a test delivery; invalidates delivery list on success |

> **No retry hook:** Slingshot manages retries internally via BullMQ. There is no client-triggered retry endpoint.

```ts
import { createWebhookHooks } from '@lastshotlabs/pocketshot'
import { api } from '@/lib/pocketshot'

export const webhooks = createWebhookHooks(api)
export const { useListWebhookEndpoints, useCreateWebhookEndpoint } = webhooks
```

**Provider**

| Export      | Description                                                             |
| ----------- | ----------------------------------------------------------------------- |
| `Providers` | Wraps `QueryClientProvider` + Jotai `Provider` — use at the root layout |

### Instance properties

| Property       | Description                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `api`          | `ApiClient` instance — call `api.get()`, `api.post()`, etc. directly                                                      |
| `queryClient`  | `QueryClient` instance — for manual cache invalidation                                                                    |
| `tokenStorage` | `TokenStorage` instance — `getToken`, `setToken`, `clearToken`, `getRefreshToken`, `setRefreshToken`, `clearRefreshToken` |

## Auth flow

|                |                                                                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Token storage  | `expo-secure-store`                                                                                                                            |
| Request header | `x-user-token: <jwt>`                                                                                                                          |
| Refresh        | `POST /auth/refresh` with `{ refreshToken }` in body; on success, retries original request once; on second 401, clears tokens                  |
| OAuth          | `expo-web-browser` opens `GET /auth/:provider`, deep link returns `scheme://auth/callback?code=xxx`, exchanged via `POST /auth/oauth/exchange` |
| WebSocket      | `wss://host/ws?token=<jwt>` (Slingshot accepts `?token=` for React Native clients)                                                             |

## Environment variables

| Variable                  | Default                    | Description                       |
| ------------------------- | -------------------------- | --------------------------------- |
| `EXPO_PUBLIC_API_URL`     | `http://localhost:3000`    | Slingshot backend base URL        |
| `EXPO_PUBLIC_WS_ENDPOINT` | `ws://localhost:3000/chat` | WebSocket endpoint URL (optional) |

## File structure

```
src/
  create-pocketshot.tsx   # createPocketshot() factory
  auth/
    hooks.ts              # createAuthHooks() — 22 hooks + getOAuthUrl
    storage.ts            # TokenStorage interface + createSecureStoreStorage()
  api/
    client.ts             # ApiClient + ApiError
  ws/
    index.ts              # PocketshotWS + createWsHooks()
  index.ts                # package barrel
  cli/
    index.ts              # CLI entry point (init + sync subcommands)
    prompts.ts            # 9 interactive prompts via @clack/prompts
    scaffold.ts           # pocketshot init file writer
    sync.ts               # OpenAPI → TypeScript codegen
    types.ts              # PocketshotScaffoldConfig interface
    templates/            # ~21 scaffold template generators
      app/                # screen templates (login, register, mfa, oauth-callback, settings, …)
      lib/                # lib/ template (pocketshot.ts, config.ts)
      app-json.ts         # app.json template
      env.ts              # .env template
      package-json.ts     # package.json template
      pocketshot-config.ts # pocketshot.config.json template
      tsconfig.ts         # tsconfig.json template
app/                      # reference implementation (Expo app using the package)
tests/                    # vitest test suite
```
