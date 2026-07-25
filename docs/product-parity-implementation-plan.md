# Pocketshot Product-Parity Implementation Plan

Status: active  
Updated: 2026-07-25  
Targets: iPhone and Android  
Reference products: Hitshot/Trivia Hitster, AICoach, SGForum, Burndown, Blank Slate

## 1. Definition of done

Pocketshot is ready when a consumer team can build the five reference experiences from
published package entry points without copying private application code, and signed iOS
and Android candidates prove the critical journeys on physical devices.

“Parity” means behavioral capability, not pixel-for-pixel cloning. A capability is complete
only when all of the following exist:

1. A documented, typed public API or a deliberately app-owned integration seam.
2. Deterministic unit or contract tests for success, failure, retry, and recovery paths.
3. A reference-shell journey that consumes a packed Pocketshot artifact. All five products
   require executable Expo shells; browser screenshots or headless-controller tests alone do not
   count as mobile parity.
4. Optimized Hermes exports for iOS and Android.
5. Accessibility, privacy, security, observability, and performance evidence appropriate to
   the capability.
6. Hosted CI evidence from a clean checkout.
7. Physical-device evidence when the capability depends on native hardware, OS lifecycle,
   notifications, media, audio, deep links, or store billing.

The web products remain the behavioral references. Pocketshot must expose mobile-native
interaction patterns and must not carry browser-only assumptions into its public contract.

## 2. Current baseline

### Implemented and certified locally

- Package foundation, generated API consumption, authentication storage, deep-link parsing,
  permissions, device state, sharing, haptics, search, uploads, organizations, and push hooks.
- Realtime channel/reconciliation primitives.
- Offline mutation queue and deterministic processor.
- Durable SQLite-backed drafts and recovery.
- Reliability harnesses and fault injection.
- Resumable media capture/upload/analysis pipeline.
- AI streaming conversations, citations, reviewed actions, undo, usage budgets, and trusted
  memory primitives.
- Native audio playback and second-screen redaction/projection primitives.
- Party, Coach, and Community clean-room reference shells with acceptance tests.
- Party session/timeline/token/challenge/host/deck/provider/replay controllers and projection
  redaction.
- Coach metrics, goals, training, offline conflict, entitlement, store-adapter, privacy, and
  reviewed AI-action controllers.
- Community feed, thread/reply, notifications, messaging, moderation, privacy, administration,
  feature-flag, and rollout controllers.
- Shared loading/error/empty/offline/stale/permission/removed states, accessibility contracts,
  performance budgets, structured lifecycle telemetry, diagnostics, and rollback runbooks.
- Security threat model, persisted-data inventory, redaction and authorization-revocation tests,
  dependency audit, CycloneDX SBOM, and build provenance.
- Packed-artifact verification and optimized Hermes exports for the existing Party, Coach, and
  Community shells on iOS and Android.

### Hosted certification complete

- Clean hosted CI, package tests, security gates, SBOM generation, and optimized exports.
- Real application-target native compilation for iOS and Android; the iOS gate validates the app
  workspace scheme rather than accepting a dependency/pod scheme.
- Release-mode iOS simulator and Android emulator Maestro jobs exist for Party, Coach, and
  Community. Burndown and Blank Slate shells and their four corresponding jobs remain to be
  built. The current six-job run must be green before expanding the matrix to ten jobs.

### Remaining release work

- Close any failure found by the final six-job Release-mode Maestro run and retain its artifacts.
- Run cross-product visual, Dynamic Type, VoiceOver, TalkBack, reduced-motion, orientation, and
  recovery certification on the physical-device matrix.
- Configure real Expo, Apple, Google, push, OAuth, associated-domain, billing, analytics, and
  production API credentials.
- Produce signed TestFlight and Play internal-testing candidates.
- Complete store privacy/data-safety declarations, metadata, screenshots, and review notes.
- Obtain product-owner acceptance, execute rollback/hotfix drills against the signed candidates,
  and approve staged production rollout.

## 3. Capability inventory

### 3.1 Hitshot / Trivia Hitster

#### Identity and entry

- Guest identity with durable seat/session restoration.
- Account sign-in and Spotify OAuth return.
- Create or join by room code, QR code, and deep link.
- Capability-aware entry when playback providers or permissions are unavailable.
- Seat claim, team selection, ready state, leave confirmation, and rejoin.

#### Match setup and content

