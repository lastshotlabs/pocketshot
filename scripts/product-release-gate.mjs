import { readFile } from 'node:fs/promises'

const products = ['hitshot', 'aicoach', 'sgforum', 'burndown', 'blankslate']
const failures = []
const identifiers = new Set()

for (const product of products) {
  const app = JSON.parse(
    await readFile(new URL(`../products/${product}/app.json`, import.meta.url), 'utf8'),
  ).expo
  const eas = JSON.parse(
    await readFile(new URL(`../products/${product}/eas.json`, import.meta.url), 'utf8'),
  )
  const iosId = app.ios?.bundleIdentifier
  const androidId = app.android?.package
  for (const [platform, id] of [
    ['iOS', iosId],
    ['Android', androidId],
  ]) {
    if (!id || !/^com\.lastshotlabs\.[a-z0-9.]+$/.test(id)) {
      failures.push(`${product} ${platform} identifier is not final`)
    }
    if (identifiers.has(`${platform}:${id}`))
      failures.push(`${product} duplicates ${platform} ${id}`)
    identifiers.add(`${platform}:${id}`)
  }
  if (app.runtimeVersion?.policy !== 'appVersion') {
    failures.push(`${product} does not bind updates to its native app version`)
  }
  if (!/^\d+$/.test(app.ios?.buildNumber ?? '')) {
    failures.push(`${product} has no numeric iOS build number`)
  }
  if (!Number.isInteger(app.android?.versionCode) || app.android.versionCode < 1) {
    failures.push(`${product} has no positive Android version code`)
  }
  const privacyTypes = app.ios?.privacyManifests?.NSPrivacyAccessedAPITypes
  if (!Array.isArray(privacyTypes) || privacyTypes.length === 0) {
    failures.push(`${product} has no iOS privacy manifest declarations`)
  }
  for (const profile of ['development', 'preview', 'production']) {
    if (!eas.build?.[profile]) failures.push(`${product} EAS config is missing ${profile}`)
  }
  if (!eas.build?.production?.autoIncrement || eas.build?.production?.channel !== 'production') {
    failures.push(`${product} production build does not auto-increment on production channel`)
  }
  if (!eas.submit?.production) failures.push(`${product} has no production submission profile`)
  const environment = await readFile(
    new URL(`../products/${product}/.env.example`, import.meta.url),
    'utf8',
  )
  for (const key of [
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
  ]) {
    if (!environment.includes(`${key}=`)) {
      failures.push(`${product} environment manifest is missing ${key}`)
    }
  }
  if (!app.ios?.associatedDomains?.some((value) => value.startsWith('applinks:'))) {
    failures.push(`${product} has no iOS associated domain`)
  }
  if (!app.android?.intentFilters?.some((filter) => filter.autoVerify)) {
    failures.push(`${product} has no verified Android App Link`)
  }
}

if (failures.length) {
  console.error(`Product release gate failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log(`Product release gate passes (${products.length} product configurations).`)
