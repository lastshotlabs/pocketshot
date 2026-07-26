import type { PairingAdapter, PairingToken, PublicSecondScreenEnvelope } from './types'

export class PairingController {
  private tokenValue: PairingToken | null = null
  private operation: Promise<unknown> = Promise.resolve()

  constructor(
    private readonly adapter: PairingAdapter,
    private readonly now: () => Date = () => new Date(),
  ) {}

  get token(): PairingToken | null {
    return this.tokenValue ? { ...this.tokenValue } : null
  }

  async create(sessionId: string, role: 'controller' | 'display'): Promise<PairingToken> {
    if (!sessionId.trim()) throw new Error('[pocketshot] Pairing session is required')
    return this.serialize(async () => {
      const token = await this.adapter.create({ sessionId: sessionId.trim(), role })
      this.validate(token)
      this.tokenValue = structuredClone(token)
      return this.current()
    })
  }

  async refresh(): Promise<PairingToken> {
    return this.serialize(async () => {
      if (!this.tokenValue) throw new Error('[pocketshot] No pairing token')
      const id = this.tokenValue.id
      const token = await this.adapter.get(id)
      this.validate(token)
      if (token.id !== id) throw new Error('[pocketshot] Pairing token identity changed')
      this.tokenValue = structuredClone(token)
      this.reconcileExpiry()
      return this.current()
    })
  }

  async revoke(): Promise<void> {
    await this.serialize(async () => {
      if (!this.tokenValue || this.tokenValue.status === 'revoked') return
      const id = this.tokenValue.id
      try {
        await this.adapter.revoke(id)
      } finally {
        if (this.tokenValue?.id === id) {
          this.tokenValue = { ...this.tokenValue, code: '', qrPayload: '', status: 'revoked' }
        }
      }
    })
  }

  private current(): PairingToken {
    if (!this.tokenValue) throw new Error('[pocketshot] No pairing token')
    this.reconcileExpiry()
    return structuredClone(this.tokenValue)
  }

  private reconcileExpiry(): void {
    if (
      this.tokenValue?.status === 'pending' &&
      Date.parse(this.tokenValue.expiresAt) <= this.now().getTime()
    ) {
      this.tokenValue.status = 'expired'
    }
  }

  private validate(token: PairingToken): void {
    if (
      !token.id.trim() ||
      !token.code.trim() ||
      token.code.length > 64 ||
      !token.qrPayload.trim() ||
      token.qrPayload.length > 2_048 ||
      !Number.isFinite(Date.parse(token.expiresAt)) ||
      !['pending', 'claimed', 'expired', 'revoked'].includes(token.status)
    ) {
      throw new Error('[pocketshot] Pairing token is invalid')
    }
    if (token.status === 'claimed' && !token.claimedDeviceId?.trim()) {
      throw new Error('[pocketshot] Claimed pairing token requires a device')
    }
  }

  private serialize<T>(task: () => Promise<T>): Promise<T> {
    const next = this.operation.then(task, task)
    this.operation = next.catch(() => undefined)
    return next
  }
}

/**
 * Produces an explicit display-only envelope. The caller must provide the
 * projection, preventing private controller/player state from crossing the boundary.
 */
export class SecondScreenProjector<TPrivate, TPublic> {
  private sequence = 0

  constructor(
    private readonly sessionId: string,
    private readonly project: (state: TPrivate) => TPublic,
  ) {
    if (!sessionId.trim()) throw new Error('[pocketshot] Second-screen session is required')
  }

  next(state: TPrivate): PublicSecondScreenEnvelope<TPublic> {
    if (this.sequence >= Number.MAX_SAFE_INTEGER) {
      throw new Error('[pocketshot] Second-screen sequence exhausted')
    }
    this.sequence += 1
    const projected = structuredClone(this.project(structuredClone(state)))
    JSON.stringify(projected)
    return {
      schemaVersion: 1,
      sessionId: this.sessionId,
      sequence: this.sequence,
      state: projected,
    }
  }
}
