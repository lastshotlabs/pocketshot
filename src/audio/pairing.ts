import type { PairingAdapter, PairingToken, PublicSecondScreenEnvelope } from './types'

export class PairingController {
  private tokenValue: PairingToken | null = null

  constructor(
    private readonly adapter: PairingAdapter,
    private readonly now: () => Date = () => new Date(),
  ) {}

  get token(): PairingToken | null {
    return this.tokenValue ? { ...this.tokenValue } : null
  }

  async create(sessionId: string, role: 'controller' | 'display'): Promise<PairingToken> {
    this.tokenValue = await this.adapter.create({ sessionId, role })
    return this.current()
  }

  async refresh(): Promise<PairingToken> {
    if (!this.tokenValue) throw new Error('[pocketshot] No pairing token')
    this.tokenValue = await this.adapter.get(this.tokenValue.id)
    if (
      this.tokenValue.status === 'pending' &&
      new Date(this.tokenValue.expiresAt).getTime() <= this.now().getTime()
    ) {
      this.tokenValue.status = 'expired'
    }
    return this.current()
  }

  async revoke(): Promise<void> {
    if (!this.tokenValue) return
    await this.adapter.revoke(this.tokenValue.id)
    this.tokenValue = { ...this.tokenValue, status: 'revoked' }
  }

  private current(): PairingToken {
    if (!this.tokenValue) throw new Error('[pocketshot] No pairing token')
    return { ...this.tokenValue }
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
  ) {}

  next(state: TPrivate): PublicSecondScreenEnvelope<TPublic> {
    this.sequence += 1
    return {
      schemaVersion: 1,
      sessionId: this.sessionId,
      sequence: this.sequence,
      state: this.project(state),
    }
  }
}
