# PocketShot mobile release runbook

This runbook promotes the five production applications under `products/` through internal
preview, TestFlight, and Google Play internal testing. It is deliberately explicit about
the external values that cannot be committed to the repository.

## Release ownership and prerequisites

Required owners:

- Release owner: chooses the version, approves production promotion, and owns rollback.
- Apple owner: App Store Connect app, distribution certificate/profile, APNs, review submission.
- Google owner: Play Console app, upload/app-signing keys, FCM, data-safety submission.
- Product/privacy owner: pricing, screenshots/copy, support and privacy URLs, retention/deletion,
  and final journey acceptance.

Required external configuration:

- Expo account/project linkage and an `EXPO_TOKEN` suitable for non-interactive EAS commands.
- App Store Connect numeric app ID, Apple team and submit credentials.
- Play Console application plus EAS service-account JSON.
- Production API/OAuth/associated-domain/push/analytics configuration held in EAS environments.
- Public privacy policy, terms, support, and account-deletion URLs.

Never commit credentials. Store build-time values in EAS environment variables and store
submission credentials in EAS/Apple/Google credential stores.

## Preflight

From the repository root:

```sh
npm ci --legacy-peer-deps
npm run typecheck
npm test
npm run verify:consumer
npm run verify:showcase
npm run verify:party
npm run verify:coach
npm run verify:community
npm run verify:burndown
npm run verify:blankslate
npm run verify:products
npm run check:release-artifacts
npm run check:security
npm run check:accessibility
npm run check:performance
npm run check:maestro
npm run release:doctor
```

Require green hosted CI, Native smoke, and Device E2E checks for the exact release commit. Confirm
there are no critical/high production audit findings and review every medium finding.

## Version and environment promotion

1. Choose the semantic app version and confirm native/runtime compatibility. The app uses Expo's
   `appVersion` runtime policy so incompatible native changes require a new app version/build.
2. Verify `development`, `preview`, and `production` EAS environments contain the intended
   non-secret and secret values. Never promote by copying local `.env` files.
3. Build an internal preview for each product:

   ```sh
   for product in hitshot aicoach sgforum burndown blankslate; do
     (cd "products/$product" &&
       npx eas-cli build --platform all --profile preview --non-interactive)
   done
   ```

4. Install the previews on the physical-device matrix and complete the acceptance record below.
5. Build product-scoped store candidates from the same immutable commit:

   ```sh
   for product in hitshot aicoach sgforum burndown blankslate; do
     (cd "products/$product" &&
       npx eas-cli build --platform all --profile production --non-interactive)
   done
   ```

6. Submit only the accepted build IDs from within the matching product workspace:

   ```sh
   cd products/PRODUCT
   npx eas-cli submit --platform ios --profile production --id IOS_BUILD_ID --non-interactive
   npx eas-cli submit --platform android --profile production --id ANDROID_BUILD_ID --non-interactive
   ```

7. Release first to TestFlight/internal testing. Production rollout begins staged and requires
   crash-free/launch/join/reconnect metrics to remain inside the product owner's thresholds.

## Physical-device acceptance record

Test the oldest and newest supported iOS versions on a small and large iPhone, and a low/mid-tier
Android plus a current Pixel/Samsung-class device. Record device model, OS, build ID, tester,
timestamp, and evidence for:

- install, first launch, upgrade, background/foreground, termination/relaunch;
- account creation/sign-in/recovery/session revocation and deep/universal links;
- Party join/QR, full match, equal-year placement, challenge, reconnect/host migration, audio
  interruption/headphones/background, second screen, rematch, and deck publishing;
- Coach streaming/cancel/retry, action review/undo, photo permission/denial/analysis, offline log
  conflict, charts/goals, workout interruption/resume, purchase/restore/revoke, and privacy export;
- Community feed/thread/attachment/mention/poll, notification deep link, offline publish/reconnect,
  DM typing/read/revocation, report/moderation, block, privacy export/deletion;
- Burndown separate-phone and 2–8-player shared-table matches, handoff curtain, wake lock,
  challenge grid, “Nobody,” elimination, board exhaustion, host recovery, TV, and rematch;
- Blank Slate private write/edit/resend, strict pre-reveal redaction, grouping/scoring,
  correction/undo, merge ballot, offline replay, quiet hours, haptics, host recovery, and rematch;
- VoiceOver/TalkBack order and names, 200% text, high contrast, reduced motion, rotation/safe area;
- denied/limited permissions, airplane/poor network, battery/thermal state, and long-session memory.

Any P0/P1 failure blocks submission. P2 exceptions need an owner, a release decision, and a dated
follow-up.

## Store material

Before each product submission, archive:

- app icon, splash, phone-size screenshots, description, keywords/category, release/review notes;
- privacy/data-safety declarations matched to the persisted-data inventory;
- privacy/terms/support/deletion URLs and reviewer credentials/instructions;
- encryption/export-compliance response, age/content rating, billing products and pricing;
- bundle IDs, associated domains, push configuration, version/build numbers, and build checksums.

The code-owned copy and capture requirements live in `products/<product>/store/metadata.json` and
`products/<product>/store/screenshots.json`. Capture the requested screenshots from the exact
accepted signed build; do not substitute simulator images from another product or commit.

## Rollback and recovery drill

- OTA issue: halt rollout, repoint the production channel to the last accepted compatible update,
  then verify cold launch and migrations on both platforms.
- Native issue: stop store rollout, restore the last accepted binary/update pairing, increment the
  native build, and ship an expedited hotfix. Never publish incompatible JS to an old runtime.
- Backend/data issue: activate the relevant kill switch, preserve idempotency records, restore from
  the tested backup, reconcile queued commands, and verify privacy-deletion state.
- Record detection time, decision owner, commands/build/update IDs, recovery time, and post-drill
  evidence in the release ticket.
