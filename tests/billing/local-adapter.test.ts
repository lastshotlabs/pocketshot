import { describe, expect, it } from 'vitest'
import {
  createMemoryEntitlementStorage,
  EntitlementController,
  LocalBillingAdapter,
} from '../../src/billing'

describe('credential-free billing certification', () => {
  it('purchases and restores verified local entitlements', async () => {
    const store = new LocalBillingAdapter()
    const billing = new EntitlementController(store, {
      verify: async ({ verificationToken: _token, ...entitlement }) => entitlement,
    })
    await billing.purchase('product.pro')
    expect(billing.canAccess('product.pro')).toBe(true)
    await billing.restore()
    expect(billing.snapshot.entitlements[0].verificationToken).toBeUndefined()
  })

  it('models grace, cancellation expiry, revocation, and refresh', async () => {
    let now = new Date('2026-07-25T00:00:00Z')
    const store = new LocalBillingAdapter(() => now)
    const billing = new EntitlementController(store, undefined, { now: () => now })
    store.enterGrace('product.pro', '2026-07-26T00:00:00Z')
    await billing.restore()
    expect(billing.canAccess('product.pro')).toBe(true)
    store.cancel('product.pro', '2026-07-27T00:00:00Z')
    await billing.refresh()
    expect(billing.canAccess('product.pro')).toBe(true)
    now = new Date('2026-07-28T00:00:00Z')
    await billing.refresh()
    expect(billing.canAccess('product.pro')).toBe(false)
    store.revoke('product.pro')
    await billing.refresh()
    expect(billing.snapshot.entitlements[0].state).toBe('revoked')
  })

  it('restores only fresh account-scoped token-free cache after process death', async () => {
    let now = new Date('2026-07-25T00:00:00Z')
    const storage = createMemoryEntitlementStorage()
    const store = new LocalBillingAdapter(() => now)
    const first = new EntitlementController(store, undefined, {
      now: () => now,
      storage,
      accountId: 'account-1',
      cacheMaxAgeMs: 1_000,
    })
    await first.purchase('product.pro')

    const restarted = new EntitlementController(store, undefined, {
      now: () => now,
      storage,
      accountId: 'account-1',
      cacheMaxAgeMs: 1_000,
    })
    await restarted.initialize()
    expect(restarted.canAccess('product.pro')).toBe(true)
    expect(JSON.stringify(restarted.snapshot)).not.toContain('local-verification')

    now = new Date('2026-07-25T00:00:01Z')
    expect(restarted.canAccess('product.pro')).toBe(false)

    const otherAccount = new EntitlementController(store, undefined, {
      now: () => now,
      storage,
      accountId: 'account-2',
    })
    await otherAccount.initialize()
    expect(otherAccount.snapshot.entitlements).toEqual([])
  })
})
