import { describe, expect, it } from 'vitest'
import {
  LocalProductionServiceHarness,
  ProductionServiceRegistry,
  ReleaseControlPlane,
  createProductServiceRegistry,
  inspectRuntimeServices,
  productEnvironmentFromPublicConfig,
  type ProductReleaseManifest,
} from '../../src/release'

const manifest: ProductReleaseManifest = {
  product: 'blankslate',
  version: '1.0.0',
  build: 1,
  bundleIdentifier: 'com.lastshotlabs.blankslate',
  androidPackage: 'com.lastshotlabs.blankslate',
  apiUrl: 'https://api.example.test',
  privacyUrl: 'https://example.test/privacy',
  termsUrl: 'https://example.test/terms',
  supportUrl: 'https://example.test/support',
  deletionUrl: 'https://example.test/delete',
  associatedDomains: ['applinks:example.test'],
  requiredServices: ['api', 'auth', 'apple_oauth', 'fcm', 'billing', 'feature_flags'],
}

describe('production release services', () => {
  it('separates code readiness from credential prerequisites', () => {
    const registry = new ProductionServiceRegistry(manifest)
    registry.configure({ service: 'api', enabled: true, endpoint: manifest.apiUrl })
    registry.configure({ service: 'auth', enabled: true, endpoint: `${manifest.apiUrl}/auth` })
    registry.configure({ service: 'apple_oauth', enabled: true, publicClientId: 'apple-client' })
    registry.configure({ service: 'fcm', enabled: true })
    registry.configure({
      service: 'billing',
      enabled: true,
      products: ['blankslate.pro.monthly'],
    })
    registry.configure({ service: 'feature_flags', enabled: true })
    expect(registry.readiness()).toMatchObject({
      codeReady: true,
      externalReady: false,
      failures: [],
    })
    expect(
      registry.readiness({
        credentials: {
          apple_oauth: true,
          fcm: true,
          billing: true,
          feature_flags: true,
        },
      }),
    ).toMatchObject({ codeReady: true, externalReady: true })
    expect(registry.redactedSnapshot().services).toContainEqual(
      expect.objectContaining({ service: 'apple_oauth', publicClientId: '[CONFIGURED]' }),
    )
  })

  it('fails code readiness for missing entitlement mappings', () => {
    const registry = new ProductionServiceRegistry({
      ...manifest,
      requiredServices: ['billing'],
    })
    registry.configure({ service: 'billing', enabled: true })
    expect(registry.readiness().failures).toContain('billing has no entitlement product mappings')
  })

  it('drives phased rollout, kill switch, hotfix, rollback, and drills', () => {
    const control = new ReleaseControlPlane('1.0.0')
    control.deploy('1.1.0', 'production', 5)
    control.setKillSwitch('ai-actions', true)
    control.setRollout(25)
    control.recordHotfix('hotfix-427')
    control.recordDrill('support-diagnostics', true, '2026-07-25T00:00:00Z')
    expect(control.isKilled('ai-actions')).toBe(true)
    expect(control.rollback('Elevated crash-free session regression')).toBe('1.0.0')
    expect(JSON.parse(control.diagnostics())).toMatchObject({
      schemaVersion: 1,
      release: { rollbackReason: 'Elevated crash-free session regression' },
    })
  })

  it('provides credential-free adapters for deterministic product development', () => {
    const harness = new LocalProductionServiceHarness()
    harness.emit({
      service: 'analytics',
      name: 'round_completed',
      at: '2026-07-25T00:00:00Z',
      attributes: { round: 2 },
    })
    expect(harness.snapshot()).toHaveLength(1)
    harness.clear()
    expect(harness.snapshot()).toEqual([])
  })

  it('defines code-complete service and entitlement catalogs for all five products', () => {
    const environment = {
      apiUrl: 'https://api.example.test',
      privacyUrl: 'https://example.test/privacy',
      termsUrl: 'https://example.test/terms',
      supportUrl: 'https://example.test/support',
      deletionUrl: 'https://example.test/delete',
      associatedDomains: ['applinks:example.test'],
    }
    for (const product of ['hitshot', 'aicoach', 'sgforum', 'burndown', 'blankslate'] as const) {
      const registry = createProductServiceRegistry(product, '1.0.0', 1, environment)
      expect(registry.readiness()).toMatchObject({ codeReady: true, externalReady: false })
      expect(registry.get('billing')?.products?.length).toBeGreaterThan(0)
    }
    expect(
      createProductServiceRegistry('hitshot', '1.0.0', 1, environment).get('spotify'),
    ).toMatchObject({ enabled: true })
    expect(
      createProductServiceRegistry('blankslate', '1.0.0', 1, environment).get('spotify'),
    ).toBeNull()
  })

  it('builds a redaction-safe production environment from Expo public configuration', () => {
    const environment = productEnvironmentFromPublicConfig({
      EXPO_PUBLIC_API_URL: 'https://api.example.test',
      EXPO_PUBLIC_WS_ENDPOINT: 'wss://api.example.test/realtime',
      EXPO_PUBLIC_LINK_HOST: 'links.example.test',
      EXPO_PUBLIC_PRIVACY_URL: 'https://example.test/privacy',
      EXPO_PUBLIC_TERMS_URL: 'https://example.test/terms',
      EXPO_PUBLIC_SUPPORT_URL: 'https://example.test/support',
      EXPO_PUBLIC_DELETION_URL: 'https://example.test/delete',
      EXPO_PUBLIC_APPLE_SERVICE_ID: 'apple-client',
      EXPO_PUBLIC_ANALYTICS_ENDPOINT: 'https://events.example.test',
    })
    expect(environment).toMatchObject({
      apiUrl: 'https://api.example.test',
      webSocketUrl: 'wss://api.example.test/realtime',
      associatedDomains: ['applinks:links.example.test'],
      appleClientId: 'apple-client',
      analyticsEndpoint: 'https://events.example.test',
    })
    expect(() => productEnvironmentFromPublicConfig({})).toThrow('EXPO_PUBLIC_LINK_HOST')
    expect(() =>
      productEnvironmentFromPublicConfig({
        EXPO_PUBLIC_LINK_HOST: 'https://bad.example.test',
      }),
    ).toThrow('hostname')
  })

  it('reports incomplete development configuration and fails fast in production', () => {
    const create = () => {
      throw new Error('EXPO_PUBLIC_API_URL is required')
    }
    expect(inspectRuntimeServices(create)).toMatchObject({
      status: 'invalid',
      codeReady: false,
      failures: ['EXPO_PUBLIC_API_URL is required'],
    })
    expect(() => inspectRuntimeServices(create, true)).toThrow('EXPO_PUBLIC_API_URL')
    expect(
      inspectRuntimeServices(() =>
        createProductServiceRegistry('aicoach', '1.0.0', 1, {
          apiUrl: 'https://api.example.test',
          privacyUrl: 'https://example.test/privacy',
          termsUrl: 'https://example.test/terms',
          supportUrl: 'https://example.test/support',
          deletionUrl: 'https://example.test/delete',
          associatedDomains: ['applinks:example.test'],
        }),
      ).status,
    ).toBe('external-required')
  })
})
