# PocketShot security and privacy threat model

Owner: PocketShot maintainers. Review cadence: every release candidate and after
changes to authentication, persistence, deep links, uploads, realtime, AI,
audio, billing, messaging, or moderation.

## Trust boundaries

| Boundary                     | Principal risks                                             | Required controls                                                                                         |
| ---------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| App ↔ Slingshot API          | token theft, replay, authorization bypass                   | TLS-only production URLs, secure token storage, refresh serialization, server authorization               |
| App ↔ deep/universal link    | forged route or identifier, open redirect                   | strict scheme/host/path allowlist, typed parameters, authorization after navigation                       |
| App ↔ realtime transport     | stale/forged/out-of-order events                            | authenticated channel, schema/version validation, cursor ordering, deduplication, snapshot reconciliation |
| App ↔ local persistence      | device extraction, cross-account disclosure                 | SecureStore for credentials, account-scoped SQLite data, explicit logout/deletion purge                   |
| App ↔ media provider         | oversized/malicious input, metadata leak                    | MIME/magic-byte/size checks, scoped permissions, lifecycle cleanup, server revalidation                   |
| App ↔ AI service             | prompt injection, unreviewed mutation, private context leak | explicit context policy, structured decoder, user review by default, idempotent audited actions           |
| Player ↔ public display      | answer/private metadata disclosure                          | allowlisted projection type; hidden fields never serialized                                               |
| App ↔ billing store/backend  | forged receipt, stale entitlement                           | app-owned store adapter, authoritative server verifier, pending/revoked deny access                       |
| User ↔ messaging/moderation  | harassment, blocked-user bypass, audit tampering            | revocation-aware messaging, report state machine, immutable audit entries, server enforcement             |
| Diagnostics ↔ vendor/support | credentials or personal data in telemetry                   | primitive allowlist, sensitive-key/value redaction, bounded exports, consent-aware app sink               |

## Persisted-data inventory

| Data                              | Storage                            | Retention/deletion                                                    |
| --------------------------------- | ---------------------------------- | --------------------------------------------------------------------- |
| Access/refresh credentials        | platform SecureStore               | cleared on logout, revocation, or account deletion                    |
| Realtime cursor/snapshot          | account-scoped SQLite              | bounded by channel; cleared with account data                         |
| Offline commands                  | account-scoped SQLite              | removed after acknowledgement/cancellation; cleared with account data |
| Drafts and workout sessions       | account-scoped SQLite              | user deletion, successful publish where configured, or account purge  |
| Pending media                     | sandbox files plus SQLite metadata | deleted after terminal upload/cancel or account purge                 |
| AI conversation/action provenance | app/server policy                  | app-owned retention; privacy export/deletion must include it          |
| Diagnostics buffer                | memory by default                  | bounded FIFO; discarded at process end or explicit export             |
| Entitlement state                 | app memory/cache                   | refreshed from authoritative backend; cleared with account data       |

The consuming app must implement one account-purge transaction covering all
account-scoped stores and request server deletion. A failed partial purge is a
release-blocking error surfaced to the user and diagnostics provider without
personal data.

## Abuse and failure cases

- Rate limits and server authorization remain authoritative; clients preserve
  structured retry timing and do not silently retry destructive actions.
- Block, ban, entitlement revocation, and removed-party events take effect
  immediately and survive reconnect/snapshot reconciliation.
- URLs supplied by users are treated as untrusted. Production network clients
  reject cleartext HTTP and deep links never directly become fetch targets.
- Support replay/diagnostic exports are versioned, bounded, and redacted.
- Dependency review runs at high severity in CI. Medium findings require an
  owner and written release decision; critical/high findings block release.

## Native dependency review

| Surface                         | Release control                                                                                           |
| ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Expo and React Native           | pinned to the tested Expo 57 compatibility line; `doctor` rejects an incompatible app dependency graph   |
| Expo native modules             | optional peers resolve only when called; generated native apps prove CocoaPods and Gradle integration     |
| iOS CocoaPods                   | generated from the clean consumer lockfile and compiled as the application scheme, not an arbitrary pod  |
| Android Gradle dependencies     | generated from the clean consumer lockfile and compiled on the current supported Android toolchain        |
| JavaScript production graph     | high/critical `npm audit` findings block CI                                                               |
| Release inventory and integrity | a CycloneDX production SBOM is retained as an artifact; registry publication uses trusted provenance      |
| Store/runtime credentials       | injected by EAS/store secret facilities; never placed in source, app config, SBOM, logs, or public env    |

Changing Expo/React Native compatibility lines, adding a native module, or
changing a plugin requires a clean iOS application build, Android application
build, production audit, regenerated SBOM, permission/privacy review, and
critical-path device run before the release candidate can be approved.

## Release evidence

`npm run check:security` scans tracked runtime/configuration sources and built
artifacts for private keys, credential-shaped assignments, cleartext production
URLs, required threat-model controls, dependency audit, SBOM, and provenance
configuration. CI generates and validates the production CycloneDX SBOM. Native
CI compiles generated iOS and Android application targets from a packed
PocketShot consumer. Device review must still verify OS backup behavior,
screenshots/app switcher privacy, clipboard handling, notification previews, and
platform privacy manifests.
