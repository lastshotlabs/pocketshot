# Public Surface Maturity

Pocketshot publishes explicit package entry points with different ownership and
maturity. This document defines what each label means. The machine-readable
source of truth is
[`config/public-surface-maturity.json`](../config/public-surface-maturity.json);
the package gate rejects unclassified exports and stale classifications.

Pocketshot is pre-1.0. A `stable` label means the project applies its strongest
current compatibility and verification standards. It is not a promise that
pre-1.0 releases will never contain breaking changes.

## Maturity

### Stable

- Used as a foundation across multiple reference applications.
- Covered by deterministic contract tests and packed-consumer verification.
- Breaking changes require an explicit release decision, release notes, and
  updates to representative consumers.
- Native behavior still requires the optional peer and platform support stated
  by that capability.

### Beta

- Supported for production evaluation and covered by package-level tests.
- Contract refinement is expected before Pocketshot 1.0.
- Consumers should import the focused entry point and pin Pocketshot while
  evaluating upgrades.
- Native capabilities may still be awaiting complete physical-device evidence.

### Experimental

- Incubated through reference products or release tooling.
- May change or be removed before 1.0 when product-specific assumptions are
  discovered.
- Does not define mandatory Pocketshot core behavior.
- Promotion requires repeated use, a domain-neutral contract, documented
  ownership, package budgets, and relevant device evidence.

## Ownership tiers

### Core

Factory runtime and Slingshot-facing client contracts.

| Entry point                              | Maturity | Purpose                                                                  |
| ---------------------------------------- | -------- | ------------------------------------------------------------------------ |
| `@lastshotlabs/pocketshot`               | Stable   | Factory runtime, API client, authentication bootstrap, and primary hooks |
| `@lastshotlabs/pocketshot/auth`          | Stable   | Native auth, account lifecycle, OAuth, MFA, passkeys, and token storage  |
| `@lastshotlabs/pocketshot/permissions`   | Stable   | Backend authorization and native permission orchestration                |
| `@lastshotlabs/pocketshot/organizations` | Beta     | Slingshot organization contracts and hooks                               |
| `@lastshotlabs/pocketshot/search`        | Beta     | Contract-driven Slingshot search hooks                                   |
| `@lastshotlabs/pocketshot/webhooks`      | Beta     | Slingshot webhook administration hooks and contracts                     |

### Native infrastructure

Reusable mobile behavior that is independent of a particular product.

| Entry point     | Maturity | Purpose                                                        |
| --------------- | -------- | -------------------------------------------------------------- |
| `realtime`      | Stable   | Ordered, resumable channels and reconciliation                 |
| `offline`       | Stable   | Durable mutation queues, optimistic state, and synchronization |
| `drafts`        | Stable   | Durable drafts, recovery, autosave, and conflicts              |
| `app-state`     | Stable   | Centralized native lifecycle coordination                      |
| `device`        | Stable   | Device information and capability hooks                        |
| `haptics`       | Stable   | No-op-safe native feedback                                     |
| `share`         | Stable   | Native sharing utilities                                       |
| `media`         | Beta     | Recoverable capture, transformation, upload, and analysis      |
| `upload`        | Beta     | Slingshot upload hooks and authorization boundaries            |
| `push`          | Beta     | Native push registration, lifecycle, and open routing          |
| `ai`            | Beta     | Durable streaming conversations and reviewed actions           |
| `audio`         | Beta     | Native playback and second-screen pairing                      |
| `billing`       | Beta     | Entitlements and injectable store adapters                     |
| `privacy`       | Beta     | Account data, relationships, export, deletion, and cleanup     |
| `observability` | Beta     | Lifecycle telemetry, diagnostics, flags, and rollout controls  |
| `accessibility` | Beta     | Accessibility contracts, auditing, and adaptive layout         |
| `biometrics`    | Beta     | Biometric gates and fresh-authentication controls              |
| `deep-links`    | Beta     | Link parsing, routing, deferred intent, and OAuth returns      |
| `sse`           | Beta     | Lifecycle-aware server-sent events                             |
| `theme`         | Beta     | Native appearance, tokens, preferences, and theme hooks        |
| `ws`            | Beta     | Legacy room WebSocket client and hooks                         |

The entries in this table use the prefix
`@lastshotlabs/pocketshot/<entry point>`.

### UI

| Entry point                   | Maturity | Purpose                                                                    |
| ----------------------------- | -------- | -------------------------------------------------------------------------- |
| `@lastshotlabs/pocketshot/ui` | Beta     | React Native components, tokens, actions, manifests, and headless UI hooks |

UI remains beta until the complex-component behavior backlog, focused export
work, accessibility evidence, and physical-device matrix are complete.

### Product kits

| Entry point      | Maturity     | Purpose                                                         |
| ---------------- | ------------ | --------------------------------------------------------------- |
| `coach`          | Experimental | Coaching, metrics, goals, training, and entitlement controllers |
| `party`          | Experimental | Party-game controllers, providers, decks, and replay            |
| `party-session`  | Experimental | Shared-device and separate-device session primitives            |
| `community`      | Experimental | Community hooks, contracts, controllers, and presets            |
| `community/core` | Experimental | Headless community state and reconciliation                     |

The entries in this table use the prefix
`@lastshotlabs/pocketshot/<entry point>`.

Kits are reference-backed accelerators. Product screens, copy, policy, pricing,
and backend rules remain application-owned. Kit behavior moves into core or
native infrastructure only after it has a domain-neutral contract and repeated
use outside its originating product.

### Tooling

| Entry point | Maturity     | Purpose                                                         |
| ----------- | ------------ | --------------------------------------------------------------- |
| `testing`   | Beta         | Deterministic reliability harnesses and fault injection         |
| `release`   | Experimental | Release control-plane, diagnostics, flags, and rollback helpers |

The entries in this table use the prefix
`@lastshotlabs/pocketshot/<entry point>`.

## Adding or promoting a surface

A new public entry point must:

1. have one owner and one ownership tier;
2. declare stable, beta, or experimental maturity;
3. explain why a new entry point is preferable to an existing one;
4. pass packed-consumer and package-budget checks;
5. include contract, failure, and recovery tests;
6. include physical-device evidence when behavior depends on native services;
7. update the machine-readable catalog and this document.

Promotion requires evidence that the higher maturity promises are already true.
It is not granted based on age or roadmap intent.
