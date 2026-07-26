import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('reference shell release runner', () => {
  it('preserves clean-room bundle evidence for the downstream performance gate', () => {
    const source = readFileSync('scripts/verify-reference-shell.mjs', 'utf8')

    expect(source).toContain("await rm(join(shellDir, 'dist')")
    expect(source).toContain("await cp(join(workingShell, 'dist'), join(shellDir, 'dist')")
    expect(source.indexOf("run('npm', ['run', 'export'])")).toBeLessThan(
      source.indexOf("await cp(join(workingShell, 'dist')"),
    )
  })
})