- Quick match and configurable match setup.
- Presets: Classic, Pro, Expert, and Cutthroat.
- Deck selection, content preferences, teams, solo teams, target score, naming rules,
  challenge/steal rules, and host controls.
- Deck library browsing, ratings, discovery, moderation state, and versions.
- Deck builder: playlist import, paste track list, combine decks, search/add/replace tracks,
  audition, year correction, health validation, draft persistence, submit, approve, publish,
  archive, and CSV/JSON transfer.
- Spotify and Audius provider seams, preview fallback, and provider capability reporting.
- AI “digger” assistance through an explicitly reviewed content workflow.

#### Live party gameplay

- Authoritative ordered round state and idempotent commands.
- Shared-speaker playback gate, mute state, pause/resume, and reconnect.
- Active-team prompt, relative timeline placement, equal-year handling, resolution, and reveal.
- Naming guesses, token earn/spend/cap, free-card purchase, challenges, steals, skip, and host
  verdict override.
- Team rails, all-board view, race/score state, countdowns, reactions, and activity feed.
- Host booth for lobby administration, advancement, judging, player replacement/kick, token
  adjustment, pause/end/cancel, and absent-host recovery.
- Public TV projection with strict pre-reveal title/artist redaction.
- Connection state, stale-state detection, deterministic resume, host handoff, removed-player
  state, inactive-match handling, results, rematch, and replay export.

#### Hitshot release proof

- Multi-client deterministic simulation for host, two teams, and public display.
- Redaction sweep over every public/player projection before reveal.
- Audio interruption, route change, background/foreground, and reconnect scenarios.
- QR/deep-link join on physical iOS and Android devices.
- Complete match, challenge match, host-recovery match, and deck-publishing flows.

### 3.2 AICoach

#### Identity, onboarding, and account

- Register, verify email, sign in/out, forgot/reset password, OAuth return, and session restore.
- Unit/time-zone preferences and mobile-safe credential storage.
- Subscription status, checkout/customer-portal handoff, entitlement refresh, grace state, and
  restore-purchases seam.
- Export and deletion requests with visible lifecycle state.

#### Daily coach

- Streaming response lifecycle: queued, streaming, complete, interrupted, retrying, failed.
- Stop, retry/resume without duplicated text, citations, usage/remaining budget, and history.
- Proposed actions that require confirmation before logging; reject and undo after commit.
- Long-term memory list/create/edit/delete, source attribution, trusted status, and consent.
- Prompt-injection-resistant separation of model text from executable app actions.

#### Health and training

- Today view, goals editor, quick logging, body metrics, units, charts, and history.
- Training overview, program builder, workout execution, sets/reps/load/rest, completion,
  edits, and recovery after interruption.
- Photos: camera/library permission, preview, resumable upload, analysis status, retry/cancel,
  history, and deletion.
- Offline logging with optimistic UI, conflict reconciliation, idempotency, and sync status.
- Live invalidation/event updates without losing local edits.

#### AICoach release proof

- Stream interruption and exact resume, action confirmation/undo, and usage exhaustion.
- Offline metric/workout entry followed by conflict-safe synchronization.
- Camera denied/limited/granted, upload interruption, analysis resume, and deletion.
- Memory consent/edit/delete, data export, and account deletion.
- Billing purchase/restore/grace/cancel states through sandbox stores.

### 3.3 SGForum

#### Public discovery and identity

- SSR-compatible public home, communities, threads, replies, profiles, search, legal pages,
  sitemap, and robots metadata where a consumer supplies a web renderer.
- Register/login/OAuth/password recovery and onboarding.
- Profile, avatar, handle, biography, follows, blocks, mutes, and visibility controls.

#### Community participation

- Home/community feeds with deterministic ranking and cursor pagination.
- Community membership and roles.
- Compose thread/reply, rich text, drafts, attachments, previews, edits, deletes, and sharing.
- Nested replies, reactions, saved items, polls, and deep links to thread/reply anchors.
- Search across communities, threads, replies, and users.
- Notifications, unread synchronization, per-category preferences, and push handoff.
- Realtime feed updates with dedupe and stable scroll/anchor behavior.

#### Messaging

- Direct-message list/conversation, room list/conversation, membership, settings, unread counts,
  typing/presence, reconnect, authorization changes, attachments, and moderation boundaries.

#### Trust, safety, and administration

- Report thread/reply/user/message and block/mute controls.
- Community moderator queue with live updates, assignment, notes, actions, and audit history.
- Automod evaluation/enforcement with explainable policy results.
- Permission policy for topics, threads, rooms, DMs, moderators, and admins.
- Upload validation and authorization at both selection and server acceptance seams.
- Admin overview, users, user detail, profiles, spaces, space detail, reports, flags, events,
  and messaging.
