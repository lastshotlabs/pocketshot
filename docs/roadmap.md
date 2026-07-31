# Pocketshot Audit and Roadmap

> **Audited:** 2026-07-27; current-state update 2026-07-31
>
> **Baseline:** package `@lastshotlabs/pocketshot@0.1.5`
>
> **Scope:** Pocketshot only. Slingshot appears here solely as Pocketshot's
> backend contract and integration dependency.

## Executive Assessment

Pocketshot is already a substantial Expo/React Native framework rather than an
early SDK. It has a factory-scoped client runtime, native adapters, a large
component library, offline and realtime infrastructure, generated Slingshot
clients, product-oriented controller kits, reference applications, native build
automation, and a published package.

The strongest part of the project is verification. The current baseline passes
193 test files and 1,847 tests, typecheck, package/security/accessibility/
performance/parity gates, five reference shells, five product targets, and
optimized iOS and Android exports.

The next phase should emphasize consolidation and physical-device proof rather
than continued surface-area growth. Pocketshot's main risks are:

- package and declaration weight;
- an oversized public UI surface;
- physical-device accessibility and native-capability evidence;
- framework core mixed with product-specific kits and release applications;
- simulator/export evidence being treated too closely to device certification;
- old specifications and rules that no longer describe the shipped project.

## What Pocketshot Is

Pocketshot is the mobile-native client framework for Slingshot backends:

```text
Slingshot backend
  OpenAPI, auth, events, uploads, domain endpoints
                         |
                  Pocketshot core
   factory runtime, transport, sync, offline, realtime
        /                 |                  \
 native adapters      native UI          optional kits
 device lifecycle     components         party / coach /
 push / media         accessibility      community
        \                 |                  /
                  consumer Expo app
```

Pocketshot should make Slingshot capabilities usable from native applications
without importing web runtime assumptions. It should not own product screens,
store listings, business rules, product copy, pricing, or backend policy.

## Audit

### Healthy foundations

- `createPocketshot()` provides an isolated runtime and owns the API client,
  query client, token storage, auth hooks, realtime integrations, and lifecycle
  coordination.
- The package exposes 35 explicit entry points, including focused surfaces for
  auth, realtime, offline, drafts, media, upload, push, AI, audio, billing,
  privacy, observability, accessibility, app state, device services, and
  community.
- Runtime dependencies are lean: only two direct dependencies; React, React
  Native, Expo integrations, TanStack Query, Jotai, and native capabilities are
  expressed as peer or optional peer boundaries.
- Native-specific behavior is substantial: SecureStore auth, biometrics,
  contextual permissions, push, deep links, haptics, app-state coordination,
  SQLite-backed queues and drafts, resumable media, audio lifecycle, and billing
  adapters.
- Party, Coach, Community, Burndown, and Blankslate reference/product targets
  prove composition against packed artifacts rather than source-only imports.
- CI includes clean package checks, security and provenance, native compilation,
  optimized Hermes exports, Maestro workflows, and release verification.

### P0 findings — release confidence

#### 1. Physical-device certification remains open

Simulator builds and optimized exports are necessary, but they do not prove:

- VoiceOver and TalkBack reading order;
- Dynamic Type at large accessibility sizes;
- real push delivery and notification-open routing;
- camera, media, microphone, and audio interruption behavior;
- background/foreground timing and battery use;
- Universal Links, Android App Links, and OAuth return paths;
- biometric and store-billing behavior;
- low-memory and low-storage recovery.

Signed previews and a named physical-device matrix remain release gates.

#### 2. Static accessibility coverage is complete; device certification remains open

The gate now inspects named roles across 207 catalog controls, validates nine
reference-shell controls and touch targets, and requires colocated behavior
suites for all 125 components. This closes the static catalog gap. Focus order,
announcements, large-text layout, assistive technology, and real touch targets
remain physical-device evidence.

#### 3. Product readiness and framework readiness are conflated

