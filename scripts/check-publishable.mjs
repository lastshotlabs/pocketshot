#!/usr/bin/env node
// Verifies the package would actually work once published.
//
// Two failure modes this catches, both invisible from inside the repo:
//
//   1. A `file:`/`link:` dependency specifier. These resolve relative to the
//      CONSUMER's project root, not ours, so every downstream install dies with
//      `ENOENT extracting tarball`. Sibling package @lastshotlabs/snapshot
//      shipped exactly this and was uninstallable for several releases.
//
//   2. An `exports`/`main`/`types` entry pointing at a file the tarball does not
//      contain — trivially caused by a stale `files` list. Resolves fine locally
//      because the file is right there on disk.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const manifest = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'))

let failed = false
const fail = (message) => {
  failed = true
  console.error(`✗ ${message}`)
}

for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
  for (const [name, spec] of Object.entries(manifest[field] ?? {})) {
    if (typeof spec === 'string' && /^(file:|link:)/.test(spec)) {
      fail(`${field}.${name} is "${spec}" — a local path specifier cannot resolve for consumers`)
    }
  }
}

// Every path the manifest promises, flattened out of the exports map.
const promised = new Set()
const collect = (value) => {
  if (typeof value === 'string') {
    if (value.startsWith('./')) promised.add(value.slice(2))
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach(collect)
  }
}
collect(manifest.exports)
for (const field of ['main', 'module', 'types']) collect(manifest[field])

const workDir = mkdtempSync(join(tmpdir(), 'pocketshot-publishable-'))
try {
  const [packed] = JSON.parse(
    execFileSync('npm', ['pack', '--json', '--pack-destination', workDir], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }),
  )

  // npm reports tarball contents as paths prefixed with `package/`.
  const shipped = new Set(packed.files.map((entry) => entry.path.replace(/^package\//, '')))
  for (const path of [...promised].sort()) {
    if (!shipped.has(path)) fail(`${path} is referenced by the manifest but missing from the tarball`)
  }

  console.log(
    `checked ${promised.size} manifest entrypoints against ${shipped.size} packed files (${packed.filename})`,
  )
} finally {
  rmSync(workDir, { recursive: true, force: true })
}

if (failed) {
  console.error('\npublishability check FAILED')
  process.exit(1)
}

console.log('✓ publishability check passed')
