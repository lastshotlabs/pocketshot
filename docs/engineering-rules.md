# Engineering Rules

This is the extended reference for `CLAUDE.md`. The numbered rules in CLAUDE.md are canonical — this document provides the full rationale and mobile-specific detail behind each one.

---

## Project Status

**Pre-production. No external consumers.**

Change anything freely — no deprecation cycles, no migration guides, no backwards compatibility. If a pattern is wrong, fix it now. The only consumers are internal. This applies to manifests, config shape, generated scaffold output, and CLI templates.

---

## What Pocketshot Is

Pocketshot is the React Native/Expo client SDK for bunshot-powered backends. It is the mobile counterpart to Snapshot (web). Every Bunshot backend feature should be accessible from a native iOS and Android app built entirely with Pocketshot primitives.

**Three surfaces:**
1. **SDK** — TypeScript library. `createPocketshot(config)` factory returns all hooks. Targets iOS and Android via Expo.
2. **CLI** — `pocketshot init` (scaffold), `pocketshot sync` (OpenAPI codegen). Targets Node/Bun.
3. **Config-driven UI layer** _(in development)_ — StyleSheet-based design tokens, config-addressable React Native component library, screen composition from JSON manifest, inter-component data binding, action vocabulary.

The SDK and CLI are different execution contexts. React Native APIs (`AppState`, `SecureStore`, `Appearance`) must never appear in CLI code. Node-only APIs must never appear in SDK code.

---

## Shared Rules (inherited from the LastShot Labs engineering standards)

These apply equally to Bunshot, Snapshot, and Pocketshot. They are documented here for completeness.

### 1. Factory Pattern — No Singletons

`createPocketshot(config)` is the ONLY entry point. It returns a `PocketshotInstance` with every hook, manager, and client as a closure over the factory-created scope. No module-level globals, no shared mutable state between instances.

```ts
// Correct
const pocketshot = createPocketshot({ apiUrl: "https://api.example.com" })
export const { useUser, useLogin, useRoom } = pocketshot

// Wrong — never
let globalApiClient: ApiClient
export function useUser() { return globalApiClient.get("/auth/me") }
```

**Why:** Multiple instances (multi-tenant apps, tests, storybook) cannot share state. A singleton creates implicit coupling that is impossible to test cleanly and impossible to isolate.

### 2. No Backwards Compatibility

Delete old code entirely. No re-export shims. No deprecation notices. If something is wrong, fix it.

**Why:** Pre-production with no external consumers. Compatibility layers accumulate and make the codebase progressively harder to reason about. Fix it while it's free.

### 3. Hooks Are Closures

Every hook is created inside `createPocketshot` and captures `api`, `queryClient`, `tokenStorage`, etc. from the closure. No hooks that reach for global state.

```ts
// Correct
function createAuthHooks({ api, queryClient, tokenStorage, config }) {
  function useUser() {
    return useQuery({ queryKey: ["me"], queryFn: () => api.get(config.contract.endpoints.me) })
  }
  return { useUser }
}

// Wrong — never
const sharedApi = new ApiClient(...)
export function useUser() {
  return useQuery({ queryKey: ["me"], queryFn: () => sharedApi.get("/auth/me") })
}
```

### 4. Production-Grade Code

Complete, tested, supportable code in every phase. No TODOs. No stubbed bodies with `// TODO implement`. If the implementation is unclear, resolve the ambiguity before writing code — not after.

### 5. TypeScript Casts

`as unknown as T` only at opaque optional-dependency boundaries (e.g., `react-native-passkeys` types). No `any`. If a discriminated union narrows correctly, do not cast to override TypeScript's judgment.

### 6. No Import/Re-export Funnels

No barrel files funneling internals through a single `index.ts`. The package entry points (`src/index.ts`, `src/ui.ts`) define the public API. Everything else is internal and may be reorganized freely.

### 7. Minimal Public Surface

The less exported, the fewer breaking changes. Anything not explicitly exported from an entry point is internal. When in doubt, don't export.

### 8. Types in types.ts

Shared types live in the module's `types.ts`. Never define the same shape in two files. If two files independently define `AuthUser`, one is wrong.

### 9. Peer Dependencies Are Boundaries

React, React Native, TanStack Query, Jotai, and Zod are peer dependencies — the consumer's choice. Never import them in a way that forces the consumer to take a specific version. The SDK must tree-shake cleanly.