The release plan combines framework publication with TestFlight/Play candidates,
store copy, screenshots, credentials, pricing, and owner acceptance. Pocketshot
can be release-ready while a product is not. Framework release gates should end
at clean installation, native compilation, reference certification, and
supported-device evidence. Store operations belong to each consumer app.

### P1 findings — package and maintainability

#### 4. Generated declarations dominate the package

The dry-run package is approximately:

- 3.1 MB compressed;
- 68.4 MB unpacked;
- 58 MB under `dist/types`;
- 56.6 MB of `.d.ts` content across 870 declaration artifacts.

Individual component schema declarations reach 1.7 MB. The current total-type
budget is 60 MB, so a green check allows only a small margin and normalizes a
distribution defect. This affects install time, registry storage, editor
indexing, TypeScript memory, and consumer CI.

The likely cause is repeated expansion of large inferred Zod/component schema
types. Public declarations should name and reuse stable types rather than
serialize the full inferred graph in every component.

#### 5. Focused UI entry points are complete

The package now emits ESM, CommonJS, and declarations for all 125
`ui/components/<category>/<component>` paths. An isolation gate proves focused
Button and ChatWindow imports remain substantially smaller than the full UI
barrel, while the barrel remains available for manifest and catalog tooling.

#### 6. Component behavior coverage is complete

All 125 component directories now have colocated behavior suites. The 19
complex surfaces share a stronger contract covering representative rendering,
stable test targets, accessibility semantics, interactions, structural visual
baselines, and alternate state where applicable.

#### 7. Public surface and product kits need explicit tiers

The package contains 1,090 TypeScript source files and 35 entry points. Large
modules such as `party-session`, Community controllers, Coach controllers, and
release control-plane logic sit beside foundational runtime primitives.

Classify every public surface:

- **stable core:** factory, API, auth, app lifecycle, transport;
- **stable native infrastructure:** offline, realtime, drafts, media, push;
- **UI:** reusable mobile components and tokens;
- **experimental kit:** party, coach, community orchestration;
- **testing/release tooling:** harnesses and certification helpers.

Versioning and support promises should follow the tier. Product-specific
behavior should graduate into stable infrastructure only after repeated reuse.

#### 8. Several files are maintenance hotspots

Notable single-file concentrations include:

- `src/party-session/index.ts` at roughly 43 KB;
- `src/cli/sync.ts` at roughly 41 KB;
- `src/community/controllers.ts` at roughly 34 KB;
- `src/community/hooks.ts` at roughly 28 KB;
- `src/ui.ts` at roughly 29 KB.

These are not defects by size alone, but they combine unrelated responsibilities
and increase review and declaration-expansion risk. Split by capability while
preserving explicit public entry points.

### P2 findings — truth and developer experience

#### 9. Project guidance is current

The former 2.0 draft has been replaced by current architecture and capability
status. Engineering guidance now describes the shipped UI layer, public
maturity is linked explicitly, and repository, simulator, physical-device, and
consumer-store evidence are distinguished.

#### 10. Two TODOs violate the project's own production rule

- `src/auth/storage.ts` records an unresolved storage-export migration.
- the generated push setup template leaves notification navigation as a TODO.

The first should become an owned roadmap item or be removed. The scaffold TODO
should be replaced with an explicit app-owned callback/route seam so newly
generated applications do not start with unfinished code.

#### 11. Slingshot compatibility is implicit

Pocketshot syncs from OpenAPI and uses overridable contracts, but the supported
Slingshot/Pocketshot combinations are not presented as a tested compatibility
matrix. High-value contracts—auth lifecycle, error envelopes, cursor
pagination, idempotency, SSE/WebSocket ordering, upload lifecycle, push token
registration, and schema evolution—need cross-repository fixtures or
candidate-consumer tests.

## Roadmap

### Progress

