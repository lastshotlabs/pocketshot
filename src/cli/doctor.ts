import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export type DoctorStatus = 'pass' | 'warn' | 'fail'

export interface DoctorCheck {
  id: string
  status: DoctorStatus
  message: string
  fix?: string
}

export interface DoctorResult {
  checks: DoctorCheck[]
  failures: number
  warnings: number
  ok: boolean
}

interface DoctorOptions {
  cwd: string
  release?: boolean
  env?: NodeJS.ProcessEnv
}

interface PackageJson {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

interface ExpoAppJson {
  expo?: {
    scheme?: string
    plugins?: Array<string | [string, unknown]>
    ios?: { bundleIdentifier?: string }
    android?: { package?: string }
  }
}

interface EasJson {
  build?: Record<string, Record<string, unknown>>
  submit?: Record<string, Record<string, unknown>>
}

const REQUIRED_DEPENDENCIES = [
  '@lastshotlabs/pocketshot',
  '@tanstack/react-query',
  'expo',
  'expo-router',
  'expo-secure-store',
  'jotai',
  'react',
  'react-native',
  'react-native-safe-area-context',
  'react-native-screens',
] as const

const EXPECTED_EXPO_57_VERSIONS: Record<string, string> = {
  expo: '57',
  react: '19.2',
  'react-native': '0.86',
}

function readJson<T>(path: string): T | undefined {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T
  } catch {
    return undefined
  }
}

function declaredVersion(pkg: PackageJson, name: string): string | undefined {
  return pkg.dependencies?.[name] ?? pkg.devDependencies?.[name]
}

function numericVersion(version: string): string {
  return version.match(/\d+(?:\.\d+)*/)?.[0] ?? ''
}

function add(
  checks: DoctorCheck[],
  id: string,
  condition: boolean,
  passMessage: string,
  failMessage: string,
  fix: string,
) {
  checks.push(
    condition
      ? { id, status: 'pass', message: passMessage }
      : { id, status: 'fail', message: failMessage, fix },
  )
}

export function runDoctor({
  cwd,
  release = false,
  env = process.env,
}: DoctorOptions): DoctorResult {
  const checks: DoctorCheck[] = []
  const packagePath = join(cwd, 'package.json')
  const pkg = readJson<PackageJson>(packagePath)

  add(
    checks,
    'package-json',
    Boolean(pkg),
    'package.json is readable.',
    'package.json is missing or invalid JSON.',
    'Run doctor from the Expo app root or repair package.json.',
  )

  if (pkg) {
    for (const dependency of REQUIRED_DEPENDENCIES) {
      add(
        checks,
        `dependency:${dependency}`,
        Boolean(declaredVersion(pkg, dependency)),
        `${dependency} is declared.`,
        `${dependency} is not declared.`,
        `Install ${dependency} with the Expo-compatible version.`,
      )
    }

    for (const [dependency, expected] of Object.entries(EXPECTED_EXPO_57_VERSIONS)) {
      const actual = numericVersion(declaredVersion(pkg, dependency) ?? '')
      add(
        checks,
        `compatibility:${dependency}`,
        actual.startsWith(expected),
        `${dependency} ${actual} matches the Expo 57 compatibility line.`,
        `${dependency || 'dependency'} ${actual || '(missing)'} does not match Expo 57 (${expected}.x).`,
        'Run `npx expo install --fix`, then `npx expo-doctor`.',
      )
    }
  }

  const appJsonPath = join(cwd, 'app.json')
  const appJson = readJson<ExpoAppJson>(appJsonPath)
  if (!appJson) {
    const hasDynamicConfig = ['app.config.ts', 'app.config.js', 'app.config.mjs'].some((name) =>
      existsSync(join(cwd, name)),
    )
    checks.push({
      id: 'app-config',
      status: hasDynamicConfig ? 'warn' : 'fail',
      message: hasDynamicConfig
        ? 'Dynamic app config found; identifier checks require resolved Expo config.'
        : 'No readable app.json or dynamic app config was found.',
      fix: hasDynamicConfig
        ? 'Run `npx expo config --type public` and verify the resolved identifiers.'
        : 'Create app.json or app.config.ts.',
    })
  } else {
    const expo = appJson.expo
    add(
      checks,
      'ios-bundle-id',
      /^[a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9-]+){2,}$/.test(expo?.ios?.bundleIdentifier ?? ''),
      `iOS bundle identifier is ${expo?.ios?.bundleIdentifier}.`,
      'iOS bundle identifier is missing or invalid.',
      'Set expo.ios.bundleIdentifier to a unique reverse-DNS identifier.',
    )
    add(
      checks,
      'android-package',
      /^[a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*){2,}$/.test(expo?.android?.package ?? ''),
      `Android package is ${expo?.android?.package}.`,
      'Android package is missing or invalid.',
      'Set expo.android.package to a unique reverse-DNS application ID.',
    )
    add(
      checks,
      'scheme',
      /^[a-z][a-z0-9+.-]*$/.test(expo?.scheme ?? ''),
      `Deep-link scheme is ${expo?.scheme}.`,
      'Deep-link scheme is missing or invalid.',
      'Set expo.scheme to a lowercase URI scheme.',
    )

    const plugins = new Set(
      (expo?.plugins ?? []).map((plugin) => (Array.isArray(plugin) ? plugin[0] : plugin)),
    )
    for (const plugin of plugins) {
      if (plugin.startsWith('expo-') && !declaredVersion(pkg ?? {}, plugin)) {
        checks.push({
          id: `plugin:${plugin}`,
          status: 'fail',
          message: `${plugin} is configured as a plugin but is not declared.`,
          fix: `Run \`npx expo install ${plugin}\`.`,
        })
      }
    }
  }

  const eas = readJson<EasJson>(join(cwd, 'eas.json'))
  add(
    checks,
    'eas-profiles',
    Boolean(eas?.build?.development && eas.build.preview && eas.build.production),
    'EAS development, preview, and production profiles are present.',
    'Required EAS build profiles are missing.',
    'Generate eas.json with development, preview, and production profiles.',
  )
  add(
    checks,
    'eas-preview',
    eas?.build?.preview?.distribution === 'internal',
    'EAS preview profile uses internal distribution.',
    'EAS preview profile is not configured for internal distribution.',
    'Set build.preview.distribution to "internal".',
  )

  const apiUrl = env.EXPO_PUBLIC_API_URL
  const validApiUrl = (() => {
    if (!apiUrl) return false
    try {
      const url = new URL(apiUrl)
      return url.protocol === 'https:' || url.hostname === 'localhost'
    } catch {
      return false
    }
  })()
  checks.push(
    validApiUrl
      ? { id: 'api-url', status: 'pass', message: 'EXPO_PUBLIC_API_URL is a valid endpoint.' }
      : {
          id: 'api-url',
          status: release ? 'fail' : 'warn',
          message: 'EXPO_PUBLIC_API_URL is missing, invalid, or insecure.',
          fix: 'Set an HTTPS EXPO_PUBLIC_API_URL (localhost is allowed for development).',
        },
  )

  checks.push(
    env.EXPO_TOKEN
      ? { id: 'expo-auth', status: 'pass', message: 'EXPO_TOKEN is available for EAS automation.' }
      : {
          id: 'expo-auth',
          status: release ? 'fail' : 'warn',
          message: 'EXPO_TOKEN is not available.',
          fix: 'Authenticate with EAS or provide EXPO_TOKEN through the CI secret store.',
        },
  )

  const failures = checks.filter((check) => check.status === 'fail').length
  const warnings = checks.filter((check) => check.status === 'warn').length
  return { checks, failures, warnings, ok: failures === 0 }
}