Optional-feature peers (`expo-notifications`, `expo-local-authentication`, `react-native-passkeys`) are declared as both optional and peer. The bundle loads without them; a descriptive error is thrown at call time if a module is invoked without its peer installed.

### 10. Contract-Driven API Layer

Auth endpoints, community endpoints, webhook endpoints — all defined in contract objects. Override a contract to change an endpoint path without rewriting client code. All new domain modules follow the contract pattern.

```ts
const contract = mergeContract(apiUrl, {
  endpoints: { login: "/custom/auth/login" }
})
```

### 11. No Shell Interpolation in CLI

CLI commands use structured arg passing (`spawnSync(cmd, [arg1, arg2])`, not template strings). User-controlled values never pass through shell interpretation.

### 12. Templates Are Pure Functions

Every CLI template (`src/cli/templates/*.ts`) returns a string. No filesystem access inside template functions. The scaffold layer handles writing. This makes templates trivially testable with string assertions.

### 13. Section Markers for Generated Files

Generated files include `// --- section:name ---` / `// --- end:name ---` markers so consumers can override specific sections without replacing the entire file.

### 14. Test What You Ship

| Layer | Tool |
|-------|------|
| SDK hooks | vitest + React Native Testing Library |
| Zod schemas | vitest |
| CLI templates | vitest string assertions |
| UI components | vitest + RNTL |
| E2E critical paths | Maestro |

No live network in unit or integration tests. Mock the API client. E2E runs against a local bunshot instance.

### 15. JSDoc on Public API

Every exported function, hook, type, and class has up-to-date JSDoc. When you change a signature, param, return value, or behavior — update the JSDoc in the same commit. Stale or absent docs on public API surface is a bug.

### 16. Documentation Parity

Any change to a public API, config option, behavior, or concept documented in `docs/` must be reflected there in the same commit. Before closing work, independently verify: does every `docs/` page that references this feature still describe reality?

---

## SDK Patterns

### 17. SSE Manager Pattern

One `SseManager` per endpoint per factory instance, stored in a `Map<endpoint, SseManager>`. Never create a new connection per hook call. The registry pattern: first call creates the manager, subsequent calls return the same one.

On app background: close the connection (battery / network). On foreground: reconnect with exponential backoff (start 1s, max 30s). Both triggered by subscribing to `AppStateManager`.

### 18. WebSocket Manager Pattern

One `WebSocketManager` per factory instance, stored in a Jotai atom, lazy-initialized on first `useWebSocketManager` call. All hooks share the same connection. Reconnect on background→foreground via `AppStateManager`. Token included in query string at connection time.

### 19. TanStack Query as Server State Cache

All server state flows through `queryClient`. Mutations invalidate the relevant queries. The `queryClient` is created once per factory call with config-driven `staleTime` and `gcTime`. Never let stale data persist after a write.

### 20. Pluggable Token Storage

`createSecureStoreStorage(key)` is the default implementation. The `ApiClient` receives the storage instance, not a raw token. Never hardcode where tokens live. This makes storage swappable for testing (in-memory) without touching client code.

### 21. CLI Scaffold is Additive

`pocketshot init` creates files. It never overwrites existing files without a confirmation prompt. `pocketshot sync` is the only operation that safely overwrites generated files (because they are generated — hand edits should not exist there).

---

## Mobile Platform Rules

**These rules are unique to Pocketshot.** They exist because React Native has fundamentally different constraints from browser environments. Each rule maps to a real category of failures (crashes, battery drain, bad UX, App Store rejections, accessibility failures).

### 22. Platform-Native, Not Web-Ported

Every integration point uses the mobile-native solution. There is no acceptable alternative.

| Web Pattern (Snapshot) | Mobile Pattern (Pocketshot) |
|------------------------|----------------------------|
| `localStorage` | `expo-secure-store` |
| CSS modals / drawers | `@gorhom/bottom-sheet` |
| Web Push API | `expo-notifications` + FCM/APN |
| WebAuthn browser API | `react-native-passkeys` (platform authenticator) |
| CSS custom properties | StyleSheet token objects + `useTokens()` |
| IndexedDB | `expo-sqlite` |
| TanStack Router (URL-based) | `expo-router` (file-based, stack/tabs/drawer) |
| Service workers | N/A — not available in React Native |

Using a web pattern on mobile either won't compile, will crash at runtime, or will produce a user experience that feels foreign to the platform.

### 23. AppStateManager Is the Only Place for AppState

