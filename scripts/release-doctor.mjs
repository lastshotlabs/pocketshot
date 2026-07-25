import { readFile } from 'node:fs/promises'

const products = ['hitshot', 'aicoach', 'sgforum', 'burndown', 'blankslate']
const failures = []
const external = new Set()
const requiredRuntime = [
  'EXPO_PUBLIC_API_URL',
  'EXPO_PUBLIC_WS_ENDPOINT',
  'EXPO_PUBLIC_LINK_HOST',
  'EXPO_PUBLIC_PRIVACY_URL',
  'EXPO_PUBLIC_TERMS_URL',
  'EXPO_PUBLIC_SUPPORT_URL',
  'EXPO_PUBLIC_DELETION_URL',
  'EXPO_PUBLIC_ANALYTICS_ENDPOINT',
  'EXPO_PUBLIC_CRASH_ENDPOINT',
  'EXPO_PUBLIC_FEATURE_FLAG_ENDPOINT',
]

for (const product of products) {
  const app = JSON.parse(
    await readFile(new URL(`../products/${product}/app.json`, import.meta.url), 'utf8'),
  ).expo
  const eas = JSON.parse(
    await readFile(new URL(`../products/${product}/eas.json`, import.meta.url), 'utf8'),
  )
  if (!app.ios?.bundleIdentifier) failures.push(`${product}: iOS bundle identifier is missing`)
  if (!app.android?.package) failures.push(`${product}: Android application ID is missing`)
  if (!app.runtimeVersion) failures.push(`${product}: Expo runtimeVersion policy is missing`)
  if (!app.ios?.privacyManifests) failures.push(`${product}: iOS privacy manifest is missing`)
  if (!app.ios?.associatedDomains?.length) failures.push(`${product}: associated domain is missing`)
  if (!app.android?.intentFilters?.some((filter) => filter.autoVerify)) {
    failures.push(`${product}: verified Android App Link is missing`)
  }
  for (const profile of ['development', 'preview', 'production']) {
    if (!eas.build?.[profile]) failures.push(`${product}: EAS ${profile} profile is missing`)
  }
  for (const profile of ['preview', 'production']) {
    if (!eas.build?.[profile]?.channel)
      failures.push(`${product}: EAS ${profile} channel is missing`)
    if (!eas.build?.[profile]?.environment) {
      failures.push(`${product}: EAS ${profile} environment is missing`)
    }
  }
  if (!app.extra?.eas?.projectId) external.add(`${product}: Expo project linkage`)
}

for (const key of requiredRuntime) {
  const value = process.env[key]
  if (!value) {
    external.add(key)
    continue
  }
  if (key.endsWith('_URL') || key.endsWith('_ENDPOINT')) {
    try {
      const url = new URL(value)
      if (!['https:', 'wss:'].includes(url.protocol)) failures.push(`${key} must use HTTPS or WSS`)
    } catch {
      failures.push(`${key} is not a valid URL`)
    }
  }
}
if (process.env.EXPO_PUBLIC_RELEASE_STRICT !== 'true') {
  external.add('EXPO_PUBLIC_RELEASE_STRICT=true')
}
if (!process.env.EXPO_TOKEN) external.add('EXPO_TOKEN')
external.add('Apple/Google signing and store submission credentials')
external.add('APNs/FCM, OAuth, Spotify/Audius, billing, analytics, crash, and flag credentials')

if (failures.length) {
  console.error(`Release doctor failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}
console.log(`Credential-independent release configuration passes for ${products.length} products.`)
if (external.size) {
  console.log(`External release prerequisites:\n- ${[...external].join('\n- ')}`)
  process.exitCode = 2
}
