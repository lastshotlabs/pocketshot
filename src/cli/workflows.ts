import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { runDoctor, type DoctorCheck, type DoctorResult } from './doctor'
import { easJsonTemplate } from './templates/eas-json'

type JsonObject = Record<string, unknown>

export interface WorkflowChange {
  path: string
  before?: string
  after: string
  reason: string
  breaking?: boolean
}

export interface WorkflowResult {
  ok: boolean
  changed: boolean
  changes: WorkflowChange[]
  diagnostics: DoctorCheck[]
}

const EXPO_57: Record<string, string> = {
  expo: '~57.0.8',
  'expo-dev-client': '~57.0.9',
  'expo-linking': '~57.0.4',
  'expo-router': '~57.0.8',
  'expo-secure-store': '~57.0.1',
  'expo-status-bar': '~57.0.1',
  'expo-web-browser': '~57.0.2',
  react: '19.2.3',
  'react-native': '0.86.0',
  'react-native-safe-area-context': '~5.7.0',
  'react-native-screens': '~4.26.0',
}

function readJson(path: string): JsonObject | undefined {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as JsonObject
  } catch {
    return undefined
  }
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as JsonObject)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function major(version: string): number | undefined {
  const match = version.match(/\d+/)
  return match ? Number(match[0]) : undefined
}

export function runEasWorkflow({
  cwd,
  write = false,
  force = false,
}: {
  cwd: string
  write?: boolean
  force?: boolean
}): WorkflowResult {
  const path = join(cwd, 'eas.json')
  const current = readJson(path)
  const recommended = JSON.parse(easJsonTemplate()) as JsonObject
  const changes: WorkflowChange[] = []
  const diagnostics: DoctorCheck[] = []

  if (existsSync(path) && !current) {
    diagnostics.push({
      id: 'eas-json',
      status: 'fail',
      message: 'eas.json contains invalid JSON.',
      fix: 'Repair it manually, or rerun with `pocketshot eas --write --force`.',
    })
  } else if (!current || stable(current) !== stable(recommended)) {
    changes.push({
      path: 'eas.json',
      before: current ? JSON.stringify(current, null, 2) : undefined,
      after: easJsonTemplate(),
      reason: current
        ? 'EAS profiles differ from the Pocketshot release baseline.'
        : 'EAS configuration is missing.',
    })
  }

  const canWrite = write && (Boolean(current) || !existsSync(path) || force)
  if (canWrite && changes.length) {
    // eas.json is the generated boundary for this command. Existing valid custom
    // files are not overwritten: force is required to replace them.
    if (current && !force) {
      diagnostics.push({
        id: 'manual-boundary:eas-json',
        status: 'fail',
        message: 'Existing eas.json is treated as manually owned.',
        fix: 'Review the diff, then pass --force to replace it with the generated baseline.',
      })
    } else {
      writeFileSync(path, `${easJsonTemplate()}\n`, 'utf8')
    }
  }

  const failures = diagnostics.filter((item) => item.status === 'fail').length
  return {
    ok: failures === 0 && (!changes.length || canWrite),
    changed: Boolean(canWrite && changes.length && (!current || force)),
    changes,
    diagnostics,
  }
}

export function runUpgradeWorkflow({
  cwd,
  write = false,
}: {
  cwd: string
  write?: boolean
}): WorkflowResult {
  const path = join(cwd, 'package.json')
  const pkg = readJson(path)
  const changes: WorkflowChange[] = []
  const diagnostics: DoctorCheck[] = []
  if (!pkg) {
    return {
      ok: false,
      changed: false,
      changes,
      diagnostics: [
        {
          id: 'package-json',
          status: 'fail',
          message: 'package.json is missing or invalid.',
          fix: 'Run upgrade from the Expo app root.',
        },
      ],
    }
  }

  const dependencies = (pkg.dependencies ?? {}) as Record<string, string>
  for (const [name, target] of Object.entries(EXPO_57)) {
    const before = dependencies[name]
    if (before !== target) {
      const breaking = name === 'expo' && before !== undefined && major(before) !== 57
      changes.push({
        path: `package.json#dependencies.${name}`,
        before,
        after: target,
        reason: breaking
          ? `Expo SDK ${major(before) ?? 'unknown'} → 57 may require native and API migrations.`
          : 'Align with the tested Pocketshot Expo 57 compatibility line.',
        breaking,
      })
    }
  }

  if (changes.some((item) => item.breaking)) {
    diagnostics.push({
      id: 'breaking:expo-sdk',
      status: 'warn',
      message: 'A cross-SDK Expo upgrade was detected.',
      fix: 'Review the Expo SDK 57 migration guide and regenerate native projects before release.',
    })
  }
  if (write && changes.length) {
    pkg.dependencies = { ...dependencies }
    for (const change of changes) {
      const name = change.path.slice('package.json#dependencies.'.length)
      ;(pkg.dependencies as Record<string, string>)[name] = change.after
    }
    writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8')
  }
  return { ok: true, changed: write && changes.length > 0, changes, diagnostics }
}

export interface VerifyResult extends DoctorResult {
  generatedFiles: string[]
}

export function runVerifyWorkflow({
  cwd,
  release = false,
  env,
}: {
  cwd: string
  release?: boolean
  env?: NodeJS.ProcessEnv
}): VerifyResult {
  const doctor = runDoctor({ cwd, release, env })
  const generatedFiles = ['lib/api/index.ts', 'lib/hooks/index.ts', 'lib/types/api.ts'].filter(
    (relative) => {
      const path = join(cwd, relative)
      if (!existsSync(path)) return false
      return readFileSync(path, 'utf8').startsWith(
        '// Generated by npx pocketshot sync. Do not edit manually.',
      )
    },
  )
  const checks = [...doctor.checks]
  const config = readJson(join(cwd, 'pocketshot.config.json'))
  if (config && generatedFiles.length === 0) {
    checks.push({
      id: 'generated-boundary',
      status: 'warn',
      message: 'Pocketshot sync is configured but no marked generated outputs were found.',
      fix: 'Run `npx pocketshot sync`; edit source config, not marked generated files.',
    })
  }
  const failures = checks.filter((item) => item.status === 'fail').length
  const warnings = checks.filter((item) => item.status === 'warn').length
  return { checks, failures, warnings, ok: failures === 0, generatedFiles }
}
