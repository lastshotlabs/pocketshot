import { describe, expect, it } from 'vitest'
import { FeatureEntitlementGate } from '../../src/billing'

describe('FeatureEntitlementGate', () => {
  it('maps stable features to any-of and all-of store products fail-closed', () => {
    const active = new Set(['ios.pro', 'coach.base', 'coach.ai'])
    const gate = new FeatureEntitlementGate(
      {
        premium: { anyOf: ['ios.pro', 'android.pro'] },
        aiCoach: { allOf: ['coach.base', 'coach.ai'] },
      },
      { canAccess: (productId) => active.has(productId) },
    )

    expect(gate.canAccess('premium')).toBe(true)
    expect(gate.canAccess('aiCoach')).toBe(true)
    active.delete('coach.ai')
    expect(gate.canAccess('aiCoach')).toBe(false)
    expect(gate.inaccessibleProducts('aiCoach')).toEqual(['coach.ai'])
    expect(gate.canAccess('unknown' as 'premium')).toBe(false)
  })

  it('rejects empty and duplicate product mappings', () => {
    expect(
      () => new FeatureEntitlementGate({ premium: {} }, { canAccess: () => false }),
    ).toThrow('requires a feature and product')
    expect(
      () =>
        new FeatureEntitlementGate(
          { premium: { anyOf: ['pro', 'pro'] } },
          { canAccess: () => false },
        ),
    ).toThrow('duplicate or invalid')
  })
})