- Privacy export/deletion and notification/privacy/security/account settings.
- Feature flags and safe rollout/rollback.

#### SGForum release proof

- Create community thread, reply, nested reply, reaction, poll vote, edit, delete, and search.
- Realtime notification/unread correctness across two clients.
- DM and room reconnect plus authorization revocation.
- Report-to-moderation resolution with audit trail.
- Block/mute privacy checks and data export/deletion.
- Feed ranking determinism, cursor stability, and no duplicate items.

### 3.4 Burndown

The web implementation is the behavioral reference. The native application must preserve both
separate-phone play and the one-shared-device/pass-the-phone mode.

#### Entry, identity, and content

- One-screen guest create/join, durable account sign-in, OAuth return, profile, invite code, QR,
  deep/universal link, seat claim/handoff, spectator entry, and optional TV projection.
- Quickplay and custom match setup with solo/table mode, lives, clock, warning threshold,
  per-round speed-up, challenge mode/window, board-exhaustion policy, host participation,
  admission policy, presets, and staged mid-game rules.
- Games dashboard with active/history states, leave, refresh, rematch, and deterministic recovery.
- Category-deck library and builder with browse/mine scopes, search, sort, create/edit/delete,
  validation, publishing workflow, optimistic state, and AI-assisted category composition.

#### Separate-phone gameplay

- Round intro that exposes the category and letter for the configured dwell.
- Viewer-relative turn state, actor-only “your turn” audio/haptic cue, visible action clock,
  warning state, pause/resume, background/foreground recovery, and no queued audio burst.
- Alphabet board with alive/burned/void semantics, typed burn submission, in-flight lock,
  rejection/retry, duplicate/idempotency protection, and board-exhaustion behavior.
- Overlap and serialized challenge paths, per-seat challenge affordance, visible challenge clock,
  “Nobody” outcome, vote/verdict, score/life mutation, elimination, watcher transition, and
  round summary.
- Host controls for advance, pause/resume, rules, score/life adjustment, player removal,
  end/cancel, absent-host takeover, and diagnostics.
- Reactions, activity, connection grace, scoreboard, results, idempotent rematch, and share.

#### Shared-device gameplay

- Public anonymous setup that never calls authenticated endpoints.
- Screen wake lock while a table match is active.
- Full-screen pass-to-player handoff curtain with large identity, privacy shielding, explicit
  tap-to-arm, and mute-independent haptic signaling.
- Per-seat action surfaces sized for 6–8 players, shared challenge/vote grid, one authoritative
  countdown, input locking, and safe restoration after refresh.
- Landscape tablet and 1920×1080 shared/TV layouts in addition to phone portrait.

#### Burndown release proof

- Complete separate-phone match through elimination/results/rematch with two or more clients.
- Complete shared-table match including pass-the-phone, serialized challenge, “Nobody,” and
  board exhaustion.
- Host disconnect/takeover, pause/resume, staged rule change, spectator/TV redaction, reconnect,
  process restart, and seat handoff.
- Actor-only sound/haptic verification and wake-lock/background lifecycle verification.

### 3.5 Blank Slate

The shipped web game and its native-track design specification are authoritative. Native is an
Expo/React Native application on Pocketshot, not a WebView or Capacitor wrapper.

#### Entry, identity, navigation, and content

- One-screen guest create/join, Apple and Google sign-in, passkey, secure token storage, profile,
  invite code, QR, deep/universal link, claim/handoff, spectator/TV, and host admission queue.
- Bottom tabs: Play, Games, Library, Build, You. Lobby, Play, Host, Reveal, and Results remain
  immersive full-screen routes without tabs.
- Quickplay and custom setup with prompt decks, host participation, target-score/fixed-round
  win modes, write timer, admission policy, presets, and staged mid-game rules.
- Prompt-deck library and builder with browse/mine, cue-content search, sort, create/edit/delete,
  prefix/suffix/infix blank validation, bulk input, autosave/versioning, publish workflow, and
  capability-gated AI cue generation.

#### Match gameplay

- Prompt/blank reveal, private slate entry with OS autocorrect/autocapitalization/spellcheck
  disabled, optimistic lock, five-second edit window, send failure/resend, reconnect draft
  restoration, and strict pre-reveal word redaction.