All foreground/background handling goes through the factory-created `AppStateManager`. Individual modules (SSE, WebSocket, biometric gate, offline sync) subscribe to it. No direct `AppState.addEventListener` calls anywhere except in `AppStateManager` itself.

**Why:** Multiple `AppState.addEventListener` registrations across modules create race conditions, duplicate reconnects, and make it impossible to control ordering. One manager, one source of truth.

### 24. FlatList for All Variable-Length Lists

Never use `ScrollView` + `Array.map` for lists that can have more than ~20 items. Always use `FlatList` or `SectionList`. Virtualization is mandatory.

**Why:** `ScrollView` renders all children at mount. A list of 500 community threads renders 500 views into memory simultaneously. On a mid-range Android device, this causes visible frame drops and OOM crashes. `FlatList` renders only what's on screen.

Exception: Truly static, short lists (e.g., 3-5 settings options) can use `ScrollView` + map.

### 25. useNativeDriver Always

All `Animated` API calls must include `useNativeDriver: true`. If a property cannot be natively driven (layout properties like `height`, `top`, `width`), use Reanimated worklets instead of falling back to JS-driven animation.

**Why:** JS-driven animation runs on the JS thread. The JS thread also runs React reconciliation, network calls, and everything else. Under load, JS-driven animation drops frames. Native-driven animation runs on the UI thread, completely independent of JS.

### 26. SafeAreaView Wraps All Screens

Every screen component uses `SafeAreaView` from `react-native-safe-area-context` or `useSafeAreaInsets()` for manual control. Never hardcode inset values.

**Why:** iPhone notch, Dynamic Island, home bar, Android status bar, and gesture navigation bar all consume screen space that varies by device. Hardcoded values will overlap content on some devices. The safe area API is the only correct abstraction.

### 27. Keyboard Avoidance Is Explicit

Every screen with form inputs uses `KeyboardAvoidingView` or `react-native-keyboard-aware-scroll-view`. The keyboard must never obscure the focused input field.

**Why:** The keyboard overlays content. Unlike the web (where browsers adjust scroll position), React Native screens don't move automatically. Users who can't see the input they're typing in will not use the app.

The pattern:
```tsx
<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
  <ScrollView>
    <TextInput ... />
  </ScrollView>
</KeyboardAvoidingView>
```

### 28. Platform.OS in Adapters, Not Components

Platform-specific behavior goes in:
- Adapter files (`src/auth/storage.ios.ts` / `storage.android.ts`)
- Component platform extensions (`button.ios.tsx` / `button.android.tsx`)
- The `_base/platform.ts` utility in the component library

Not in component render functions:
```ts
// Wrong
function MyComponent() {
  return Platform.OS === "ios" ? <IosVersion /> : <AndroidVersion />
}

// Correct — use platform file extensions
// my-component.ios.tsx + my-component.android.tsx
// React Native Metro resolves them automatically
```

**Why:** Platform checks scattered through components make each component harder to reason about and harder to test. Adapter files make platform differences explicit and testable in isolation.

### 29. Images Always Have Explicit Dimensions

Never render `<Image>` without specifying `width`, `height`, and `resizeMode`. Use `expo-image` instead of the core RN `Image` component.

```tsx
// Wrong
<Image source={{ uri: url }} />

// Correct
<Image source={{ uri: url }} style={{ width: 48, height: 48 }} resizeMode="cover" />
```

**Why:** Unconstrained images cause layout thrash — the component renders with zero size, then re-renders when the image loads. `expo-image` also provides proper disk + memory caching, blurhash placeholders, and better memory management than the core Image.

### 30. SecureStore Value Limit: 2048 Bytes

`expo-secure-store` enforces a maximum of 2048 bytes per value. Exceeding this silently fails (returns null on read). Never store large objects in SecureStore.

**What belongs in SecureStore:** Access tokens, refresh tokens, device IDs, biometric secrets, small config flags.

**What belongs in expo-sqlite or MMKV:** Large cached data, user profiles, offline mutation queues, anything that could grow.

### 31. All Interactive Elements Have testID

Every touchable, pressable, text input, and button has a `testID` prop. Convention: `{screen}-{element}-{action}` in kebab-case.

```tsx
<TouchableOpacity testID="login-submit-button" onPress={handleLogin}>
```

**Why:** Maestro (and Detox) E2E tests find elements by `testID`. Without it, tests must use fragile text/position selectors. Baking testIDs in at build time makes them stable across UI changes.

