import { readFile, readdir } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'

const root = new URL('../', import.meta.url)
const scanRoots = ['src', 'examples', 'scripts', '.github']
const extensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.json', '.yml', '.yaml'])
const failures = []

for (const directory of scanRoots) {
  for (const path of await filesUnder(new URL(`../${directory}/`, import.meta.url).pathname)) {
    if (!extensions.has(extname(path)) || path.includes('/dist/') || path.includes('/__tests__/'))
      continue
    const name = relative(root.pathname, path)
    const body = await readFile(path, 'utf8')
    check(name, body)
  }
}

const threatModel = await readFile(
  new URL('../docs/security-privacy-threat-model.md', import.meta.url),
  'utf8',
)
for (const heading of ['Trust boundaries', 'Persisted-data inventory', 'Release evidence']) {
  if (!threatModel.includes(`## ${heading}`)) failures.push(`threat model is missing ${heading}`)
}

const ciWorkflow = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8')
const releaseWorkflow = await readFile(
  new URL('../.github/workflows/release.yml', import.meta.url),
  'utf8',
)
for (const [name, workflow] of [
  ['CI', ciWorkflow],
  ['release', releaseWorkflow],
]) {
  if (!workflow.includes('npm audit --omit=dev --audit-level=high') && name === 'CI') {
    failures.push('CI does not reject high/critical production dependency findings')
  }
  if (!workflow.includes('npm sbom --omit=dev --sbom-format=cyclonedx')) {
    failures.push(`${name} workflow does not generate a production CycloneDX SBOM`)
  }
}
if (!releaseWorkflow.includes('npm publish --provenance')) {
  failures.push('release workflow does not publish registry provenance')
}

if (failures.length) {
  console.error(`Security gate failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}

console.log(
  'Security gate passes (secrets, transport, threat model, audit, SBOM, and provenance checks).',
)

function check(name, body) {
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(body)) {
    failures.push(`${name} contains a private key`)
  }
  if (
    /(?:api[_-]?key|client[_-]?secret|access[_-]?token|refresh[_-]?token)\s*[:=]\s*['"][A-Za-z0-9._~-]{16,}['"]/i.test(
      body,
    )
  ) {
    failures.push(`${name} contains a credential-shaped literal`)
  }
  for (const match of body.matchAll(/http:\/\/[^\s"'`)}\]]+/g)) {
    if (!/^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/.test(match[0])) {
      failures.push(`${name} contains cleartext URL ${match[0]}`)
    }
  }
}

async function filesUnder(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await filesUnder(path)))
    else files.push(path)
  }
  return files
}
