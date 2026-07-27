import { readFile } from 'node:fs/promises'

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const catalog = JSON.parse(
  await readFile(new URL('../config/public-surface-maturity.json', import.meta.url), 'utf8'),
)

const packageSurfaces = Object.keys(packageJson.exports ?? {}).sort()
const classifiedSurfaces = Object.keys(catalog.surfaces ?? {}).sort()
const failures = []

for (const surface of packageSurfaces) {
  if (!catalog.surfaces[surface]) {
    failures.push(`unclassified package export: ${surface}`)
  }
}

for (const surface of classifiedSurfaces) {
  if (!packageJson.exports?.[surface]) {
    failures.push(`classification has no package export: ${surface}`)
  }
}

const allowedTiers = new Set(['core', 'native-infrastructure', 'ui', 'kit', 'tooling'])
const allowedMaturity = new Set(['stable', 'beta', 'experimental'])
const allowedOwners = new Set(['framework', 'native', 'ui', 'kits', 'tooling'])

for (const [surface, classification] of Object.entries(catalog.surfaces ?? {})) {
  if (!allowedTiers.has(classification.tier)) {
    failures.push(`${surface}: invalid tier ${JSON.stringify(classification.tier)}`)
  }
  if (!allowedMaturity.has(classification.maturity)) {
    failures.push(`${surface}: invalid maturity ${JSON.stringify(classification.maturity)}`)
  }
  if (!allowedOwners.has(classification.owner)) {
    failures.push(`${surface}: invalid owner ${JSON.stringify(classification.owner)}`)
  }
  if (typeof classification.purpose !== 'string' || classification.purpose.trim().length < 12) {
    failures.push(`${surface}: purpose must be a meaningful non-empty sentence`)
  }
}

if (packageSurfaces.join('\n') !== classifiedSurfaces.join('\n')) {
  failures.push('package exports and public-surface classifications must match exactly')
}

if (failures.length > 0) {
  console.error(`Public surface maturity gate failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

const counts = Object.values(catalog.surfaces).reduce((result, surface) => {
  result[surface.maturity] = (result[surface.maturity] ?? 0) + 1
  return result
}, {})

console.log(
  `Public surface maturity gate passes (${packageSurfaces.length} exports: ${JSON.stringify(counts)}).`,
)