- Write-progress state that reveals participation but never words.
- Reveal stage with stable grouping, exact scoring for pairs/groups/unique answers, score flash,
  reaction overlay, payoff dwell, and reduced-motion equivalent.
- Host fix-up on the real slates: arm, merge, split, confirm, undo, and restoration of absorbed
  multi-member groups without changing scores incorrectly.
- Merge-vote ballot with cumulative approvals, revote removal, empty state, authorization, audit,
  and deterministic resolution.
- Round leaderboard, sudden death, target/fixed-round completion, results, native share, and
  idempotent rematch.
- Host controls for advance, pause/resume, staged rules, score adjustment, kick/block/unblock,
  seat handoff, end confirmation, absent-host takeover, and diagnostics.

#### Mobile-specific Blank Slate behavior

- Personal push only: turn-to-write, rematch, final score, and host knock. Per-room mute and quiet
  hours; no reaction or ambient-lock spam.
- Foreground rejoin restores socket and pending word; offline queue safely replays answer and
  merge-vote commands with idempotency.
- Haptics: light lock-in, success for a matched reveal, warning for rejected input.
- 44pt iOS minimum and 48dp Android primary targets, safe-area thumb docks, dark chalkboard token
  map, native status bar, icon/splash, and reveal-led store screenshots.

#### Blank Slate release proof

- Three-player round from join through private writing, reveal, host fix-up, merge vote, summary,
  results, and rematch on iOS and Android.
- Cross-client proof that no answer reaches another player or TV before reveal.
- Offline lock/resend, five-second edit across lifecycle transitions, process restart, seat
  handoff, host recovery, staged win-mode change, and signed-build push/deep-link journeys.
- VoiceOver/TalkBack ordering across SlateInput, RevealStage, fix-up, ballot, and results.

## 4. Target architecture

Pocketshot remains a layered package rather than an application framework:

```text
consumer app
  ├─ app-owned screens, navigation, copy, domain policy, and backend
  ├─ reference journeys proving recommended composition
  └─ Pocketshot
       ├─ domain-neutral UI components and accessibility contracts
       ├─ headless controllers/hooks
       ├─ native adapters
       ├─ offline/realtime/reliability infrastructure
       └─ generated transport/auth primitives
```

Rules:

- Public entry points are explicit and tree-shakeable.
- Controllers depend on injected storage, transport, clock, ID, wait, and native adapters.
- Commands carry idempotency keys; events carry stable IDs and monotonic sequence/version data.
- Server state, optimistic state, durable drafts, and ephemeral UI state are separate.
- Public/spectator projections use allowlists. Sensitive fields are never fetched and then hidden.
- AI output is data. Only typed, reviewed actions can mutate application state.
- Native dependencies are behind adapters so package tests stay deterministic.
- Reference shells install the packed artifact; they cannot import unpublished source by accident.

## 5. Workstreams and execution order

### Wave 0 — Baseline and clean-build gates

Deliverables:

- Keep package exports, packed-consumer verification, declaration budgets, formatting, typecheck,
  unit tests, audit, and clean iOS/Android Hermes export mandatory in CI.
- Make all five product-shell verifiers first-class CI jobs as each shell lands.
- Record bundle sizes and test counts as release evidence.

Exit gate:

- A clean checkout passes every non-device job twice consecutively.

### Wave 1 — Community reference shell

Deliverables:

- `examples/community` Expo shell with authentication boundary, feed, community, thread, compose,
  reply, reaction, poll, search, notifications, DM/room, profile/settings, report, and moderator
  queue journeys.
- A deterministic `CommunityDemoController` with offline drafts, optimistic mutations,
  reconciliation, realtime dedupe, cursor pagination, and authorization revocation.
- Acceptance tests for the SGForum release-proof journeys.
- Packed-artifact typecheck and optimized Hermes exports for iOS/Android.

Exit gate:

- Community shell passes locally and in hosted CI without source-only imports.

### Wave 2 — Missing shared domain primitives

Deliverables:

- Cursor feed controller: stable page merge, rank/version handling, refresh anchoring, optimistic
  insert/remove, and duplicate suppression.
- Thread/reply controller: nested reply graph, edits/deletes/tombstones, reactions, saves, polls,
  and deep-link anchor resolution.
- Notification/unread controller: per-channel counters, read cursors, realtime reconciliation,
  preferences, and push-open routing.
- Messaging controller: conversation/room membership, paged history, sends, attachments,
  typing/presence, reconnect, and permission revocation.
