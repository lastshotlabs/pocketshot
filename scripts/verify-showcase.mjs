import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const rootDir = resolve(import.meta.dirname, '..')
const showcaseDir = join(rootDir, 'showcase')
const packDir = mkdtempSync(join(tmpdir(), 'pocketshot-showcase-package-'))

function run(command, args, cwd = rootDir) {
  execFileSync(command, args, {
    cwd,
    env: process.env,
    stdio: 'inherit',
  })
}

try {
  run('npm', ['run', 'build'])
  run('npm', ['pack', '--pack-destination', packDir, '--silent'])

  const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'))
  const archiveName = `${packageJson.name.replace('@', '').replace('/', '-')}-${packageJson.version}.tgz`
  const archivePath = join(packDir, archiveName)

  run('npm', ['ci', '--legacy-peer-deps'], showcaseDir)
  run(
    'npm',
    ['install', archivePath, '--no-save', '--package-lock=false', '--legacy-peer-deps'],
    showcaseDir,
  )
  run('npx', ['expo-doctor'], showcaseDir)
  run('npx', ['pocketshot', 'doctor', '--json'], showcaseDir)
  run('npm', ['run', 'verify'], showcaseDir)
  run('npm', ['audit', '--omit=dev', '--audit-level=high'], showcaseDir)
} finally {
  rmSync(packDir, { recursive: true, force: true })
}