- **2026-07-27 — declaration boundary completed:** named component schema
  boundaries and size-bounded slot types reduced emitted declarations from
  56.6 MB to 8.1 MB. The packed artifact fell from 68.4 MB to 19.8 MB unpacked
  and from 3.1 MB to 2.3 MB compressed. CI now caps total declarations at 12 MB
  and individual declaration files at 512 KB. The full 1,847-test suite,
  typecheck, formatting, build, package budgets, and clean iOS/Android consumer
  bundle passed.
- **2026-07-27 — public-surface governance completed:** all 35 package entry
  points are classified as core, native infrastructure, UI, product kit, or
  tooling and as stable, beta, or experimental. A machine-readable catalog and
  package gate prevent unowned exports or silent maturity drift.
- **2026-07-27 — shipped TODOs removed:** SecureStore documentation now states
  the real required-peer boundary, and generated push setup requires an
  app-owned, typed notification-routing callback instead of scaffolding
  unfinished logging code.
- **2026-07-31 — focused UI and component confidence completed:** all 125
  focused component paths ship in ESM/CommonJS with declaration and isolation
  checks; all 125 components have behavior suites; and the accessibility gate
  inspects the full interactive catalog.
- **2026-07-31 — architecture record corrected:** the stale 2.0 phase draft was
  replaced with current architecture, capability, ownership, and release-proof
  documentation.

### Horizon 0 — Correct the record

**Outcome:** source, docs, status, and release terminology agree.

- Replace the stale 2.0 draft with current architecture and capability status;
  retain historical material under a clearly historical location.
- Publish the public-surface maturity table: core, native infrastructure, UI,
  experimental kits, testing, and release tooling.
- Split framework release readiness from consumer app-store readiness.
- Rename gates so static, simulator, and physical-device evidence cannot be
  confused.
- Remove both shipped TODOs by making their ownership and extension seams
  explicit.

**Exit gate:** a new consumer can determine what is stable, experimental,
app-owned, device-certified, or externally blocked without reading source or
worklogs.

### Horizon 1 — Shrink and stabilize the package

**Outcome:** the package installs and typechecks like a framework, not a source
archive.

- Diagnose declaration expansion using representative component schemas and
  TypeScript declaration tracing.
- Replace repeated inferred declaration graphs with named public contract types
  and intentionally hidden internal schema implementation types.
- Ratchet total declarations from 56.6 MB toward an initial ceiling below
  20 MB, then lower it based on consumer/editor measurements.
- Generate focused UI component or category exports.
- Add clean Metro/Hermes import-isolation fixtures for core, one simple
  component, one complex component, and each optional native capability.
- Track packed compressed size, unpacked size, declaration bytes, install time,
  editor/typecheck memory, and reference bundle deltas in CI.

**Exit gate:** a clean consumer imports core or one UI primitive without parsing
or bundling unrelated kits and components; declaration size is materially below
the current baseline.

### Horizon 2 — Complete component confidence

**Outcome:** the supported UI catalog has behavioral and accessibility evidence.

- Add colocated suites for the 19 uncovered complex components.
- Standardize a native component harness covering:
  - default and controlled rendering;
  - touch, keyboard, and screen-reader interactions;
  - loading, empty, error, disabled, offline, and destructive states;
  - token, slot, and large-text behavior;
  - stable test IDs and touch targets;
  - platform adapter boundaries.
- Upgrade the accessibility gate from reference-shell grep checks to
  component-level semantic assertions and manual device evidence.
- Add visual baselines on representative compact and modern phone sizes.
- Require behavior and accessibility tests for every new public component.

**Exit gate:** every stable component has behavior, accessibility, and visual
evidence; exceptions are classified as experimental and documented.

### Horizon 3 — Harden Slingshot integration

**Outcome:** Pocketshot upgrades safely with Slingshot rather than merely
compiling against generated OpenAPI.

- Publish a tested compatibility tuple for Pocketshot, Slingshot, Expo, React
  Native, and `frontend-contract`.
