export type ProductId = 'hitshot' | 'aicoach' | 'sgforum' | 'burndown' | 'blankslate'

export type ProductionService =
  | 'api'
  | 'auth'
  | 'apple_oauth'
  | 'google_oauth'
  | 'spotify'
  | 'audius'
  | 'apns'
  | 'fcm'
  | 'billing'
  | 'analytics'
  | 'crash_reporting'
  | 'feature_flags'

export interface ProductReleaseManifest {
  product: ProductId
  version: string
  build: number
  bundleIdentifier: string
  androidPackage: string
  apiUrl: string
  webSocketUrl?: string
  privacyUrl: string
  termsUrl: string
  supportUrl: string
  deletionUrl: string
  associatedDomains: string[]
  requiredServices: ProductionService[]
}

export interface ServiceConfiguration {
  service: ProductionService
  enabled: boolean
  endpoint?: string
  publicClientId?: string
  products?: string[]
  metadata?: Record<string, string | number | boolean>
}

export interface ReleaseReadiness {
  codeReady: boolean
  externalReady: boolean
  failures: string[]
  externalPrerequisites: string[]
}

export interface RuntimeServiceReadiness extends ReleaseReadiness {
  status: 'code-ready' | 'external-required' | 'invalid'
}

export function inspectRuntimeServices(
  createRegistry: () => ProductionServiceRegistry,
  strict = false,
): RuntimeServiceReadiness {
  try {
    const readiness = createRegistry().readiness()
    const result: RuntimeServiceReadiness = {
      ...readiness,
      status: readiness.codeReady
        ? readiness.externalReady
          ? 'code-ready'
          : 'external-required'
        : 'invalid',
    }
    if (strict && !result.codeReady) {
      throw new Error(`Production service configuration is invalid: ${result.failures.join(', ')}`)
    }
    return result
  } catch (cause) {
    if (strict) throw cause
    const error = cause instanceof Error ? cause : new Error(String(cause))
    return {
      status: 'invalid',
      codeReady: false,
      externalReady: false,
      failures: [error.message],
      externalPrerequisites: [],
    }
  }
}

const credentialServices = new Set<ProductionService>([
  'apple_oauth',
  'google_oauth',
  'spotify',
  'audius',
  'apns',
  'fcm',
  'billing',
  'analytics',
  'crash_reporting',
  'feature_flags',
])

export class ProductionServiceRegistry {
  private configurations = new Map<ProductionService, ServiceConfiguration>()

  constructor(readonly manifest: ProductReleaseManifest) {
    validateManifest(manifest)
  }

  configure(configuration: ServiceConfiguration): void {
    if (configuration.endpoint) validateSecureUrl(configuration.endpoint, configuration.service)
    if (configuration.products?.some((product) => !product.trim())) {
      throw new Error(`${configuration.service} contains an empty product mapping`)
    }
    this.configurations.set(configuration.service, structuredClone(configuration))
  }

  get(service: ProductionService): ServiceConfiguration | null {
    const configuration = this.configurations.get(service)
    return configuration ? structuredClone(configuration) : null
  }

  readiness(
    options: { credentials?: Partial<Record<ProductionService, boolean>> } = {},
  ): ReleaseReadiness {
    const failures: string[] = []
    const externalPrerequisites: string[] = []
    for (const service of this.manifest.requiredServices) {
      const configuration = this.configurations.get(service)
      if (!configuration?.enabled) {
        failures.push(`${service} is not enabled`)
        continue
      }
      if (credentialServices.has(service) && !options.credentials?.[service]) {
        externalPrerequisites.push(`${service} production credentials`)
      }
      if (service === 'billing' && !configuration.products?.length) {
        failures.push('billing has no entitlement product mappings')
      }
    }
    return {
      codeReady: failures.length === 0,
      externalReady: failures.length === 0 && externalPrerequisites.length === 0,
      failures,
      externalPrerequisites,
    }
  }

  redactedSnapshot(): {
    manifest: ProductReleaseManifest
    services: ServiceConfiguration[]
  } {
    return {
      manifest: structuredClone(this.manifest),
      services: [...this.configurations.values()].map((configuration) => ({
        ...structuredClone(configuration),
        publicClientId: configuration.publicClientId ? '[CONFIGURED]' : undefined,
        metadata: configuration.metadata
          ? Object.fromEntries(
              Object.entries(configuration.metadata).map(([key, value]) => [
                key,
                /secret|token|key|receipt/i.test(key) ? '[REDACTED]' : value,
              ]),
            )
          : undefined,
      })),
    }
  }
}

export type ReleaseChannel = 'development' | 'preview' | 'production'

