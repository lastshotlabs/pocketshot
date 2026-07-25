export {
  EntitlementController,
  type BillingAdapter,
  type EntitlementState,
  type EntitlementVerifier,
  type StoreEntitlement,
} from '../coach/controllers'

import type { BillingAdapter, StoreEntitlement } from '../coach/controllers'

export class LocalBillingAdapter implements BillingAdapter {
  private entitlements = new Map<string, StoreEntitlement>()
  private sequence = 0

  constructor(private readonly now: () => Date = () => new Date()) {}

  async purchase(productId: string): Promise<StoreEntitlement> {
    if (!productId.trim()) throw new Error('Product ID is required')
    const entitlement: StoreEntitlement = {
      productId,
      state: 'active',
      expiresAt: null,
      transactionId: `local-${++this.sequence}`,
      verificationToken: `local-verification-${this.sequence}`,
    }
    this.entitlements.set(productId, entitlement)
    return structuredClone(entitlement)
  }

  async restore(): Promise<StoreEntitlement[]> {
    return this.snapshot()
  }

  async refresh(): Promise<StoreEntitlement[]> {
    const now = this.now().getTime()
    for (const entitlement of this.entitlements.values()) {
      if (
        entitlement.expiresAt &&
        Number.isFinite(Date.parse(entitlement.expiresAt)) &&
        Date.parse(entitlement.expiresAt) <= now &&
        entitlement.state !== 'revoked'
      ) {
        entitlement.state = 'expired'
      }
    }
    return this.snapshot()
  }

  setState(
    productId: string,
    state: StoreEntitlement['state'],
    expiresAt: string | null = null,
  ): void {
    const existing = this.entitlements.get(productId)
    this.entitlements.set(productId, {
      productId,
      state,
      expiresAt,
      transactionId: existing?.transactionId ?? `local-${++this.sequence}`,
      verificationToken: existing?.verificationToken ?? `local-verification-${this.sequence}`,
    })
  }

  cancel(productId: string, accessUntil: string): void {
    if (!Number.isFinite(Date.parse(accessUntil))) throw new Error('Cancellation date is invalid')
    this.setState(productId, 'active', accessUntil)
  }

  revoke(productId: string): void {
    this.setState(productId, 'revoked')
  }

  enterGrace(productId: string, expiresAt: string): void {
    if (!Number.isFinite(Date.parse(expiresAt))) throw new Error('Grace expiry is invalid')
    this.setState(productId, 'grace', expiresAt)
  }

  private snapshot(): StoreEntitlement[] {
    return [...this.entitlements.values()].map((entitlement) => structuredClone(entitlement))
  }
}
