import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'

const dist = new URL('../dist/', import.meta.url)
const packageRoot = new URL('../', import.meta.url)

const budgets = {
  'dist/index.js': 160 * 1024,
  // CJS cannot share Pocketshot's production controller chunks like the ESM build.
  'dist/index.cjs': 240 * 1024,
  'dist/ui.js': 1.5 * 1024 * 1024,
  'dist/ui.cjs': 1.6 * 1024 * 1024,
  'dist/types/index.d.ts': 16 * 1024,
  'dist/types/ui.d.ts': 32 * 1024,
  'dist/realtime.js': 32 * 1024,
  'dist/realtime.cjs': 36 * 1024,
  'dist/offline.js': 32 * 1024,
  'dist/offline.cjs': 36 * 1024,
  'dist/drafts.js': 32 * 1024,
  'dist/drafts.cjs': 36 * 1024,
  'dist/testing.js': 24 * 1024,
  'dist/testing.cjs': 28 * 1024,
  'dist/media.js': 36 * 1024,
  'dist/media.cjs': 40 * 1024,
  'dist/ai.js': 36 * 1024,
  'dist/ai.cjs': 40 * 1024,
  'dist/auth.js': 16 * 1024,
  'dist/auth.cjs': 20 * 1024,
  'dist/audio.js': 32 * 1024,
  'dist/audio.cjs': 36 * 1024,
  'dist/billing.js': 16 * 1024,
  'dist/billing.cjs': 20 * 1024,
  'dist/coach.js': 16 * 1024,
  'dist/coach.cjs': 24 * 1024,
  'dist/party.js': 16 * 1024,
  'dist/party.cjs': 20 * 1024,
  'dist/party-session.js': 40 * 1024,
  'dist/party-session.cjs': 40 * 1024,
  'dist/release.js': 20 * 1024,
  'dist/release.cjs': 24 * 1024,
  'dist/privacy.js': 16 * 1024,
  'dist/privacy.cjs': 20 * 1024,
  'dist/observability.js': 20 * 1024,
  'dist/observability.cjs': 24 * 1024,
  'dist/accessibility.js': 12 * 1024,
  'dist/accessibility.cjs': 16 * 1024,
  'dist/community.js': 16 * 1024,
  'dist/community.cjs': 64 * 1024,
  'dist/community-core.js': 48 * 1024,
  'dist/community-core.cjs': 52 * 1024,
}

async function filesUnder(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await filesUnder(path)))
    else files.push(path)
  }
  return files
}

const failures = []
for (const [name, limit] of Object.entries(budgets)) {
  const path = new URL(name.replace(/^dist\//, ''), dist)
  const size = (await stat(path)).size
  if (size > limit) failures.push(`${name}: ${size} bytes exceeds ${limit}`)
}

const genericPrimitiveBudget = 64 * 1024
for (const entry of await readdir(dist, { withFileTypes: true })) {
  if (
    !entry.isFile() ||
    (!entry.name.endsWith('.js') && !entry.name.endsWith('.cjs')) ||
    entry.name.endsWith('.map') ||
    ['index.js', 'index.cjs', 'ui.js', 'ui.cjs', 'cli.cjs'].includes(entry.name) ||
    entry.name.startsWith('chunk-')
  ) {
    continue
  }
  const path = `dist/${entry.name}`
  if (budgets[path]) continue
  const size = (await stat(new URL(entry.name, dist))).size
  if (size > genericPrimitiveBudget) {
    failures.push(
      `${path}: ${size} bytes exceeds generic primitive budget ${genericPrimitiveBudget}`,
    )
  }
}

const typeFiles = (await filesUnder(dist.pathname + 'types')).filter((path) =>
  path.endsWith('.d.ts'),
)
// Component schema declarations must keep shared style/state/slot contracts
// behind named type boundaries instead of serializing the complete Zod graph.
const largestTypeBudget = 512 * 1024
for (const path of typeFiles) {
  const size = (await stat(path)).size
  if (size > largestTypeBudget) {
    failures.push(
      `${relativeToDist(path)}: ${size} bytes exceeds per-declaration budget ${largestTypeBudget}`,
    )
  }
}
const totalTypeBytes = (
  await Promise.all(typeFiles.map(async (path) => (await stat(path)).size))
).reduce((total, size) => total + size, 0)
const totalTypeBudget = 12 * 1024 * 1024
if (totalTypeBytes > totalTypeBudget) {
  failures.push(`dist/types total: ${totalTypeBytes} bytes exceeds ${totalTypeBudget}`)
}

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const declaredTargets = [
  packageJson.types,
  ...Object.values(packageJson.exports ?? {}).flatMap((entry) =>
    typeof entry === 'string' ? [entry] : [entry.types, entry.import, entry.require],
  ),
  ...Object.values(packageJson.bin ?? {}),
]
for (const target of declaredTargets) {
  if (!target) {
    failures.push('package.json is missing a required types/bin target')
    continue
  }
  // Wildcard exports are expanded and verified by the focused UI isolation gate.
  if (target.includes('*')) continue
  try {
    await stat(new URL(target.replace(/^\.\//, ''), packageRoot))
  } catch {
    failures.push(`package target does not exist: ${target}`)
  }
}

const cliMode = (await stat(new URL('../dist/cli.cjs', import.meta.url))).mode
if ((cliMode & 0o111) === 0) {
  failures.push('dist/cli.cjs is not executable; npm will remove the package bin entry')
}

if (failures.length) {
  console.error(`Package budget verification failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log(
  `Package budgets pass (${typeFiles.length} declaration artifacts, ${totalTypeBytes} type bytes).`,
)

function relativeToDist(path) {
  return `dist/${path.slice(dist.pathname.length)}`
}
