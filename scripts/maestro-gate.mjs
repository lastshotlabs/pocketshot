import { readFile, readdir } from 'node:fs/promises'

const directory = new URL('../.maestro/', import.meta.url)
const files = (await readdir(directory)).filter((name) => name.endsWith('.yaml'))
const bodies = await Promise.all(files.map((name) => readFile(new URL(name, directory), 'utf8')))
const all = bodies.join('\n')
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
for (const [index, body] of bodies.entries()) {
  if (!body.includes('launchApp:')) failures.push(`${files[index]} does not launch the app`)
  if (!body.includes('assertVisible:')) failures.push(`${files[index]} has no visible assertion`)
}

if (failures.length) {
  console.error(`Maestro gate failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}
console.log(`Maestro gate passes (${files.length} critical flows, ${requiredIds.length} controls).`)
