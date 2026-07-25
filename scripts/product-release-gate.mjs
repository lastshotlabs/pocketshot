import { access, readFile } from 'node:fs/promises'

const products = ['hitshot', 'aicoach', 'sgforum', 'burndown', 'blankslate']
const failures = []
const identifiers = new Set()
const ciWorkflow = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8')

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
    'EXPO_PUBLIC_RELEASE_STRICT',
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
  const verifiedFilters = app.android?.intentFilters?.filter((filter) => filter.autoVerify) ?? []
  if (
    verifiedFilters.some((filter) =>
      filter.data?.some((entry) => entry.scheme && entry.scheme !== 'https'),
    )
  ) {
    failures.push(`${product} mixes custom schemes into a verified Android App Link filter`)
  }
  if (
    !app.android?.intentFilters?.some(
      (filter) =>
        !filter.autoVerify &&
        filter.category?.includes('BROWSABLE') &&
        filter.category?.includes('DEFAULT') &&
        filter.data?.some((entry) => entry.scheme === app.scheme),
    )
  ) {
    failures.push(`${product} has no standalone Android custom-scheme intent filter`)
  }
  const productSources = await Promise.all(
    (product === 'hitshot'
      ? ['lib/party.ts']
      : product === 'aicoach'
        ? ['lib/coach.ts']
        : product === 'sgforum'
          ? ['lib/community.ts']
          : product === 'burndown'
            ? ['lib/burndown.ts']
            : ['lib/blankslate.ts']
    ).map((path) => readFile(new URL(`../products/${product}/${path}`, import.meta.url), 'utf8')),
  )
  const appSource = await readFile(
    new URL(`../products/${product}/app/index.tsx`, import.meta.url),
    'utf8',
  )
  if (
    !appSource.includes('inspectRuntimeServices') ||
    !appSource.includes('EXPO_PUBLIC_RELEASE_STRICT') ||
    !appSource.includes('testID="service-readiness"')
  ) {
    failures.push(`${product} does not expose strict runtime service readiness`)
  }
  if (!productSources.some((source) => source.includes(`${app.scheme}://oauth/`))) {
    failures.push(`${product} OAuth return does not use its registered production scheme`)
  }
  const metadata = JSON.parse(
    await readFile(new URL(`../products/${product}/store/metadata.json`, import.meta.url), 'utf8'),
  )
  const screenshots = JSON.parse(
    await readFile(
      new URL(`../products/${product}/store/screenshots.json`, import.meta.url),
      'utf8',
    ),
  )
  for (const key of [
    'name',
    'subtitle',
    'shortDescription',
    'description',
    'category',
    'contentRating',
    'privacyUrl',
    'termsUrl',
    'supportUrl',
    'deletionUrl',
    'reviewNotes',
    'releaseNotes',
  ]) {
    if (typeof metadata[key] !== 'string' || !metadata[key].trim()) {
      failures.push(`${product} store metadata is missing ${key}`)
    }
  }
  if (metadata.subtitle?.length > 30)
    failures.push(`${product} store subtitle exceeds 30 characters`)
  if (!Array.isArray(metadata.keywords) || metadata.keywords.length < 3) {
    failures.push(`${product} store keywords are incomplete`)
  }
  if (
    !Array.isArray(screenshots.required) ||
    screenshots.required.length < 5 ||
    !screenshots.required.includes(screenshots.hero)
  ) {
    failures.push(`${product} screenshot plan must include at least five journeys and its hero`)
  }
  if (
    !screenshots.devices?.includes('modern-iphone') ||
    !screenshots.devices?.includes('pixel-phone')
  ) {
    failures.push(`${product} screenshot plan does not cover iPhone and Android`)
  }
  for (const [label, assetPath] of [
    ['icon', app.icon],
    ['splash', app.splash?.image],
    ['adaptive icon', app.android?.adaptiveIcon?.foregroundImage],
  ]) {
    if (!assetPath) {
      failures.push(`${product} has no ${label} asset`)
      continue
    }
    const assetUrl = new URL(`../products/${product}/${assetPath}`, import.meta.url)
    try {
      await access(assetUrl)
      const bytes = await readFile(assetUrl)
      const width = bytes.readUInt32BE(16)
      const height = bytes.readUInt32BE(20)
      if (width < 1024 || height < 1024 || width !== height) {
        failures.push(`${product} ${label} must be a square image at least 1024px`)
      }
    } catch {
      failures.push(`${product} ${label} asset is missing: ${assetPath}`)
    }
  }
}

if (!ciWorkflow.includes(`product: [hitshot, aicoach, sgforum, burndown, blankslate]`)) {
  failures.push('CI does not define the complete production-app export matrix')
}
if (!ciWorkflow.includes('verify:product:${{ matrix.product }}')) {
  failures.push('CI does not independently typecheck and export production apps')
}

if (failures.length) {
  console.error(`Product release gate failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log(`Product release gate passes (${products.length} product configurations).`)