export interface ReleaseControlSnapshot {
  channel: ReleaseChannel
  deployedVersion: string
  previousVersion: string | null
  rolloutPercent: number
  killSwitches: string[]
  rollbackReason: string | null
  lastHotfix: string | null
}

export class ReleaseControlPlane {
  private state: ReleaseControlSnapshot
  private drills = new Map<string, { passed: boolean; at: string; notes: string }>()

  constructor(
    version: string,
    channel: ReleaseChannel = 'development',
    private readonly maximumDrills = 100,
  ) {
    if (!version.trim()) throw new Error('Release version is required')
    if (!Number.isInteger(maximumDrills) || maximumDrills < 1) {
      throw new Error('Maximum drills must be a positive integer')
    }
    this.state = {
      channel,
      deployedVersion: version,
      previousVersion: null,
      rolloutPercent: channel === 'production' ? 1 : 100,
      killSwitches: [],
      rollbackReason: null,
      lastHotfix: null,
    }
  }

  get snapshot(): ReleaseControlSnapshot {
    return structuredClone(this.state)
  }

  deploy(version: string, channel: ReleaseChannel, rolloutPercent?: number): void {
    if (!version.trim()) throw new Error('Release version is required')
    const rollout = rolloutPercent ?? (channel === 'production' ? 1 : 100)
    validateRollout(rollout)
    this.state.previousVersion = this.state.deployedVersion
    this.state.deployedVersion = version
    this.state.channel = channel
    this.state.rolloutPercent = rollout
    this.state.rollbackReason = null
  }

  setRollout(percent: number): void {
    validateRollout(percent)
    this.state.rolloutPercent = percent
  }

  setKillSwitch(capability: string, active: boolean): void {
    if (!capability.trim()) throw new Error('Kill-switch capability is required')
    const values = new Set(this.state.killSwitches)
    if (active) values.add(capability)
    else values.delete(capability)
    this.state.killSwitches = [...values].sort()
  }

  isKilled(capability: string): boolean {
    return this.state.killSwitches.includes(capability)
  }

  rollback(reason: string): string {
    if (!this.state.previousVersion) throw new Error('No previous release is available')
    if (!reason.trim()) throw new Error('Rollback reason is required')
    const current = this.state.deployedVersion
    this.state.deployedVersion = this.state.previousVersion
    this.state.previousVersion = current
    this.state.rolloutPercent = 100
    this.state.rollbackReason = reason.trim()
    return this.state.deployedVersion
  }

  recordHotfix(reference: string): void {
    if (!reference.trim()) throw new Error('Hotfix reference is required')
    this.state.lastHotfix = reference.trim()
  }

  recordDrill(name: string, passed: boolean, at: string, notes = ''): void {
    if (!name.trim() || !Number.isFinite(Date.parse(at))) {
      throw new Error('Drill name and timestamp are required')
    }
    this.drills.delete(name)
    this.drills.set(name, { passed, at, notes: scrubReleaseText(notes).slice(0, 500) })
    while (this.drills.size > this.maximumDrills) {
      this.drills.delete(this.drills.keys().next().value!)
    }
  }

  diagnostics(): string {
    return JSON.stringify({
      schemaVersion: 1,
      release: this.state,
      drills: Object.fromEntries(this.drills),
    })
  }
}

export interface LocalServiceEvent {
  service: ProductionService
  name: string
  at: string
  attributes: Record<string, string | number | boolean | null>
}

export class LocalProductionServiceHarness {
  private events: LocalServiceEvent[] = []

  constructor(private readonly capacity = 500) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new Error('Harness capacity must be a positive integer')
    }
  }

  emit(event: LocalServiceEvent): void {
    this.events.push({
      ...structuredClone(event),
      attributes: Object.fromEntries(
        Object.entries(event.attributes).map(([key, value]) => [
          key,
          /authorization|cookie|email|password|phone|secret|token|receipt/i.test(key)
            ? '[REDACTED]'
            : typeof value === 'string'
              ? scrubReleaseText(value).slice(0, 500)
              : value,
        ]),
      ),
    })
    if (this.events.length > this.capacity) this.events.shift()
  }

  snapshot(): LocalServiceEvent[] {
    return structuredClone(this.events)
  }

  clear(): void {
    this.events = []
  }
}

export interface ProductEnvironment {
  apiUrl: string
  webSocketUrl?: string
  privacyUrl: string
  termsUrl: string
  supportUrl: string
  deletionUrl: string
  associatedDomains: string[]
  appleClientId?: string
  googleClientId?: string
  spotifyClientId?: string
  audiusClientId?: string
  analyticsEndpoint?: string
  crashEndpoint?: string
  featureFlagEndpoint?: string
}