- Moderation controller: report submission, queue lifecycle, action confirmation, reason/audit
  data, and automod decision representation.
- Privacy controller: block/mute/visibility, export/delete requests, and local-data cleanup.

Exit gate:

- Public APIs documented; adversarial state-machine tests cover duplicate, reorder, reconnect,
  stale cursor, revoked access, and partial failure.

### Wave 3 — Product-depth completion

Party:

- Full timeline/token/challenge engine and host action surface.
- Deck library/builder/import/publish workflow.
- Provider capability, Spotify/Audius integration seams, and replay export.

Coach:

- Metrics/goals/charts/history and workout/program controllers.
- Offline conflict policies and live invalidation.
- Billing/entitlement controller and native store adapter contract.

Community:

- Full feed/search/profile/follow/block/mute/poll/save/notification/messaging/moderation coverage.
- Admin-oriented headless contracts where reuse is justified; admin screens remain app-owned.

Exit gate:

- Every item in Section 3 is marked implemented, app-owned by design, or blocked with an owner and
  external dependency. No unclassified gaps remain.

### Wave 4 — UI and accessibility conformance

Deliverables:

- Shared mobile patterns for loading/error/empty/offline/stale/permission/removed states.
- Dynamic Type/font scaling, VoiceOver/TalkBack labels and order, reduced motion, contrast,
  touch-target, keyboard, focus restoration, and screen-reader announcements.
- Light/dark/high-contrast token verification and safe-area/orientation behavior.
- Snapshot/reference visual coverage for all five shells on representative phone sizes.

Budgets:

- No critical accessibility violations.
- Every icon-only control has an accessible name and state.
- Primary journeys remain usable at 200% font scaling.
- Minimum touch target follows platform guidance.

### Wave 5 — Security, privacy, and abuse resistance

Deliverables:

- Threat model for auth tokens, deep links, realtime channels, media, AI actions, public
  projections, messaging, moderation, and local persistence.
- Storage inventory and deletion semantics for every persisted value.
- Redaction tests, authorization-revocation tests, upload validation, safe URL handling, log
  scrubbing, rate-limit surfaces, and dependency/license review.
- AI prompt/action boundary tests and moderation-policy auditability.

Exit gate:

- No open critical/high findings; medium findings have explicit owners and release decisions.

### Wave 6 — Observability and operational readiness

Deliverables:

- Structured lifecycle events for auth, deep-link entry, realtime reconnect, offline queue,
  media upload/analysis, AI stream/action, audio playback, billing, notifications, and moderation.
- Crash/error boundaries with correlation IDs and privacy-safe context.
- Service-level indicators: crash-free sessions, launch success, join success, reconnect success,
  queue drain latency, stream completion, upload completion, and push-open success.
- Feature flags, kill switches, staged rollout, rollback, support diagnostics, and runbooks.

Exit gate:

- Dashboards and alerts exist in the consuming app; a rollback drill and data-recovery drill pass.

### Wave 7 — Performance and device automation

Budgets are measured on representative low/mid-tier Android and supported iPhone hardware:

- Cold launch and interactive readiness budgets agreed and enforced.
- No dropped-frame regression in feed scroll, timeline placement, streaming text, or chat.
- Bounded memory during long feeds, image upload, audio playback, and long sessions.
- Offline database and queue growth limits.
- Bundle-size and native-binary deltas tracked.

Automation:

- Maestro journeys for entry/auth, Party match, Coach stream/photo/log, Community post/message,
  offline/reconnect, permissions, and deep-link opens.
- Platform-specific tests for push, backgrounding, audio interruptions, camera, and store billing.

### Wave 8 — Signed candidates and release

Deliverables:

- Unique bundle/application IDs, signing, entitlements, privacy manifests, permission copy,
  icons/splash, associated domains/app links, push credentials, and store metadata.
- EAS development/preview/production profiles with secret inventory and environment promotion.
- TestFlight and Play internal-testing candidates.
- Physical-device acceptance matrix across supported OS versions.
- Store privacy/data-safety declarations, support URL, deletion path, screenshots, review notes,
  release notes, and phased rollout.

Exit gate:

- Product owner signs off every critical journey on both platforms.
- CI, security, accessibility, performance, privacy, and operations gates are green.
- Rollback and hotfix paths are verified before production rollout.

## 6. Test matrix

Every stateful controller must cover:

