# Pocketshot Architecture and Capability Status

> **Status:** Current
>
> **Updated:** 2026-07-31
>
> **Package baseline:** `@lastshotlabs/pocketshot@0.1.5`

This document replaces the historical Pocketshot 2.0 implementation draft. It
describes the package that exists today, the boundaries consumers can depend
on, and the evidence still required before a release can be called
device-certified.

For entry-point support levels, see
[`public-surface-maturity.md`](./public-surface-maturity.md). For planned work
and audit history, see [`roadmap.md`](./roadmap.md).

## Purpose and Boundary

Pocketshot is the React Native and Expo client framework for Slingshot-backed
applications. It owns reusable client runtime, native infrastructure, UI
primitives, composition helpers, and verification tooling.

Pocketshot does not own a consumer application's business rules, navigation
policy, store listing, pricing, legal declarations, credentials, or release
approval. Those remain with the consuming application.

```text
Slingshot / application API
          |
  generated contracts + ApiClient
          |
  createPocketshot(config)
    |        |          |
 runtime   native      UI runtime
 hooks     adapters    + components
    \        |          /
       consumer Expo app
```

## Runtime Architecture

`createPocketshot(config)` creates an isolated runtime. The API client, query
client, authentication state, storage, lifecycle coordination, and generated
hooks are scoped to that instance; the package does not rely on a shared
mutable singleton.

The runtime is organized into four layers:

1. **Transport and contracts** — HTTP, generated OpenAPI bindings, auth token
   handling, errors, WebSocket, SSE, and overridable endpoint contracts.
2. **State and native infrastructure** — app lifecycle, offline queues, drafts,
   realtime reconciliation, uploads, media, push, deep links, biometrics,
   permissions, haptics, audio, and device services.
3. **UI and composition** — tokens, actions, manifest rendering, workflows,
   presets, headless hooks, and 125 React Native component directories.
4. **Optional kits and tooling** — party, coach, community, release,
   observability, testing, and CLI surfaces. Their maturity is explicit in the
   public-surface catalog.

React Native APIs stay out of CLI execution paths. Node-only APIs stay out of
mobile runtime paths. Optional native packages are peer boundaries and fail at
the capability call site with a descriptive error when absent.

## Public Import Model

Use the narrowest published entry point that owns the capability:

```ts
import { createPocketshot } from '@lastshotlabs/pocketshot'
import { useOfflineStatus } from '@lastshotlabs/pocketshot/offline'
import { ButtonBase } from '@lastshotlabs/pocketshot/ui/components/forms/button'
```

The `@lastshotlabs/pocketshot/ui` barrel is supported for manifests, tokens,
actions, and catalog-wide tooling. Runtime consumers should use focused
`ui/components/<category>/<component>` paths for individual components. The
build emits ESM, CommonJS, and declarations for all 125 focused component
paths, and a package gate checks their existence and isolation from the full UI
barrel.

## Capability Status

| Area         | Current capability                                                             | Evidence boundary                                                                           |
| ------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Core         | Factory-scoped client, auth lifecycle, API contracts, query integration        | Unit, type, package, and consumer checks                                                    |
| Realtime     | WebSocket, SSE, subscriptions, reconciliation                                  | Unit/contract tests; device network transitions remain release evidence                     |
| Offline      | Network state, optimistic work, queues, drafts, SQLite adapters                | Deterministic tests and reference flows                                                     |
| Native       | Push, deep links, biometrics, permissions, haptics, app state, device metadata | Adapters and native compile/export checks; real hardware remains required                   |
| Media        | Upload authorization, resumable media, playback/audio lifecycle, sharing       | Unit/native checks; camera, microphone, interruptions, and storage pressure require devices |
| UI           | Tokens, manifests, actions, workflows, headless hooks, 125 components          | Colocated behavior suites for all 125 components plus catalog accessibility gate            |
| Product kits | Party, coach, community, billing and release helpers                           | Experimental/beta according to the maturity catalog                                         |
| CLI          | Project scaffold and OpenAPI synchronization                                   | CLI tests and generated-project checks                                                      |

Cursor-based list hooks accept `limit`, `cursor`, and sort direction where the
backend contract supports them. Paginated responses preserve both current and
next cursor information rather than silently collapsing list metadata.

## UI Confidence Contract

Every component directory contains a colocated `component.test.tsx`. Complex
surfaces additionally use a shared behavior contract that checks:

- representative rendering and stable test targets;
- accessible role and name on the primary interaction;
- callback behavior;
- a compact structural visual baseline;
- an empty, loading, or error state when applicable.

The static accessibility gate inspects interactive controls across the entire
catalog and the five product shells. It requires accessible roles and names,
allows explicitly inaccessible event-capture wrappers, verifies all 125
behavior suites, and checks shell touch-target minimums.

This static evidence is not a substitute for VoiceOver, TalkBack, Dynamic Type,
switch control, or physical touch-target testing.

## Verification and Release Meaning

Repository confidence is layered deliberately:

1. Typecheck, formatting, unit, contract, behavior, accessibility, security,
   performance, package, and public-surface gates.
2. Packed-consumer installation and representative Metro/Hermes bundling.
3. iOS simulator and Android emulator native compilation and Maestro flows.
4. Signed previews on named physical devices, including real push, deep links,
   permissions, biometrics, media/audio, lifecycle, accessibility, memory, and
   storage scenarios.
5. Consumer-owned TestFlight/Play submission and product acceptance.

Only level 4 is physical-device certification. A framework may be repository-
and simulator-ready while signed builds or app-store work remain externally
blocked.

## Compatibility and Ownership

Slingshot compatibility is contract-driven. A release record must name the
tested Slingshot contract/version, Expo and React Native versions, package
version and commit, package-size evidence, simulator/device evidence, known
limitations, and rollback target.

The consumer owns endpoint deployment, Expo/EAS project linkage, signing
credentials, Apple and Google accounts, device access, store metadata, rollout,
and final product acceptance. Pocketshot owns the reusable gates and must report
missing external prerequisites as blockers rather than treating them as passed.

## Document Authority

- [`engineering-rules.md`](./engineering-rules.md) defines implementation rules.
- [`public-surface-maturity.md`](./public-surface-maturity.md) defines API support
  promises.
- [`roadmap.md`](./roadmap.md) records audit findings, completed remediation,
  and remaining work.
- Release evidence under `docs/release/` records what was actually exercised.

Historical phase language from the original 2.0 draft is intentionally not
retained here. Git history remains the source for that superseded design plan.
