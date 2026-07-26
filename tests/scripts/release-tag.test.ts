import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const verifier = join(process.cwd(), 'scripts/verify-release-tag.mjs')
const packageVersion = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'))
  .version as string

function run(tag: string) {
  return spawnSync(process.execPath, [verifier], {
    encoding: 'utf8',
    env: { ...process.env, GITHUB_REF_NAME: tag },
  })
}

describe('release tag verification', () => {
  it('accepts only the exact v-prefixed package version', () => {
    const result = run(`v${packageVersion}`)

    expect(result.status).toBe(0)
    expect(result.stdout).toContain(`Release tag v${packageVersion} matches package version`)
  })

  it.each([packageVersion, 'v999.0.0', `v${packageVersion}-beta.1`, ''])(
    'rejects mismatched tag %j',
    (tag) => {
      const result = run(tag)

      expect(result.status).toBe(1)
      expect(result.stderr).toMatch(/does not match|is required/)
    },
  )
})