- happy path;
- empty and boundary values;
- permission denied/limited/can-ask-again;
- offline before start and network loss mid-operation;
- timeout, cancellation, retry, and app restart;
- duplicate command/event and out-of-order event;
- stale local/server version and conflict;
- authorization or membership revoked mid-session;
- background/foreground and route unmount/remount;
- destructive-action confirmation and undo where possible;
- log/analytics redaction.

Platform matrix:

- Current and previous major iOS versions on at least one compact and one modern iPhone class.
- Current and previous major Android versions on a Pixel-class device plus one constrained device.
- Light/dark appearance, large text, screen reader, reduced motion, offline/poor network, and low
  storage.

## 7. Release evidence ledger

Each milestone records:

- commit SHA and package version;
- hosted CI run URL;
- unit/contract/E2E counts;
- iOS and Android Hermes artifact paths and sizes;
- physical devices/OS versions tested;
- screenshots or recordings for owner acceptance;
- security/accessibility/performance reports;
- known limitations, external dependencies, and rollback instructions.

Evidence is attached to the milestone ticket/checkpoint; “works locally” is never sufficient for
release certification.

## 8. External inputs and blockers

These do not block package-level implementation, but they block final production certification:

- Expo account access or `EXPO_TOKEN`.
- Apple Developer team, bundle identifiers, signing, APNs, associated domains, and App Store
  Connect access.
- Google Play Console app, signing, Firebase/FCM, App Links, and Play Billing access.
- Production API base URLs, OAuth client/redirect registrations, and universal/app-link hosting.
- Spotify application credentials and playback test account.
- Billing products, entitlement mapping, privacy/legal copy, support URLs, and retention policy.
- Error/analytics provider credentials and release ownership.
- Product-owner decisions for supported OS versions, pricing, branding, and final acceptance.

## 9. Release execution plan

### Gate A — Current-commit hosted proof

Owner: engineering

Inputs: current repository commit and GitHub-hosted runners

Target: same day

1. Require green CI and native-smoke runs for the exact release commit.
2. Require all six Release-mode Maestro jobs: Party, Coach, and Community on iOS and Android.
3. Inspect failure screenshots, view hierarchies, native logs, and test artifacts rather than
   accepting reruns without root-cause analysis.
4. Re-run the full local suite after any corrective commit and repeat all hosted checks.
5. Attach commit, run URLs, test count, SBOM, provenance, and export sizes to the evidence ledger.

Exit criteria:

- No failed, skipped, or silently substituted application target.
- Release apps launch without Metro and complete every automated critical journey.
- Packed consumers cannot import unpublished source.

### Gate B — Conformance and physical-device certification

Owner: mobile engineering and QA

Inputs: supported-device policy and physical devices

Target: one focused certification cycle after Gate A

1. Execute the Section 6 matrix on current and previous iOS/Android major versions.
2. Exercise compact and modern iPhones, a Pixel-class Android device, and one constrained Android
   device.
3. Certify 200% text, VoiceOver, TalkBack, reduced motion, light/dark appearance, safe areas,
   rotation, keyboard/focus order, and minimum touch targets.
4. Exercise background/foreground, process death, low storage, offline/poor network, permission
   denial, camera/library, audio interruption/route change, deep links, and push-open behavior.
5. Measure cold launch, interactive readiness, dropped frames, memory, queue/database growth, and
   long-session stability against recorded budgets.
6. Capture screenshots/recordings and file every deviation with severity, owner, and disposition.

Exit criteria:

- Zero critical accessibility or reliability defects.
- No unexplained performance regression or unowned conformance exception.
- Hitshot, AICoach, SGForum, Burndown, and Blank Slate critical journeys pass on both physical
  platforms.

### Gate C — Production service and signing configuration

Owner: release engineering with account owners

Inputs: the credentials and decisions listed in Section 8

Target: immediately when external access is supplied

1. Allocate production bundle/application IDs and configure Apple/Google signing.
2. Configure APNs/FCM, associated domains/App Links, OAuth redirects, Spotify playback, billing
   products, API environments, analytics/error reporting, and feature-flag ownership.
3. Publish privacy, terms, support, and account/data-deletion URLs.
4. Populate EAS development, preview, and production profiles through managed secrets; never
   commit credentials.
5. Run the release doctor and reject missing, placeholder, expired, or mismatched configuration.
6. Produce signed TestFlight and Play internal-testing candidates from the certified commit.

Exit criteria:

- Installable signed candidates use production-like services and pass entitlement/deep-link/push
  validation.
- Secret inventory has an owner and rotation procedure.

### Gate D — Signed-candidate acceptance

