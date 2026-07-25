import { readFile, readdir, stat } from 'node:fs/promises'
import { join, relative } from 'node:path'

const root = new URL('../', import.meta.url)
const budgets = JSON.parse(
  await readFile(new URL('../config/performance-budgets.json', import.meta.url), 'utf8'),
)
const failures = []
const evidence = []

for (const [name, limit] of Object.entries(budgets.packageBytes)) {
  const size = (await stat(new URL(`../${name}`, import.meta.url))).size
  evidence.push(`${name}=${size}`)
  if (size > limit) failures.push(`${name} is ${size} bytes; budget is ${limit}`)
}

for (const [shell, limit] of Object.entries(budgets.referenceHermesBytes)) {
  for (const platform of ['ios', 'android']) {
    const directory = new URL(`../examples/${shell}/dist/${platform}/`, import.meta.url).pathname
    let bundles
    try {
      bundles = (await filesUnder(directory)).filter((path) => path.endsWith('.hbc'))
    } catch {
      failures.push(`${shell}/${platform} Hermes export is missing`)
      continue
    }
    if (bundles.length !== 1) {
      failures.push(`${shell}/${platform} expected one Hermes bundle, found ${bundles.length}`)
      continue
    }
    const size = (await stat(bundles[0])).size
    evidence.push(`${relative(root.pathname, bundles[0])}=${size}`)
    if (size > limit) failures.push(`${shell}/${platform} is ${size} bytes; budget is ${limit}`)
  }
}

if (
  budgets.offlineLimits.maxQueuedCommands > 1000 ||
  budgets.offlineLimits.maxDiagnosticsEvents > 100
) {
  failures.push('offline/diagnostics growth bounds exceed the certified release maximum')
}

if (failures.length) {
  console.error(`Performance gate failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}
console.log(`Performance gate passes (${evidence.join(', ')}).`)

async function filesUnder(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await filesUnder(path)))
    else files.push(path)
  }
  return files
}
