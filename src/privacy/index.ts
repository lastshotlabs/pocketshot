export type ExportStatus = 'idle' | 'requested' | 'processing' | 'ready' | 'failed'
export type DeletionStatus =
  | 'idle'
  | 'requested'
  | 'scheduled'
  | 'processing'
  | 'completed'
  | 'cleanup-required'
  | 'cancelled'
  | 'failed'

export interface AccountDataTransport {
  requestExport(): Promise<{ requestId: string }>
  getExport(requestId: string): Promise<{
    status: Exclude<ExportStatus, 'idle'>
    downloadUrl?: string
  }>
  requestDeletion(): Promise<{ requestId: string; scheduledAt: string }>
  cancelDeletion(requestId: string): Promise<void>
  getDeletion(requestId: string): Promise<{
    status: Exclude<DeletionStatus, 'idle' | 'requested' | 'cleanup-required'>
  }>
  revokeAuthorization(): Promise<void>
}

export interface LocalDataStore {
  name: string
  clear(): void | Promise<void>
}

export interface AccountDataSnapshot {
  exportStatus: ExportStatus
  exportRequestId: string | null
  exportDownloadUrl: string | null
  deletionStatus: DeletionStatus
  deletionRequestId: string | null
  deletionScheduledAt: string | null
  authorizationRevoked: boolean
  clearedStores: string[]
  cleanupFailures: string[]
  error: string | null
}

export interface AccountDataControllerOptions {
  sanitizeError?: (error: unknown) => string
}

export class AccountDataController {
  private state: AccountDataSnapshot = {
    exportStatus: 'idle',
    exportRequestId: null,
    exportDownloadUrl: null,
    deletionStatus: 'idle',
    deletionRequestId: null,
    deletionScheduledAt: null,
    authorizationRevoked: false,
    clearedStores: [],
    cleanupFailures: [],
    error: null,
  }
  private operationChain: Promise<void> = Promise.resolve()
  private cleanupPromise: Promise<void> | null = null

  constructor(
    private readonly transport: AccountDataTransport,
    private readonly stores: LocalDataStore[],
    private readonly options: AccountDataControllerOptions = {},
  ) {
    const names = stores.map((store) => store.name.trim())
    if (names.some((name) => !name) || new Set(names).size !== names.length) {
      throw new Error('Local data stores require unique names')
    }
  }

  get snapshot(): AccountDataSnapshot {
    return structuredClone(this.state)
  }

  async requestExport(): Promise<void> {
    await this.run(async () => {
      if (this.state.exportStatus === 'requested' || this.state.exportStatus === 'processing')
        return
      const request = await this.transport.requestExport()
      if (!request.requestId) throw new Error('Export request did not return an ID')
      this.state.exportRequestId = request.requestId
      this.state.exportStatus = 'requested'
      this.state.exportDownloadUrl = null
    }, 'export')
  }

  async refreshExport(): Promise<void> {
    if (!this.state.exportRequestId) throw new Error('No export request is active')
    await this.run(async () => {
      const result = await this.transport.getExport(this.state.exportRequestId!)
      if (result.status === 'ready') validateDownloadUrl(result.downloadUrl)
      this.state.exportStatus = result.status
      this.state.exportDownloadUrl =
        result.status === 'ready' && result.downloadUrl ? result.downloadUrl : null
    }, 'export')
  }

  async requestDeletion(): Promise<void> {
    await this.run(async () => {
      if (
        this.state.deletionStatus === 'scheduled' ||
        this.state.deletionStatus === 'processing' ||
        this.state.deletionStatus === 'completed'
      ) {
        return
      }
      const request = await this.transport.requestDeletion()
      if (!request.requestId || !Number.isFinite(Date.parse(request.scheduledAt))) {
        throw new Error('Deletion request response is invalid')
      }
      this.state.deletionRequestId = request.requestId
      this.state.deletionScheduledAt = request.scheduledAt
      this.state.deletionStatus = 'scheduled'
    }, 'deletion')
  }

  async cancelDeletion(): Promise<void> {
    if (!this.state.deletionRequestId || this.state.deletionStatus !== 'scheduled') return
    await this.run(async () => {
      await this.transport.cancelDeletion(this.state.deletionRequestId!)
      this.state.deletionStatus = 'cancelled'
      this.state.deletionScheduledAt = null
    }, 'deletion')
  }

