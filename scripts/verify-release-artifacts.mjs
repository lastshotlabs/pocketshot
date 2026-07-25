import { readFile, stat } from 'node:fs/promises'

const entries = [
  'index',
  'ui',
  'realtime',
  'offline',
  'drafts',
  'testing',
  'media',
  'ai',
  'audio',
  'coach',
  'party',
  'observability',
  'accessibility',
]

const failures = []
let mapsWithSources = 0
for (const entry of entries) {
  for (const extension of ['js', 'cjs']) {
    const bundle = new URL(`../dist/${entry}.${extension}`, import.meta.url)
    const map = new URL(`../dist/${entry}.${extension}.map`, import.meta.url)
    try {
      await stat(bundle)
      const parsed = JSON.parse(await readFile(map, 'utf8'))
      if (parsed.version !== 3 || !Array.isArray(parsed.sources)) {
        failures.push(`${entry}.${extension}.map is not a valid source map`)
      }
      if (parsed.sources.length > 0) mapsWithSources += 1
      const bundleText = await readFile(bundle, 'utf8')
      if (!bundleText.includes(`sourceMappingURL=${entry}.${extension}.map`)) {
        failures.push(`${entry}.${extension} does not reference its source map`)
      }
    } catch (error) {
      failures.push(`${entry}.${extension}: ${error instanceof Error ? error.message : error}`)
    }
  }
}

if (mapsWithSources < entries.length) {
  failures.push(`only ${mapsWithSources} source maps contain original source references`)
}

if (failures.length) {
  console.error(`Release artifact verification failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log(`Release artifacts pass (${entries.length * 2} source maps verified).`)