Owner: QA, security/privacy, operations, and product owner

Inputs: Gate C candidates

Target: one acceptance cycle plus defect remediation

1. Re-run the complete critical-journey and physical-device matrices on signed candidates.
2. Run billing sandbox purchase, restore, grace, cancel, and entitlement-refresh scenarios.
3. Run export/deletion, block/mute, moderation audit, AI action confirmation, projection
   redaction, account revocation, and local-data cleanup scenarios.
4. Validate privacy manifest/data-safety declarations against the storage and telemetry inventory.
5. Run rollback, kill-switch, hotfix, diagnostics, support escalation, and data-recovery drills.
6. Obtain named sign-offs for product, QA, security/privacy, and operations.

Exit criteria:

- Every requirement in Section 3 is linked to automated evidence, manual evidence, or an explicit
  app-owned acceptance record.
- No critical/high defect is open; every accepted lower-severity issue has an owner and release
  decision.

### Gate E — Store submission and controlled rollout

Owner: release manager and product owner

Inputs: accepted signed candidates and store accounts

1. Finalize icons, splash, screenshots, descriptions, keywords, release notes, age/content
   ratings, privacy answers, support information, and reviewer instructions.
2. Submit the exact accepted binaries; archive version/build identifiers and source commit.
3. Start with internal testers, then a limited external/beta cohort, then phased production.
4. Monitor crash-free sessions, launch/join/reconnect/queue/stream/upload/push metrics and support
   volume at every stage.
5. Pause or roll back when an agreed threshold is breached; do not promote on schedule alone.

Exit criteria:

- Stable staged-production metrics through the agreed observation window.
- Evidence ledger, known limitations, rollback target, and hotfix branch are complete.

## 10. Critical path and sequencing

The engineering implementation is substantially complete. The shortest credible path is:

```text
current-commit hosted proof
  → physical-device and accessibility/performance certification
  → credentials, signing, and production service configuration
  → signed-candidate acceptance
  → store submission and phased rollout
```

Gate B preparation may run while external accounts for Gate C are assembled. Gates D and E cannot
start without signed candidates. A green simulator suite is necessary evidence, but it does not
replace physical-device, store-billing, push, media, audio, or owner acceptance.

## 11. Required decision and ownership register

Before Gate C, assign a named owner and due date for:

- supported iOS/Android versions and device matrix;
- Apple Developer/App Store Connect and Google Play Console access;
- Expo project/account and signing-secret custody;
- production API, OAuth, Spotify, APNs/FCM, billing, analytics, and error-reporting configuration;
- pricing, entitlement mapping, product naming, icons, screenshots, and store copy;
- privacy/terms/support/deletion URLs and retention policy;
- QA, security/privacy, operations, and final product acceptance;
- rollout thresholds, observation window, rollback authority, and customer-support escalation.

## 12. Five-product native delivery expansion

This section records the 2026-07-25 source audit of Hitshot, Burndown, and Blank Slate. It expands
the earlier three-reference certification program. Nothing in Sections 3.4–3.5 may be treated as
optional simply because it began in a web application.

### 12.1 Deliverable boundaries

There are two distinct deliverables:

1. **Pocketshot framework certification**
   - Public typed controllers/adapters for the reusable behavior.
   - Five clean-room Expo reference shells under `examples/`: Party/Hitshot, Coach, Community,
     Burndown, and Blank Slate.
   - Packed-artifact typechecking, optimized Hermes exports, contract tests, and Release-mode
     Maestro journeys on iOS and Android.
2. **Production product applications**
   - Five branded Expo applications consuming the published Pocketshot package and the existing
     Slingshot backends.
   - Product-owned screens, copy, theme, policy, credentials, store identities, analytics, and
     operational configuration.
   - Signed TestFlight/Play candidates and product-specific acceptance evidence.

A demo reference shell proves composition; it does not replace the production application.
Likewise, a responsive web screen does not prove native lifecycle, push, permissions, deep links,
secure storage, accessibility, or store behavior.

### 12.2 New shared framework work

Add public, domain-neutral primitives only where two or more products genuinely share behavior:

- Party session lifecycle: join/claim/handoff, participant/spectator/emcee roles, host recovery,
  admission queues, staged rules, pause/resume, idempotent rematch, and public projection.
- Personal cue policy: actor-only audio/haptic/push, per-room mute, quiet hours, initial-mount
  suppression, duplicate-event throttling, and suspended/interrupted audio dropping.
