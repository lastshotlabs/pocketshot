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
const partyJoinRoute = await readFile(
  new URL('../examples/party/app/join/[code].tsx', import.meta.url),
  'utf8',
)
const failures = []

const appIds = [
  'com.lastshotlabs.pocketshot.party',
  'com.lastshotlabs.pocketshot.coach',
  'com.lastshotlabs.pocketshot.community',
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
]
for (const id of requiredIds) {
  if (!all.includes(`id: ${id}`)) failures.push(`critical control ${id} is not exercised`)
}
if (!all.includes('openLink: pocketshot-party://join/')) {
  failures.push('Party cold deep-link journey is missing')
}
if (!partyJoinRoute.includes('initialJoinCode')) {
  failures.push('Party shell does not route cold join links into the application')
}
for (const [index, body] of bodies.entries()) {
  if (!body.includes('launchApp:')) failures.push(`${files[index]} does not launch the app`)
  if (!body.includes('assertVisible:')) failures.push(`${files[index]} has no visible assertion`)
}
for (const job of ['android-maestro:', 'ios-maestro:']) {
  if (!workflow.includes(job)) failures.push(`device workflow is missing ${job.slice(0, -1)}`)
}
for (const shell of ['party', 'coach', 'community']) {
  const occurrences = workflow.split(`shell: ${shell}`).length - 1
  if (occurrences < 2) {
    failures.push(`device workflow does not matrix ${shell} on both mobile platforms`)
  }
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
