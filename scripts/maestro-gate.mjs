import { readFile, readdir } from 'node:fs/promises'

const directory = new URL('../.maestro/', import.meta.url)
const files = (await readdir(directory)).filter((name) => name.endsWith('.yaml'))
const bodies = await Promise.all(files.map((name) => readFile(new URL(name, directory), 'utf8')))
const all = bodies.join('\n')
const workflow = await readFile(
  new URL('../.github/workflows/device-e2e.yml', import.meta.url),
  'utf8',
)
const nativeWorkflow = await readFile(
  new URL('../.github/workflows/native.yml', import.meta.url),
  'utf8',
)
const androidRunner = await readFile(new URL('./run-android-maestro.sh', import.meta.url), 'utf8')
const partyJoinRoute = await readFile(
  new URL('../products/hitshot/app/join/[code].tsx', import.meta.url),
  'utf8',
)
const partyNativeIntent = await readFile(
  new URL('../products/hitshot/app/+native-intent.ts', import.meta.url),
  'utf8',
)
const partyApp = JSON.parse(
  await readFile(new URL('../products/hitshot/app.json', import.meta.url), 'utf8'),
).expo
const coachFlow = await readFile(
  new URL('../.maestro/coach-critical.yaml', import.meta.url),
  'utf8',
)
const communityFlow = await readFile(
  new URL('../.maestro/community-critical.yaml', import.meta.url),
  'utf8',
)
const blankslateFlow = await readFile(
  new URL('../.maestro/blankslate-critical.yaml', import.meta.url),
  'utf8',
)
const burndownCriticalFlow = await readFile(
  new URL('../.maestro/burndown-critical.yaml', import.meta.url),
  'utf8',
)
const burndownDeepLinkFlow = await readFile(
  new URL('../.maestro/burndown-deep-link.yaml', import.meta.url),
  'utf8',
)
const burndownLandscapeFlow = await readFile(
  new URL('../.maestro/burndown-landscape.yaml', import.meta.url),
  'utf8',
)
const failures = []

const appIds = [
  'com.lastshotlabs.hitshot',
  'com.lastshotlabs.aicoach',
  'com.lastshotlabs.sgforum',
  'com.lastshotlabs.burndown',
  'com.lastshotlabs.blankslate',
]
for (const appId of appIds) {
  if (!all.includes(`appId: ${appId}`)) failures.push(`missing flow for ${appId}`)
}