### 32. All Interactive Elements Have Accessibility Props

Every interactive element has:
- `accessibilityLabel` — What the element is (read aloud by VoiceOver/TalkBack)
- `accessibilityRole` — Type of element (`"button"`, `"tab"`, `"checkbox"`, etc.)
- `accessibilityHint` — What will happen when activated (if not obvious from the label)

```tsx
<TouchableOpacity
  accessibilityLabel="Submit login"
  accessibilityRole="button"
  accessibilityHint="Sends your email and password to sign in"
>
```

**Why:** App Store accessibility requirements. VoiceOver/TalkBack users. iOS App Store audits reject apps with significant accessibility failures.

### 33. Never Request Permissions at App Launch

Push notifications, camera, microphone, location, contacts, photo library — prompt for these contextually when the user triggers the relevant feature. Never on launch, never on first open.

**Why:** Permission prompts at launch get denied ~70% of the time because users don't trust an app they haven't used yet. Contextual prompts (e.g., "Allow camera access to scan a QR code?" when the user taps the QR scanner) get granted much more often. Apple's Human Interface Guidelines explicitly discourage launch-time permission requests.

Pattern:
```ts
// Wrong
useEffect(() => {
  Notifications.requestPermissionsAsync()  // on mount
}, [])

// Correct
function handleEnableNotifications() {
  const { status } = await Notifications.requestPermissionsAsync()
  // called from a user action, not automatically
}
```

### 34. GestureHandlerRootView Wraps the App Once

`<GestureHandlerRootView style={{ flex: 1 }}>` is placed in the root `_layout.tsx`. Never nest multiple. Never place it inside a screen component.

**Why:** Nesting `GestureHandlerRootView` causes gesture conflicts where inner gestures don't propagate correctly. One root, at the top.

### 35. Android Back Button Is Always Handled

Screens using custom navigation patterns, bottom sheets, or non-standard modals must handle the Android hardware back button. Default expo-router behavior handles stack navigation. Custom patterns need `useBackButton` or `BackHandler.addEventListener`.

**Why:** On iOS, back navigation is a swipe gesture or explicit button. Android has a dedicated hardware/software back button that users expect to "undo" the last modal, sheet, or navigation action. Unhandled: app exits unexpectedly or the sheet stays open with no dismiss path.

### 36. EXPO_PUBLIC_ Prefix for Client Environment Variables

All environment variables readable by the React Native runtime must use the `EXPO_PUBLIC_` prefix. Variables without this prefix are undefined in the app bundle.

```ts
// Correct
const apiUrl = process.env.EXPO_PUBLIC_API_URL

// Wrong — undefined at runtime
const secret = process.env.API_SECRET
```

Never put secrets in `EXPO_PUBLIC_` variables — they are bundled into the app binary and readable by anyone who decompiles it. Secrets go on the server.

### 37. Reanimated Worklets Stay in Worklet Context

Functions with the `'worklet'` directive run on the UI thread and cannot access:
- Jotai atoms
- React state (`useState`, `useReducer`)
- JS thread closures

To bridge back: `runOnJS(fn)(args)`.

```ts
// Correct
const animatedStyle = useAnimatedStyle(() => {
  'worklet'
  return { transform: [{ translateY: offset.value }] }
})

// Wrong — crashes at runtime
const animatedStyle = useAnimatedStyle(() => {
  'worklet'
  return { opacity: someJotaiAtom.value }  // cannot access atoms from worklet
})
```

### 38. Optional Peers Fail Loudly

When a module requires an optional peer dep, check at call time:

```ts
function useBiometrics() {
  let LocalAuthentication: typeof import("expo-local-authentication")
  try {
    LocalAuthentication = require("expo-local-authentication")
  } catch {
    throw new Error(
      "[pocketshot] useBiometrics() requires expo-local-authentication.\n" +
      "Install it: npx expo install expo-local-authentication"
    )
  }
  // ...
}
```

Never let missing optional deps surface as a cryptic native crash or a `undefined is not a function` error.

### 39. Haptics Are Always No-Op Safe

All haptic calls go through `src/haptics/` wrappers:

```ts
import { impact, notification, selection } from "@lastshotlabs/pocketshot"

impact("light")        // instead of Haptics.impactAsync(ImpactFeedbackStyle.Light)
notification("error")  // instead of Haptics.notificationAsync(NotificationFeedbackType.Error)
selection()            // instead of Haptics.selectionAsync()
```

