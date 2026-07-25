import { readFile } from 'node:fs/promises'

const app = JSON.parse(
  await readFile(new URL('../showcase/app.json', import.meta.url), 'utf8'),
).expo
const eas = JSON.parse(await readFile(new URL('../showcase/eas.json', import.meta.url), 'utf8'))
const failures = []
const external = []

if (!app.ios?.bundleIdentifier) failures.push('iOS bundle identifier is missing')
if (!app.android?.package) failures.push('Android application ID is missing')
if (!app.runtimeVersion) failures.push('Expo runtimeVersion policy is missing')
if (!app.ios?.privacyManifests) failures.push('iOS privacy manifest is missing')
for (const profile of ['development', 'preview', 'production']) {
  if (!eas.build?.[profile]) failures.push(`EAS ${profile} build profile is missing`)
}
for (const profile of ['preview', 'production']) {
  if (!eas.build?.[profile]?.channel) failures.push(`EAS ${profile} update channel is missing`)
  if (!eas.build?.[profile]?.environment) failures.push(`EAS ${profile} environment is missing`)
}
if (!process.env.EXPO_TOKEN) external.push('EXPO_TOKEN')
if (!app.extra?.eas?.projectId) external.push('Expo project linkage (extra.eas.projectId)')
external.push('Apple/Google store apps and submit credentials')
external.push('public privacy, terms, support, and deletion URLs')

if (failures.length) {
  console.error(`Release doctor failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}
console.log('Credential-independent release configuration passes.')
console.log(`External release prerequisites:\n- ${external.join('\n- ')}`)
if (external.length) process.exitCode = 2