export type PublicProductEnvironment = Partial<
  Record<
    | 'EXPO_PUBLIC_API_URL'
    | 'EXPO_PUBLIC_WS_ENDPOINT'
    | 'EXPO_PUBLIC_LINK_HOST'
    | 'EXPO_PUBLIC_PRIVACY_URL'
    | 'EXPO_PUBLIC_TERMS_URL'
    | 'EXPO_PUBLIC_SUPPORT_URL'
    | 'EXPO_PUBLIC_DELETION_URL'
    | 'EXPO_PUBLIC_APPLE_SERVICE_ID'
    | 'EXPO_PUBLIC_GOOGLE_CLIENT_ID'
    | 'EXPO_PUBLIC_SPOTIFY_CLIENT_ID'
    | 'EXPO_PUBLIC_AUDIUS_CLIENT_ID'
    | 'EXPO_PUBLIC_ANALYTICS_ENDPOINT'
    | 'EXPO_PUBLIC_CRASH_ENDPOINT'
    | 'EXPO_PUBLIC_FEATURE_FLAG_ENDPOINT',
    string
  >
>

export function productEnvironmentFromPublicConfig(
  values: PublicProductEnvironment,
): ProductEnvironment {
  const required = (key: keyof PublicProductEnvironment): string => {
    const value = values[key]?.trim()
    if (!value) throw new Error(`${key} is required`)
    return value
  }
  const optional = (key: keyof PublicProductEnvironment): string | undefined =>
    values[key]?.trim() || undefined
  const linkHost = required('EXPO_PUBLIC_LINK_HOST')
  if (!/^[a-z0-9.-]+$/i.test(linkHost) || linkHost.includes('://')) {
    throw new Error('EXPO_PUBLIC_LINK_HOST must be a hostname')
  }
  return {
    apiUrl: required('EXPO_PUBLIC_API_URL'),
    webSocketUrl: optional('EXPO_PUBLIC_WS_ENDPOINT'),
    privacyUrl: required('EXPO_PUBLIC_PRIVACY_URL'),
    termsUrl: required('EXPO_PUBLIC_TERMS_URL'),
    supportUrl: required('EXPO_PUBLIC_SUPPORT_URL'),
    deletionUrl: required('EXPO_PUBLIC_DELETION_URL'),
    associatedDomains: [`applinks:${linkHost}`],
    appleClientId: optional('EXPO_PUBLIC_APPLE_SERVICE_ID'),
    googleClientId: optional('EXPO_PUBLIC_GOOGLE_CLIENT_ID'),
    spotifyClientId: optional('EXPO_PUBLIC_SPOTIFY_CLIENT_ID'),
    audiusClientId: optional('EXPO_PUBLIC_AUDIUS_CLIENT_ID'),
    analyticsEndpoint: optional('EXPO_PUBLIC_ANALYTICS_ENDPOINT'),
    crashEndpoint: optional('EXPO_PUBLIC_CRASH_ENDPOINT'),
    featureFlagEndpoint: optional('EXPO_PUBLIC_FEATURE_FLAG_ENDPOINT'),
  }
}

interface ProductCatalogEntry {
  bundleIdentifier: string
  androidPackage: string
  requiredServices: ProductionService[]
  products: string[]
}

const productCatalog: Record<ProductId, ProductCatalogEntry> = {
  hitshot: {
    bundleIdentifier: 'com.lastshotlabs.hitshot',
    androidPackage: 'com.lastshotlabs.hitshot',
    requiredServices: [
      'api',
      'auth',
      'apple_oauth',
      'google_oauth',
      'spotify',
      'audius',
      'apns',
      'fcm',
      'billing',
      'analytics',
      'crash_reporting',
      'feature_flags',
    ],
    products: ['hitshot.pro.monthly', 'hitshot.pro.yearly'],
  },
  aicoach: {
    bundleIdentifier: 'com.lastshotlabs.aicoach',
    androidPackage: 'com.lastshotlabs.aicoach',
    requiredServices: [
      'api',
      'auth',
      'apple_oauth',
      'google_oauth',
      'apns',
      'fcm',
      'billing',
      'analytics',
      'crash_reporting',
      'feature_flags',
    ],
    products: ['aicoach.pro.monthly', 'aicoach.pro.yearly'],
  },
  sgforum: {
    bundleIdentifier: 'com.lastshotlabs.sgforum',
    androidPackage: 'com.lastshotlabs.sgforum',
    requiredServices: [
      'api',
      'auth',
      'apple_oauth',
      'google_oauth',
      'apns',
      'fcm',
      'billing',
      'analytics',
      'crash_reporting',
      'feature_flags',
    ],
    products: ['sgforum.supporter.monthly'],
  },
  burndown: {
    bundleIdentifier: 'com.lastshotlabs.burndown',
    androidPackage: 'com.lastshotlabs.burndown',
    requiredServices: [
      'api',
      'auth',
      'apple_oauth',
      'google_oauth',
      'apns',
      'fcm',
      'billing',
      'analytics',
      'crash_reporting',
      'feature_flags',
    ],
    products: ['burndown.plus.lifetime'],
  },
  blankslate: {
    bundleIdentifier: 'com.lastshotlabs.blankslate',
    androidPackage: 'com.lastshotlabs.blankslate',
    requiredServices: [
      'api',
      'auth',
      'apple_oauth',
      'google_oauth',
      'apns',
      'fcm',
      'billing',
      'analytics',
      'crash_reporting',
      'feature_flags',
    ],
    products: ['blankslate.plus.lifetime'],
  },
}