The wrappers:
1. Check `await Haptics.isAvailableAsync()` before calling
2. Respect the device's haptic accessibility setting
3. No-op on simulators and devices without haptic hardware
4. Can be globally disabled via `createPocketshot({ haptics: false })`

Never call `expo-haptics` directly in components.

### 40. Fonts Load Before First Render

In root `_layout.tsx`:

```ts
const [fontsLoaded] = useFonts({ "Inter-Regular": require("./assets/fonts/Inter-Regular.ttf") })

useEffect(() => {
  if (fontsLoaded) SplashScreen.hideAsync()
}, [fontsLoaded])

if (!fontsLoaded) return null
```

Render app content only after fonts + auth state are resolved. The splash screen stays visible during this time via `SplashScreen.preventAutoHideAsync()` called at module top level.

**Why:** Rendering before fonts load causes a flash where system fonts appear briefly. This looks broken.

### 41. New Architecture Compatibility

React Native 0.76+ enables the New Architecture (Fabric renderer + TurboModules bridgeless) by default. All code must be compatible.

Rules:
- No synchronous native method calls on the old bridge
- No legacy `NativeModules.*` usage — use the TurboModule equivalents
- All third-party native modules must have New Architecture support before adding as a dependency
- When a dep lacks New Architecture support, use `newArchEnabled: false` in app.json only as a temporary measure with a tracked issue

### 42. Battery-Sensitive Operations Are Opt-In

Location, short-interval polling, background task scheduling: off by default. User explicitly enables. Document the battery impact in JSDoc.

```ts
/**
 * Subscribes to real-time location updates.
 * @param opts.interval - Update interval in ms. Minimum 5000ms recommended for battery.
 * Battery impact: HIGH when interval < 10000ms, MEDIUM otherwise.
 */
function useLocation(opts: { enabled: boolean, interval?: number }) { ... }
```

The `enabled` flag must be explicit — the hook does nothing when `enabled: false`. Never auto-start battery-sensitive operations based on implicit conditions.

---

## Config-Driven UI Rules

### Component File Structure

Every config-addressable component follows this structure. No exceptions.

```
src/ui/components/{group}/{component-name}/
  schema.ts          ← Zod config schema (source of truth for manifest)
  component.tsx      ← React Native implementation
  types.ts           ← z.infer<typeof schema> + internal types
  index.ts           ← exports schema + component only
  hook.ts            ← optional headless hook
  __tests__/
    component.test.tsx
    schema.test.ts
```

### Component Rules

43. **Schema is source of truth.** Config type is always `z.infer<typeof schema>`. Never define the config type manually.

44. **Config is the only interface.** Component receives `config` typed from the schema. Nothing else. No React props the manifest author has to know about.

45. **Components fetch their own data.** `data: "GET /api/users"` → component calls `useComponentData`. Parents never fetch and pass down.

46. **Components own all states.** Loading, error, empty, success — all internal. Users never write error boundaries for config-driven components.

47. **Components publish via `id`.** Current value (selected row, active tab, form data) goes to ScreenContext. Subscribers use `{ "from": "id" }`.

48. **No direct component-to-component imports.** Components communicate through the context system. A `List` dispatches `open-bottom-sheet`, not `<BottomSheet ... />`.

49. **Wrap with `<ComponentWrapper>`.** Provides `testID`, error boundary, Suspense, and id registration.

50. **Use tokens, never raw values.** `tokens.colors.primary`, not `"#2563eb"`. `tokens.spacing.md`, not `16`. `tokens.font.sizes.sm`, not `12`. If a token doesn't exist for what you need, add it to the schema.

### Token Rules

51. **Colors have foreground pairs.** `tokens.colors.primary` pairs with `tokens.colors.primaryForeground`. When using any color as `backgroundColor`, use its foreground companion for `color`.

52. **`tokens.colors.muted` is a background.** Very high lightness. Use `tokens.colors.mutedForeground` for text in muted areas.

53. **Every flavor defines all semantic colors.** Adding a new semantic color requires updating the Zod schema, the FOREGROUND_PAIRS map, and every flavor definition. A missing color falls back to hardcoded values and stops responding to theme changes.

54. **Dark mode flows through `resolveTokens()`.** Never manually override dark-mode colors outside the token resolution pipeline.

55. **Overlays animate.** Bottom sheets, modals, toasts use Reanimated for enter/exit transitions. Never `if (!isOpen) return null` without a transition — it causes jarring flashes.

