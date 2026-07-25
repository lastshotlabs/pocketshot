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

const credentialServices = new Set<ProductionService>([
  'apple_oauth',
  'google_oauth',
  'spotify',
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

  constructor(version: string, channel: ReleaseChannel = 'development') {
    if (!version.trim()) throw new Error('Release version is required')
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
    this.drills.set(name, { passed, at, notes: notes.trim() })
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

  emit(event: LocalServiceEvent): void {
    this.events.push(structuredClone(event))
  }

  snapshot(): LocalServiceEvent[] {
    return structuredClone(this.events)
  }

  clear(): void {
    this.events = []
  }
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
