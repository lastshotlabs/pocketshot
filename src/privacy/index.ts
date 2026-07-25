export type ExportStatus = 'idle' | 'requested' | 'processing' | 'ready' | 'failed'
export type DeletionStatus =
  | 'idle'
  | 'requested'
  | 'scheduled'
  | 'processing'
  | 'completed'
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
    status: Exclude<DeletionStatus, 'idle' | 'requested'>
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
  error: string | null
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
    error: null,
  }

  constructor(
    private readonly transport: AccountDataTransport,
    private readonly stores: LocalDataStore[],
  ) {}

  get snapshot(): AccountDataSnapshot {
    return structuredClone(this.state)
  }

  async requestExport(): Promise<void> {
    if (this.state.exportStatus === 'requested' || this.state.exportStatus === 'processing') return
    await this.run(async () => {
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
      this.state.exportStatus = result.status
      this.state.exportDownloadUrl =
        result.status === 'ready' && result.downloadUrl ? result.downloadUrl : null
    }, 'export')
  }

  async requestDeletion(): Promise<void> {
    if (
      this.state.deletionStatus === 'scheduled' ||
      this.state.deletionStatus === 'processing' ||
      this.state.deletionStatus === 'completed'
    ) {
      return
    }
    await this.run(async () => {
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

  private async completeLocalCleanup(): Promise<void> {
    await this.transport.revokeAuthorization()
    this.state.authorizationRevoked = true
    for (const store of this.stores) {
      await store.clear()
      this.state.clearedStores.push(store.name)
    }
  }

  private async run(operation: () => Promise<void>, area: 'export' | 'deletion'): Promise<void> {
    this.state.error = null
    try {
      await operation()
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : String(error)
      if (area === 'export') this.state.exportStatus = 'failed'
      else this.state.deletionStatus = 'failed'
      throw error
    }
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
}

function requireUserId(userId: string): void {
  if (!userId.trim()) throw new Error('User ID is required')
}