export function createProductServiceRegistry(
  product: ProductId,
  version: string,
  build: number,
  environment: ProductEnvironment,
): ProductionServiceRegistry {
  const catalog = productCatalog[product]
  const registry = new ProductionServiceRegistry({
    product,
    version,
    build,
    bundleIdentifier: catalog.bundleIdentifier,
    androidPackage: catalog.androidPackage,
    apiUrl: environment.apiUrl,
    webSocketUrl: environment.webSocketUrl,
    privacyUrl: environment.privacyUrl,
    termsUrl: environment.termsUrl,
    supportUrl: environment.supportUrl,
    deletionUrl: environment.deletionUrl,
    associatedDomains: environment.associatedDomains,
    requiredServices: catalog.requiredServices,
  })
  registry.configure({ service: 'api', enabled: true, endpoint: environment.apiUrl })
  registry.configure({
    service: 'auth',
    enabled: true,
    endpoint: new URL('/auth', environment.apiUrl).toString(),
  })
  registry.configure({
    service: 'apple_oauth',
    enabled: true,
    publicClientId: environment.appleClientId,
  })
  registry.configure({
    service: 'google_oauth',
    enabled: true,
    publicClientId: environment.googleClientId,
  })
  registry.configure({ service: 'apns', enabled: true })
  registry.configure({ service: 'fcm', enabled: true })
  registry.configure({ service: 'billing', enabled: true, products: catalog.products })
  registry.configure({
    service: 'analytics',
    enabled: true,
    endpoint: environment.analyticsEndpoint,
  })
  registry.configure({
    service: 'crash_reporting',
    enabled: true,
    endpoint: environment.crashEndpoint,
  })
  registry.configure({
    service: 'feature_flags',
    enabled: true,
    endpoint: environment.featureFlagEndpoint,
  })
  if (catalog.requiredServices.includes('spotify')) {
    registry.configure({
      service: 'spotify',
      enabled: true,
      publicClientId: environment.spotifyClientId,
    })
  }
  if (catalog.requiredServices.includes('audius')) {
    registry.configure({
      service: 'audius',
      enabled: true,
      publicClientId: environment.audiusClientId,
    })
  }
  return registry
}

function validateManifest(manifest: ProductReleaseManifest): void {
  if (!manifest.version.trim() || !Number.isInteger(manifest.build) || manifest.build < 1) {
    throw new Error('Product version and positive build are required')
  }
  if (!/^com\.[a-z0-9.]+$/.test(manifest.bundleIdentifier)) {
    throw new Error('Invalid iOS bundle identifier')
  }
  if (!/^com\.[a-z0-9.]+$/.test(manifest.androidPackage)) {
    throw new Error('Invalid Android package')
  }
  for (const [name, url] of [
    ['apiUrl', manifest.apiUrl],
    ['privacyUrl', manifest.privacyUrl],
    ['termsUrl', manifest.termsUrl],
    ['supportUrl', manifest.supportUrl],
    ['deletionUrl', manifest.deletionUrl],
  ]) {
    validateSecureUrl(url, name)
  }
  if (new Set(manifest.requiredServices).size !== manifest.requiredServices.length) {
    throw new Error('Required services must be unique')
  }
}

function validateSecureUrl(value: string, name: string): void {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error(`${name} must be a valid URL`)
  }
  if (url.protocol !== 'https:' && url.hostname !== 'localhost') {
    throw new Error(`${name} must use HTTPS`)
  }
}

function validateRollout(percent: number): void {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new Error('Rollout percent must be between 0 and 100')
  }
}

function scrubReleaseText(value: string): string {
  return value
    .trim()
    .replace(/(?:bearer\s+[a-z0-9._~-]+)|(?:[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi, '[REDACTED]')
}