### Token Reference (Canonical Names)

Token object structure. These are the ONLY valid paths. Accessing a non-existent path returns `undefined` and silently breaks theming.

```ts
tokens.colors.{
  primary, primaryForeground,
  secondary, secondaryForeground,
  muted, mutedForeground,
  accent, accentForeground,
  destructive, destructiveForeground,
  success, successForeground,
  warning, warningForeground,
  info, infoForeground,
  background, foreground,
  card, cardForeground,
  border, input, ring,
  chart1, chart2, chart3, chart4, chart5
}

tokens.radius.{ none, xs, sm, md, lg, xl, full }  // numbers (dp)

tokens.spacing.{ "2xs", xs, sm, md, lg, xl, "2xl", "3xl" }  // numbers (dp)

tokens.font.{
  sans, mono, display,        // font family strings
  sizes.{ xs, sm, base, md, lg, xl, "2xl", "3xl", "4xl" },  // numbers (sp)
  weights.{ light, normal, medium, semibold, bold }  // "300" | "400" etc.
}

tokens.shadow.{ none, xs, sm, md, lg, xl }  // ShadowStyle objects

tokens.animation.{ durationFast, durationNormal, durationSlow }  // ms

tokens.opacity.{ disabled, hover, muted }  // 0–1
```

**Names that do NOT exist (common mistakes):**
- ~~`tokens.colors.danger`~~ → use `tokens.colors.destructive`
- ~~`tokens.colors.cardBg`~~ → use `tokens.colors.card`
- ~~`tokens.font.sm`~~ → use `tokens.font.sizes.sm`
- ~~`tokens.colors.muted` as text~~ → use `tokens.colors.mutedForeground`

---

## Testing Reference

### SDK Hook Tests (vitest + RNTL)

```ts
// Wrap with renderHook, provide mock factory
const { result } = renderHook(() => useLogin(), {
  wrapper: ({ children }) => (
    <TestPocketshotProvider apiUrl="http://localhost:3000">
      {children}
    </TestPocketshotProvider>
  )
})
```

- Mock API client returns fixtures. No live network.
- Test: success path, error path, loading state, mutation side effects (cache invalidation).
- Auth hooks: test MFA redirect path, token storage, navigation calls.

### Schema Tests (vitest)

```ts
describe("stat-card schema", () => {
  it("accepts valid config", () => {
    expect(() => statCardSchema.parse(baseConfig)).not.toThrow()
  })
  it("rejects missing required fields", () => {
    expect(() => statCardSchema.parse({})).toThrow()
  })
  it("accepts from-ref for value field", () => {
    expect(() => statCardSchema.parse({ ...baseConfig, value: { from: "my-id" } })).not.toThrow()
  })
})
```

### Component Tests (vitest + RNTL)

```ts
it("renders with populated config", () => {
  const { getByTestId } = render(<StatCard config={baseConfig} />, { wrapper: TestProviders })
  expect(getByTestId("stat-card-value")).toHaveTextContent("1,234")
})

it("shows skeleton when loading", () => {
  mockApi.onGet("/api/stats").reply(200, /* delay */)
  const { getByTestId } = render(<StatCard config={{ ...baseConfig, data: "GET /api/stats" }} />)
  expect(getByTestId("stat-card-skeleton")).toBeTruthy()
})
```

### E2E Tests (Maestro)

Maestro YAML files in `e2e/`. Run against local bunshot + pocketshot dev build.

Critical paths that must have E2E coverage:
- Email/password auth flow (register → verify email → login → logout)
- MFA setup and verification
- OAuth login (GitHub)
- Community: create thread → reply → react
- Push notification opt-in
- Biometric gate enable → lock → unlock

---

## Definition of Done

```sh
bun run typecheck        # tsc --noEmit — zero errors
bun run format:check     # Prettier
bun run build            # tsup + oclif manifest
bun test                 # vitest run — all pass
```

Additionally:
- [ ] JSDoc updated on affected exports (same commit)
- [ ] `docs/` page created or updated (same commit)
- [ ] Showcase updated if a component changed (same commit)
- [ ] Rule 31: `testID` on all new interactive elements
- [ ] Rule 32: accessibility props on all new interactive elements

---

## Writing Specs

Follow `docs/spec-process.md`. Before writing a spec: audit what exists, surface decisions to the developer, resolve all ambiguity. Every path is spelled out — no TBDs, no "we'll figure it out later." See `docs/specs/` for current work.
