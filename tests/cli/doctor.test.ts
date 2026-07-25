import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runDoctor } from '../../src/cli/doctor'

function createProject(
  overrides: {
    packageJson?: Record<string, unknown>
    appJson?: Record<string, unknown>
    easJson?: Record<string, unknown>
  } = {},
) {
  const cwd = mkdtempSync(join(tmpdir(), 'pocketshot-doctor-'))
  mkdirSync(cwd, { recursive: true })
  writeFileSync(
    join(cwd, 'package.json'),
    JSON.stringify(
      overrides.packageJson ?? {
        dependencies: {
          '@lastshotlabs/pocketshot': '^0.1.2',
          '@tanstack/react-query': '^5.0.0',
          expo: '~57.0.8',
          'expo-router': '~57.0.8',
          'expo-secure-store': '~57.0.1',
          jotai: '^2.0.0',
          react: '19.2.3',
          'react-native': '0.86.0',
          'react-native-safe-area-context': '~5.7.0',
          'react-native-screens': '~4.26.0',
        },
      },
    ),
  )
  writeFileSync(
    join(cwd, 'app.json'),
    JSON.stringify(
      overrides.appJson ?? {
        expo: {
          scheme: 'testapp',
          ios: { bundleIdentifier: 'com.lastshotlabs.testapp' },
          android: { package: 'com.lastshotlabs.testapp' },
          plugins: ['expo-router', 'expo-secure-store'],
        },
      },
    ),
  )
  writeFileSync(
    join(cwd, 'eas.json'),
    JSON.stringify(
      overrides.easJson ?? {
        build: {
          development: { developmentClient: true },
          preview: { distribution: 'internal' },
          production: { autoIncrement: true },
        },
      },
    ),
  )
  return cwd
}

describe('pocketshot doctor', () => {
  it('passes a release-ready Expo 57 app', () => {
    const result = runDoctor({
      cwd: createProject(),
      release: true,
      env: {
        NODE_ENV: 'test',
        EXPO_PUBLIC_API_URL: 'https://api.example.com',
        EXPO_TOKEN: 'test-token',
      },
    })

    expect(result.ok).toBe(true)
    expect(result.failures).toBe(0)
  })

  it('reports actionable dependency and native identifier failures', () => {
    const cwd = createProject({
      packageJson: {
        dependencies: {
          expo: '54',
          react: '19.1.0',
          'react-native': '0.81.5',
        },
      },
      appJson: { expo: { scheme: 'Bad Scheme' } },
      easJson: { build: {} },
    })
    const result = runDoctor({ cwd, release: true, env: { NODE_ENV: 'test' } })

    expect(result.ok).toBe(false)
    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'ios-bundle-id', status: 'fail' }),
        expect.objectContaining({ id: 'android-package', status: 'fail' }),
        expect.objectContaining({ id: 'eas-profiles', status: 'fail' }),
        expect.objectContaining({ id: 'expo-auth', status: 'fail' }),
      ]),
    )
    expect(result.checks.every((check) => check.status === 'pass' || check.fix)).toBe(true)
  })

  it('warns about development-only release inputs outside release mode', () => {
    const result = runDoctor({ cwd: createProject(), env: { NODE_ENV: 'test' } })

    expect(result.ok).toBe(true)
    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'api-url', status: 'warn' }),
        expect.objectContaining({ id: 'expo-auth', status: 'warn' }),
      ]),
    )
  })
})