const requiredIds = [
  'guest-entry',
  'simulate-reconnect',
  'start-round',
  'submit-answer',
  'rematch',
  'import-track',
  'ask-coach',
  'confirm-action',
  'log-weight',
  'start-workout',
  'complete-workout',
  'restore-pro',
  'request-export',
  'complete-onboarding',
  'reconnect',
  'publish-thread',
  'send-message',
  'block-user',
  'privacy-export',
  'enter-shared',
  'arm-seat',
  'burn-word',
  'challenge',
  'vote-invalid',
  'resolve-challenge',
  'submit-alex',
  'submit-sam',
  'submit-jo',
  'reveal',
  'merge-vote',
  'approve-merge',
  'close-vote',
  'score-round',
  'next-round',
]
for (const id of requiredIds) {
  if (!all.includes(`id: ${id}`)) failures.push(`critical control ${id} is not exercised`)
}
if (!all.includes('openLink: hitshot://join/')) {
  failures.push('Party cold deep-link journey is missing')
}
for (const product of ['burndown', 'blankslate']) {
  if (!all.includes(`openLink: ${product}://join/`)) {
    failures.push(`${product} cold deep-link journey is missing`)
  }
}
if (!partyJoinRoute.includes('initialJoinCode')) {
  failures.push('Party shell does not route cold join links into the application')
}
if (!partyNativeIntent.includes('redirectSystemPath')) {
  failures.push('Party shell does not normalize native intent paths')
}
for (const scheme of ['hitshot', 'pocketshot-party']) {
  const customFilter = partyApp.android?.intentFilters?.find(
    (filter) =>
      !filter.autoVerify &&
      filter.data?.some(
        (entry) => entry.scheme === scheme && entry.host === 'join' && entry.pathPrefix === '/',
      ),
  )
  if (!customFilter) {
    failures.push(`Party Android intent delivery is not host-qualified for ${scheme}://join/`)
  }
}
if (!communityFlow.includes('id: published-thread-title')) {
  failures.push('Community journey does not assert the published thread with a stable test ID')
}
if (
  !all.includes('id: setup-six-player-table') ||
  !all.includes('setOrientation: LANDSCAPE_LEFT') ||
  !workflow.includes('.maestro/burndown-landscape.yaml')
) {
  failures.push('Burndown six-player landscape journey is missing')
}
const coachScrollCount = coachFlow.split('scrollUntilVisible:').length - 1
const centeredCoachScrollCount = coachFlow.split('centerElement: true').length - 1
if (coachScrollCount === 0 || centeredCoachScrollCount !== coachScrollCount) {
  failures.push('Coach journey does not center every scrolled control above Android navigation')
}
if (!coachFlow.includes("assertVisible: 'Access: available · grace'")) {
  failures.push('Coach journey does not assert the seeded grace entitlement contract')
}
if (!blankslateFlow.includes('text: cake\n    direction: UP\n    centerElement: true')) {
  failures.push('Blank Slate journey does not bring the revealed private answer into view')
}
if (!blankslateFlow.includes('- tapOn: Birthday.*') || blankslateFlow.includes('- hideKeyboard')) {
  failures.push('Blank Slate journey does not use the reliable iOS keyboard-dismiss workaround')
}
for (const [name, body, control] of [
  ['critical', burndownCriticalFlow, 'enter-shared'],
  ['landscape', burndownLandscapeFlow, 'setup-six-player-table'],
]) {
  if (!body.includes(`id: ${control}\n    direction: DOWN\n    centerElement: true`)) {
    failures.push(`Burndown ${name} journey does not center its below-fold entry control`)
  }
}
for (const [control, direction] of [
  ['burndown-lobby-title', 'UP'],
  ['start-match', 'DOWN'],
]) {
  if (
    !burndownLandscapeFlow.includes(
      `id: ${control}\n    direction: ${direction}\n    centerElement: true`,
    )
  ) {
    failures.push(`Burndown landscape journey does not center ${control}`)
  }
}
if (
  !burndownLandscapeFlow.includes('text: Your turn\n    direction: UP\n    centerElement: true')
) {
  failures.push('Burndown landscape journey does not center the armed turn state')
}
if (
  !burndownDeepLinkFlow.includes('extendedWaitUntil:') ||
  !burndownDeepLinkFlow.includes('timeout: 60000')
) {
  failures.push('Burndown cold-link journey does not wait for a slow native launch')
}
for (const [index, body] of bodies.entries()) {
  if (!body.includes('launchApp:') && !body.includes('openLink:')) {
    failures.push(`${files[index]} does not launch the app or a system link`)
  }
  if (!body.includes('assertVisible:')) failures.push(`${files[index]} has no visible assertion`)
}
for (const job of ['android-maestro:', 'ios-maestro:']) {
  if (!workflow.includes(job)) failures.push(`device workflow is missing ${job.slice(0, -1)}`)
}
for (const product of ['hitshot', 'aicoach', 'sgforum', 'burndown', 'blankslate']) {
  const occurrences = workflow.split(`product: ${product}`).length - 1
  if (occurrences < 2) {
    failures.push(`device workflow does not matrix ${product} on both mobile platforms`)
  }
}
if (workflow.includes('working-directory: examples/')) {
  failures.push('device workflow still builds a reference shell instead of production apps')
}
if (!workflow.includes('maestro" --device "$DEVICE_ID" test')) {
  failures.push('iOS workflow does not target its isolated simulator')
}
if (!workflow.includes('Enable KVM acceleration') || !workflow.includes('99-kvm4all.rules')) {
  failures.push('Android workflow does not enable required KVM acceleration')
}
if (!workflow.includes('emulator-options: -no-window -gpu swiftshader_indirect -no-snapshot')) {
  failures.push('Android workflow does not use a clean headless emulator boot')
}
if (!workflow.includes('adb shell settings put global hide_error_dialogs 1')) {
  failures.push('Android workflow does not suppress runner-service ANR dialogs')
}
if (!workflow.includes('scripts/run-android-maestro.sh')) {
  failures.push('Android workflow bypasses the classified Maestro runner')
}
if (
  !workflow.includes(
    'ANDROID_MAESTRO_DIAGNOSTICS_DIR="$RUNNER_TEMP/android-maestro-${{ matrix.product }}" scripts/run-android-maestro.sh',
  )
) {
  failures.push('Android workflow does not invoke the classified runner as one emulator action')
}
for (const diagnostic of [
  'dumpsys activity exit-info',
  'dumpsys activity activities',
  'shell pidof',
  'classified as app process termination',
  'retrying once as runner instability',
]) {
  if (!androidRunner.includes(diagnostic)) {
    failures.push(`Android Maestro runner is missing diagnostic: ${diagnostic}`)
  }
}
if (!workflow.includes('scheme=$(basename "$workspace" .xcworkspace)')) {
  failures.push('iOS workflow does not select the application workspace scheme')
}
if (!nativeWorkflow.includes('scheme=$(basename "$workspace" .xcworkspace)')) {
  failures.push('native smoke workflow does not select the application workspace scheme')
}
for (const releaseBuild of [
  'assembleRelease --no-daemon',
  '-configuration Release',
  'Build/Products/Release-iphonesimulator',
]) {
  if (!workflow.includes(releaseBuild)) {
    failures.push(`device workflow is not self-contained: missing ${releaseBuild}`)
  }
}

if (failures.length) {
  console.error(`Maestro gate failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}
console.log(`Maestro gate passes (${files.length} critical flows, ${requiredIds.length} controls).`)
