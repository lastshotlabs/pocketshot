import { execFileSync } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const product = process.argv[2]
const products = ['hitshot', 'aicoach', 'sgforum', 'burndown', 'blankslate']
if (!product || !products.includes(product)) {
  throw new Error(`Usage: node scripts/verify-product-app.mjs <${products.join('|')}>`)
}

const root = new URL('..', import.meta.url).pathname
const productDir = resolve(root, 'products', product)
const output = await mkdtemp(join(tmpdir(), `pocketshot-product-${product}-`))

function run(command, args, cwd = productDir) {
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
  console.log(`${product} production app typechecked and bundled for iOS/Android.`)
} finally {
  await rm(output, { recursive: true, force: true })
}
