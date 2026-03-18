import { execSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
}

/** Strips all non-alphanumeric characters for use as a URL scheme. */
export function schemeify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** Augment PATH so that bun is found when execSync spawns cmd.exe on Windows */
function getEnvWithBun(): NodeJS.ProcessEnv {
  if (os.platform() !== 'win32') return process.env
  const bunDir = path.join(os.homedir(), '.bun', 'bin')
  const current = process.env.PATH ?? ''
  if (current.includes(bunDir)) return process.env
  return { ...process.env, PATH: `${bunDir};${current}` }
}

// Intentionally synchronous — CLI scaffold steps must run in sequence
export function exec(cmd: string, cwd: string, silent = false): void {
  execSync(cmd, { cwd, stdio: silent ? 'pipe' : 'inherit', env: getEnvWithBun() })
}
