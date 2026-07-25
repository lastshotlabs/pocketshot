import { execFileSync } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const shell = process.argv[2]
if (!shell || !['party', 'coach', 'community'].includes(shell)) {
  throw new Error('Usage: node scripts/verify-reference-shell.mjs <party|coach|community>')
}

const root = new URL('..', import.meta.url).pathname
const shellDir = resolve(root, 'examples', shell)
const output = await mkdtemp(join(tmpdir(), `pocketshot-${shell}-`))

function run(command, args, cwd = shellDir) {
  return execFileSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, CI: '1' },
  })
}

try {
  const archive = String(
    execFileSync('npm', ['pack', '--pack-destination', output, '--silent'], {
      cwd: root,
      encoding: 'utf8',
    }),
  ).trim()
  run('npm', [
    'install',
    '--legacy-peer-deps',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    '--package-lock=false',
  ])
  run('npm', [
    'install',
    join(output, archive),
    '--no-save',
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