  async refreshDeletion(): Promise<void> {
    if (!this.state.deletionRequestId) throw new Error('No deletion request is active')
    await this.run(async () => {
      const result = await this.transport.getDeletion(this.state.deletionRequestId!)
      this.state.deletionStatus = result.status
      if (result.status === 'completed') await this.completeLocalCleanup()
    }, 'deletion')
  }

  async completeLocalCleanup(): Promise<void> {
    this.cleanupPromise ??= this.performLocalCleanup().finally(() => {
      this.cleanupPromise = null
    })
    return this.cleanupPromise
  }

  private async performLocalCleanup(): Promise<void> {
    this.state.cleanupFailures = []
    const operations: Array<{
      name: string
      run: () => Promise<void>
      complete: () => void
    }> = []
    if (!this.state.authorizationRevoked) {
      operations.push({
        name: 'authorization',
        run: () => this.transport.revokeAuthorization(),
        complete: () => {
          this.state.authorizationRevoked = true
        },
      })
    }
    for (const store of this.stores) {
      if (this.state.clearedStores.includes(store.name)) continue
      operations.push({
        name: store.name,
        run: () => Promise.resolve(store.clear()),
        complete: () => {
          this.state.clearedStores.push(store.name)
        },
      })
    }
    const results = await Promise.allSettled(operations.map((operation) => operation.run()))
    results.forEach((result, index) => {
      const operation = operations[index]!
      if (result.status === 'fulfilled') operation.complete()
      else this.state.cleanupFailures.push(operation.name)
    })
    this.state.clearedStores.sort()
    if (this.state.cleanupFailures.length > 0) {
      this.state.deletionStatus = 'cleanup-required'
      this.state.error = 'Account cleanup requires retry'
      throw new Error('Account cleanup requires retry')
    }
    this.state.deletionStatus = 'completed'
    this.state.error = null
  }

  private async run(operation: () => Promise<void>, area: 'export' | 'deletion'): Promise<void> {
    const run = this.operationChain.then(async () => {
      this.state.error = null
      try {
        await operation()
      } catch (error) {
        this.state.error = this.safeError(error)
        if (area === 'export') this.state.exportStatus = 'failed'
        else if (this.state.deletionStatus !== 'cleanup-required')
          this.state.deletionStatus = 'failed'
        throw error
      }
    })
    this.operationChain = run.catch(() => undefined)
    return run
  }

  private safeError(error: unknown): string {
    const value = (
      this.options.sanitizeError?.(error) ??
      (error instanceof Error ? error.name : 'Account data operation failed')
    )
      .replace(/\s+/g, ' ')
      .trim()
    return (value || 'Account data operation failed').slice(0, 160)
  }
}

export class RelationshipPrivacyController {
  private blocked = new Set<string>()
  private muted = new Set<string>()

  get snapshot(): { blocked: string[]; muted: string[] } {
    return { blocked: [...this.blocked].sort(), muted: [...this.muted].sort() }
  }

  block(userId: string): void {
    requireUserId(userId)
    this.blocked.add(userId)
    this.muted.add(userId)
  }

  unblock(userId: string): void {
    this.blocked.delete(userId)
  }

  mute(userId: string): void {
    requireUserId(userId)
    this.muted.add(userId)
  }

  unmute(userId: string): void {
    this.muted.delete(userId)
  }

  canInteract(userId: string): boolean {
    return !this.blocked.has(userId)
  }

  shouldNotify(userId: string): boolean {
    return !this.blocked.has(userId) && !this.muted.has(userId)
  }

  restore(snapshot: { blocked: string[]; muted: string[] }): void {
    this.blocked.clear()
    this.muted.clear()
    for (const userId of snapshot.muted) this.mute(userId)
    for (const userId of snapshot.blocked) this.block(userId)
  }

  clear(): void {
    this.blocked.clear()
    this.muted.clear()
  }
}

function requireUserId(userId: string): void {
  if (!userId.trim()) throw new Error('User ID is required')
}

function validateDownloadUrl(value: string | undefined): void {
  if (!value) throw new Error('Ready export did not return a download URL')
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('Export download URL is invalid')
  }
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('Export download URL must use credential-free HTTPS')
  }
}