- Timed phase controller: authoritative deadline, visible countdown, warning threshold,
  background/foreground reconciliation, manual skip, and payoff-vs-dead-time dwell semantics.
- Shared-device coordinator: pass-the-phone privacy curtain, active-seat handoff, wake lock,
  in-flight lock, refresh restoration, and one-clock behavior.
- Private submission controller: optimistic lock, edit window, draft persistence, rejection,
  retry/resend, idempotency, and projection redaction.
- Host correction workflow: arm/propose/confirm/cancel/undo with version and audit data.
- Ballot/challenge controller: eligibility, cumulative decisions, revocation, deadline, outcome,
  and reordered/duplicate event handling.
- Game content library/editor primitives: cursor browse/search/sort, ownership/workflow,
  autosave/conflict, validation health, bulk import, publish/unpublish, duplicate, and AI-reviewed
  proposals.
- Native shell primitives: bottom tabs outside immersive routes, safe-area thumb dock, platform
  target sizing, orientation policy, and focus/screen-reader restoration.

Do not create a generic “game engine” that erases product rules. Burndown letter/life/challenge
rules and Blank Slate grouping/scoring/fix-up rules remain app-owned typed controllers built from
the shared lifecycle primitives.

### 12.3 Ordered implementation

#### Expansion Wave 1 — close the existing six-job gate

- Community iOS: assert the published feed entity by stable test ID.
- Coach Android: center every scrolled target before tapping so system-navigation coordinates
  cannot be selected.
- Party Android: normalize custom-scheme system URLs through Expo Router native intent and prove
  the cold join route.
- Require all six existing Release-mode jobs plus CI and native smoke on one commit.

#### Expansion Wave 2 — word-party framework primitives

- Implement and export the shared controllers listed in 12.2.
- Add adversarial tests for privacy, duplicate/reordered events, deadlines, backgrounding,
  process restoration, offline replay, host loss, and simultaneous rematch.
- Add observability, accessibility contracts, storage inventory, and redaction policy.

#### Expansion Wave 3 — Burndown reference shell

- Create `examples/burndown` with separate-phone and shared-table journeys.
- Implement typed Burndown demo state for setup, intro, turn, challenge, resolution, elimination,
  summary, results, rematch, host recovery, staged rules, and board exhaustion.
- Consume only packed Pocketshot entry points.
- Add iOS/Android optimized exports and two Release-mode Maestro matrix jobs; add a landscape
  tablet/shared-device journey.

#### Expansion Wave 4 — Blank Slate reference shell

- Create `examples/blankslate` with bottom tabs and immersive match routes.
- Implement typed Blank Slate demo state for setup, writing, retry/edit, reveal, grouping,
  fix-up/undo, merge vote, summary, sudden death, results, and rematch.
- Prove strict pre-reveal redaction across player and TV projections.
- Add iOS/Android optimized exports and two Release-mode Maestro matrix jobs.

#### Expansion Wave 5 — production application scaffolds

- Scaffold product-native workspaces for Hitshot, AICoach, SGForum, Burndown, and Blank Slate
  using `pocketshot init` and the production API schemas.
- Establish product-owned navigation, themes, assets, environment manifests, backend transports,
  OAuth/push/link configuration, and EAS profiles.
- Port screens journey-by-journey, with reference-shell and web parity mapping attached to every
  pull request.

#### Expansion Wave 6 — ten-job automation and physical certification

- Require five products × two platforms in Release mode without Metro.
- Add multi-client simulations for all three party games and realtime forum/coach interactions.
- Execute Section 6 on physical devices, including the shared-table landscape/wake-lock matrix.
- Retain screenshots, recordings, logs, performance traces, accessibility results, and device/OS
  identifiers in the release evidence ledger.

#### Expansion Wave 7 — signed products and stores

- Complete Gates C–E separately for each product; credentials and owner approval are
  product-scoped rather than inherited from another app.
- A product may roll out only when its own signed candidate, privacy declarations, support paths,
  billing/push/link behavior, rollback drill, and owner acceptance are complete.

### 12.4 Expanded automation minimum

The hosted matrix becomes:

```text
Hitshot       iOS + Android
AICoach       iOS + Android
SGForum       iOS + Android
Burndown      iOS + Android (+ shared-table landscape)
Blank Slate   iOS + Android
```

Each job builds a Release application, installs it without Metro, runs a critical journey, and
uploads diagnostics on failure. A passing web Playwright suite, simulator compile, or static flow
parser cannot substitute for the corresponding native journey.