- Add candidate tests against real Slingshot OpenAPI and deterministic service
  fixtures for auth, errors, pagination, idempotency, realtime ordering,
  uploads, push, and permission revocation.
- Make `pocketshot sync` reproducible: stable output, drift detection,
  multi-schema support, selective generation, and actionable diagnostics.
- Extend `pocketshot doctor` to report schema drift, backend capabilities,
  registry access, peer compatibility, native configuration, and missing
  optional dependencies.
- Define additive and breaking schema-evolution policy with migration output.

**Exit gate:** a Pocketshot release candidate is tested against the supported
Slingshot candidate and representative applications before publication.

### Horizon 4 — Certify the native core

**Outcome:** the framework is proven on physical iOS and Android devices.

- Produce signed development and preview builds with reproducible configuration.
- Test current and previous supported iOS/Android versions across a compact
  iPhone, modern iPhone, Pixel-class Android, and constrained Android device.
- Exercise:
  - cold start, restore, background/foreground, and process death;
  - offline start, poor network, reconnect, queue drain, and conflict;
  - push delivery/open, deep links, OAuth return, and revoked authorization;
  - camera/media, audio interruption/routes, biometrics, and billing sandbox;
  - VoiceOver/TalkBack, large text, reduced motion, orientation, contrast;
  - long sessions, list memory, storage pressure, battery, and thermal behavior.
- Store exact commit, package, device, OS, artifacts, metrics, and findings in
  the release evidence ledger.

**Exit gate:** stable core capabilities pass the named device matrix with no
open critical/high findings and explicit disposition for lower-severity issues.

### Horizon 5 — Govern kits and product reuse

**Outcome:** Pocketshot stays a focused framework while product learnings remain
reusable.

- Keep Party, Coach, and Community kits experimental until their contracts are
  proven across more than one consumer.
- Move product screens, copy, policy, pricing, and store configuration out of
  framework ownership.
- Extract only domain-neutral primitives that demonstrate repeated use:
  reliable sessions, reviewed AI actions, media pipelines, reconciliation,
  unread state, privacy controls, and authorization revocation.
- Give each kit an owner, supported backend capability set, stability level,
  bundle/declaration budget, and removal criteria.
- Continue using reference products as release certification without treating
  product parity as automatic core-framework scope.

**Exit gate:** every public kit surface has explicit ownership and maturity, and
new framework APIs require evidence of cross-product reuse.

### Horizon 6 — Production operations

**Outcome:** Pocketshot releases are predictable and supportable.

- Define semver, support windows, Expo/RN upgrade cadence, security response,
  and breaking-change policy.
- Automate changelog, API-surface comparison, compatibility matrix, provenance,
  SBOM, packed-consumer tests, and prerelease promotion.
- Provide privacy-safe lifecycle telemetry and support diagnostics for auth,
  reconnect, offline queue, push, media, AI, audio, and billing.
- Test kill switches, feature flags, rollback, hotfix, local-data cleanup, and
  recovery procedures.
- Let each consuming app own TestFlight/Play submission, legal declarations,
  screenshots, pricing, rollout thresholds, and product acceptance.

**Exit gate:** a framework release can be promoted or rolled back independently
of any product's app-store schedule.

## Immediate Sequence

1. Publish the Slingshot/Pocketshot compatibility matrix and candidate tests.
2. Complete signed preview builds and the physical-device matrix.
3. Separate Pocketshot framework releases from product store submissions.
4. Record owner acceptance after external release prerequisites are satisfied.

## Release Scorecard

Every release should report:

- package version and commit;
- tested Slingshot, Expo, React Native, and contract versions;
- compressed, unpacked, declaration, ESM, CJS, and Hermes size deltas;
- install, typecheck, and representative bundle performance;
- unit, contract, reference, simulator, and physical-device evidence;
- component behavior and accessibility coverage;
- supported and experimental entry points;
- security, privacy, provenance, and dependency results;
- known limitations, external blockers, and rollback target.
