import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

export function verifyReleaseTag(tag, version) {
  if (!version || typeof version !== 'string') {
    throw new Error('package.json has no valid version')
  }
  if (!tag || typeof tag !== 'string') {
    throw new Error('GITHUB_REF_NAME is required for a package release')
  }
  const expected = `v${version}`
  if (tag !== expected) {
    throw new Error(`release tag ${JSON.stringify(tag)} does not match package version ${expected}`)
  }
  return expected
}

async function main() {
  const packageJson = JSON.parse(
    await readFile(new URL('../package.json', import.meta.url), 'utf8'),
  )
  const tag = verifyReleaseTag(process.env.GITHUB_REF_NAME, packageJson.version)
  console.log(`Release tag ${tag} matches package version.`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
