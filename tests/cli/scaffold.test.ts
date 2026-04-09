import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtempSync, rmSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { scaffold } from '../../src/cli/scaffold'
import type { PocketshotScaffoldConfig } from '../../src/cli/types'

describe('scaffold', () => {
  let dir: string

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'ps-test-'))
    const config: PocketshotScaffoldConfig = {
      projectName: 'Test App',
      packageName: 'test-app',
      appId: 'com.example.testapp',
      scheme: 'testapp',
      dir,
      authScreens: true,
      mfaScreens: true,
      oauthScreens: true,
      webSocket: true,
      communityScreens: false,
      gitInit: false, // skip git for test speed
      pushNotifications: false,
      deepLinks: false,
      offlineSupport: false,
      orgSupport: false,
    }
    await scaffold(config)
  }, 60_000)

  afterAll(() => rmSync(dir, { recursive: true, force: true }))

  const expectedFiles = [
    'package.json',
    'app.json',
    'tsconfig.json',
    '.env.example',
    '.gitignore',
    'pocketshot.config.json',
    'lib/config.ts',
    'lib/pocketshot.ts',
    'app/_layout.tsx',
    'app/(app)/_layout.tsx',
    'app/(app)/index.tsx',
    'app/(auth)/_layout.tsx',
    'app/(auth)/login.tsx',
    'app/(auth)/register.tsx',
    'app/(auth)/mfa.tsx',
    'app/(auth)/forgot-password.tsx',
    'app/(auth)/reset-password.tsx',
    'app/(auth)/verify-email.tsx',
    'app/(auth)/oauth-callback.tsx',
    'app/(app)/settings/index.tsx',
    'app/(app)/settings/password.tsx',
    'app/(app)/settings/sessions.tsx',
    'app/(app)/settings/delete-account.tsx',
    'app/(app)/settings/email-otp.tsx',
    'app/(app)/mfa-setup.tsx',
  ]

  for (const file of expectedFiles) {
    it(`writes ${file}`, () => {
      expect(() => readFileSync(join(dir, file), 'utf8')).not.toThrow()
    })
  }

  it('package.json has correct name', () => {
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    expect(pkg.name).toBe('test-app')
    expect(pkg.dependencies['@lastshotlabs/pocketshot']).toBe('latest')
  })

  it('package.json includes qrcode deps when mfaScreens', () => {
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    expect(pkg.dependencies['react-native-qrcode-svg']).toBeDefined()
    expect(pkg.dependencies['react-native-svg']).toBeDefined()
  })

  it('lib/pocketshot.ts includes WS when webSocket=true', () => {
    const content = readFileSync(join(dir, 'lib/pocketshot.ts'), 'utf8')
    expect(content).toContain('WS_ENDPOINT')
    expect(content).toContain('useRoom')
  })

  it('lib/pocketshot.ts includes MFA hooks when mfaScreens=true', () => {
    const content = readFileSync(join(dir, 'lib/pocketshot.ts'), 'utf8')
    expect(content).toContain('useMfaSetup')
    expect(content).toContain('useEmailOtpEnable')
  })

  it('lib/pocketshot.ts includes auth hooks when authScreens=true', () => {
    const content = readFileSync(join(dir, 'lib/pocketshot.ts'), 'utf8')
    expect(content).toContain('useForgotPassword')
    expect(content).toContain('useSessions')
  })

  it('app.json has correct scheme', () => {
    const app = JSON.parse(readFileSync(join(dir, 'app.json'), 'utf8'))
    expect(app.expo.scheme).toBe('testapp')
  })

  it('app.json has correct bundle identifier', () => {
    const app = JSON.parse(readFileSync(join(dir, 'app.json'), 'utf8'))
    expect(app.expo.ios.bundleIdentifier).toBe('com.example.testapp')
    expect(app.expo.android.package).toBe('com.example.testapp')
  })

  it('pocketshot.config.json has pocketshotImport field', () => {
    const cfg = JSON.parse(readFileSync(join(dir, 'pocketshot.config.json'), 'utf8'))
    expect(cfg.pocketshotImport).toBe('@/lib/pocketshot')
  })

  it('.env.example has EXPO_PUBLIC_API_URL', () => {
    const content = readFileSync(join(dir, '.env.example'), 'utf8')
    expect(content).toContain('EXPO_PUBLIC_API_URL')
  })

  it('.env.example has EXPO_PUBLIC_WS_ENDPOINT when webSocket=true', () => {
    const content = readFileSync(join(dir, '.env.example'), 'utf8')
    expect(content).toContain('EXPO_PUBLIC_WS_ENDPOINT')
  })

  it('tsconfig.json extends expo/tsconfig.base', () => {
    const cfg = JSON.parse(readFileSync(join(dir, 'tsconfig.json'), 'utf8'))
    expect(cfg.extends).toBe('expo/tsconfig.base')
  })

  it('auth layout includes all expected screens', () => {
    const content = readFileSync(join(dir, 'app/(auth)/_layout.tsx'), 'utf8')
    expect(content).toContain('login')
    expect(content).toContain('register')
    expect(content).toContain('mfa')
    expect(content).toContain('forgot-password')
    expect(content).toContain('oauth-callback')
  })
})

describe('scaffold without optional features', () => {
  let dir: string

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'ps-minimal-'))
    const config: PocketshotScaffoldConfig = {
      projectName: 'Minimal App',
      packageName: 'minimal-app',
      appId: 'com.example.minimal',
      scheme: 'minimal',
      dir,
      authScreens: false,
      mfaScreens: false,
      oauthScreens: false,
      webSocket: false,
      communityScreens: false,
      gitInit: false,
      pushNotifications: false,
      deepLinks: false,
      offlineSupport: false,
      orgSupport: false,
    }
    await scaffold(config)
  }, 60_000)

  afterAll(() => rmSync(dir, { recursive: true, force: true }))

  it('does NOT write settings files when authScreens=false', () => {
    expect(() => readFileSync(join(dir, 'app/(app)/settings/index.tsx'), 'utf8')).toThrow()
  })

  it('does NOT write oauth-callback when oauthScreens=false', () => {
    expect(() => readFileSync(join(dir, 'app/(auth)/oauth-callback.tsx'), 'utf8')).toThrow()
  })

  it('does NOT write mfa-setup when mfaScreens=false', () => {
    expect(() => readFileSync(join(dir, 'app/(app)/mfa-setup.tsx'), 'utf8')).toThrow()
  })

  it('lib/pocketshot.ts does NOT include WS when webSocket=false', () => {
    const content = readFileSync(join(dir, 'lib/pocketshot.ts'), 'utf8')
    expect(content).not.toContain('WS_ENDPOINT')
    expect(content).not.toContain('useRoom')
  })

  it('package.json does NOT include qrcode deps when mfaScreens=false', () => {
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    expect(pkg.dependencies['react-native-qrcode-svg']).toBeUndefined()
  })

  it('.env.example does NOT have EXPO_PUBLIC_WS_ENDPOINT when webSocket=false', () => {
    const content = readFileSync(join(dir, '.env.example'), 'utf8')
    expect(content).not.toContain('EXPO_PUBLIC_WS_ENDPOINT')
  })
})
