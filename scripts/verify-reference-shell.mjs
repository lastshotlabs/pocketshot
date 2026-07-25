import { execFileSync } from 'node:child_process'
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const shell = process.argv[2]
if (!shell || !['party', 'coach', 'community', 'burndown', 'blankslate'].includes(shell)) {
  throw new Error(
    'Usage: node scripts/verify-reference-shell.mjs <party|coach|community|burndown|blankslate>',
  )
}

const root = new URL('..', import.meta.url).pathname
const shellDir = resolve(root, 'examples', shell)
const output = await mkdtemp(join(tmpdir(), `pocketshot-${shell}-`))
const productByShell = {
  party: 'hitshot',
  coach: 'aicoach',
  community: 'sgforum',
  burndown: 'burndown',
  blankslate: 'blankslate',
}
const product = productByShell[shell]
const productDir = resolve(root, 'products', product)
const workingShell = join(output, 'shell')

function run(command, args, cwd = workingShell) {
  return execFileSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, CI: '1' },
  })
}

try {
  const pocketshotArchive = String(
    execFileSync('npm', ['pack', '--pack-destination', output, '--silent'], {
      cwd: root,
      encoding: 'utf8',
    }),
  ).trim()
  const productArchive = String(
    execFileSync('npm', ['pack', '--pack-destination', output, '--silent'], {
      cwd: productDir,
      encoding: 'utf8',
    }),
  ).trim()
  await cp(shellDir, workingShell, {
    recursive: true,
    filter: (source) => !/(?:^|\/)(?:node_modules|dist)(?:\/|$)/.test(source),
  })
  const manifestPath = join(workingShell, 'package.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  const productPackage = {
    party: '@lastshotlabs/hitshot-mobile',
    coach: '@lastshotlabs/aicoach-mobile',
    community: '@lastshotlabs/sgforum-mobile',
    burndown: '@lastshotlabs/burndown-mobile',
    blankslate: '@lastshotlabs/blankslate-mobile',
  }[shell]
  manifest.dependencies['@lastshotlabs/pocketshot'] = `file:${join(output, pocketshotArchive)}`
  manifest.dependencies[productPackage] = `file:${join(output, productArchive)}`
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  run('npm', [
    'install',
    '--legacy-peer-deps',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    '--package-lock=false',
  ])
  run('npm', ['run', 'typecheck'])
  run('npm', ['run', 'export'])
  console.log(`${shell} reference shell typechecked and bundled for iOS/Android.`)
} finally {
  await rm(output, { recursive: true, force: true })
}
