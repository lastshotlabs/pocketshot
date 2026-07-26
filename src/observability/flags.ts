export interface FeatureFlag {
  key: string
  enabled: boolean
  rolloutPercent: number
  killSwitch: boolean
}

export interface FeatureFlagDocument {
  schemaVersion: 1
  revision: string
  fetchedAt: string
  expiresAt: string
  flags: FeatureFlag[]
}

export interface FeatureFlagStorage {
  load(): Promise<string | null>
  save(value: string): Promise<void>
  clear(): Promise<void>
}

export class FeatureFlagController {
  private flags = new Map<string, FeatureFlag>()

  constructor(private readonly maximumFlags = 250) {
    if (!Number.isInteger(maximumFlags) || maximumFlags < 1) {
      throw new Error('Maximum flags must be a positive integer')
    }
  }

  replace(flags: FeatureFlag[]): void {
    if (flags.length > this.maximumFlags) throw new Error('Feature flag capacity exceeded')
    const next = new Map<string, FeatureFlag>()
    for (const flag of flags) {
      if (!flag.key.trim()) throw new Error('Feature flag key is required')
      if (next.has(flag.key)) throw new Error(`Duplicate feature flag: ${flag.key}`)
      if (flag.rolloutPercent < 0 || flag.rolloutPercent > 100) {
        throw new Error('Rollout percent must be between 0 and 100')
      }
      next.set(flag.key, structuredClone(flag))
    }
    this.flags = next
  }

  isEnabled(key: string, stableSubjectId: string): boolean {
    const flag = this.flags.get(key)
    if (!flag || !flag.enabled || flag.killSwitch || !stableSubjectId.trim()) return false
    return stableBucket(`${key}:${stableSubjectId}`) < flag.rolloutPercent
  }

  snapshot(): FeatureFlag[] {
    return [...this.flags.values()].map((flag) => structuredClone(flag))
  }
}

export class DurableFeatureFlagController {
  private readonly flags: FeatureFlagController
  private document: FeatureFlagDocument | null = null
  private initialized = false
  private operation: Promise<void> = Promise.resolve()

  constructor(
    private readonly storage: FeatureFlagStorage,
    private readonly now: () => number = Date.now,
    maximumFlags = 250,
  ) {
    this.flags = new FeatureFlagController(maximumFlags)
  }

  async initialize(): Promise<void> {
    if (this.initialized) return
    await this.serialize(async () => {
      if (this.initialized) return
      const stored = await this.storage.load()
      if (stored) {
        try {
          this.applyDocument(JSON.parse(stored) as FeatureFlagDocument, false)
        } catch {
          await this.storage.clear()
        }
      }
      this.initialized = true
    })
  }

  async replace(document: FeatureFlagDocument): Promise<void> {
    await this.initialize()
    await this.serialize(async () => {
      this.applyDocument(document, true)
      await this.storage.save(JSON.stringify(this.document))
    })
  }

  isEnabled(key: string, stableSubjectId: string): boolean {
    if (!this.initialized || !this.document || Date.parse(this.document.expiresAt) <= this.now()) {
      return false
    }
    return this.flags.isEnabled(key, stableSubjectId)
  }

  snapshot(): FeatureFlagDocument | null {
    return this.document ? structuredClone(this.document) : null
  }

  async clear(): Promise<void> {
    await this.serialize(async () => {
      this.flags.replace([])
      this.document = null
      this.initialized = true
      await this.storage.clear()
    })
  }

  private applyDocument(document: FeatureFlagDocument, rejectExpired: boolean): void {
    if (
      document.schemaVersion !== 1 ||
      !document.revision?.trim() ||
      !Number.isFinite(Date.parse(document.fetchedAt)) ||
      !Number.isFinite(Date.parse(document.expiresAt)) ||
      Date.parse(document.expiresAt) <= Date.parse(document.fetchedAt)
    ) {
      throw new Error('Feature flag document is invalid')
    }
    if (rejectExpired && Date.parse(document.expiresAt) <= this.now()) {
      throw new Error('Feature flag document is expired')
    }
    this.flags.replace(document.flags)
    this.document = structuredClone(document)
  }

  private async serialize(task: () => Promise<void>): Promise<void> {
    const next = this.operation.then(task, task)
    this.operation = next.catch(() => undefined)
    await next
  }
}

export class MemoryFeatureFlagStorage implements FeatureFlagStorage {
  private value: string | null = null
  async load(): Promise<string | null> {
    return this.value
  }
  async save(value: string): Promise<void> {
    this.value = value
  }
  async clear(): Promise<void> {
    this.value = null
  }
}

function stableBucket(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) % 100
}
