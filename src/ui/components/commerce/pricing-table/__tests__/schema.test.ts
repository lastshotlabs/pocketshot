import { describe, expect, it } from 'vitest'
import { PricingTableSchema } from '../schema'

describe('PricingTableSchema', () => {
  const checkoutAction = {
    type: 'navigate',
    to: '/checkout',
  } as unknown as import('../../../../actions/types').Action
  const TIER = {
    id: 'pro',
    name: 'Pro',
    price: '$12',
    period: '/month',
    description: 'For teams',
    features: ['Unlimited projects'],
    cta: { label: 'Choose Pro', onPress: checkoutAction },
  }

  it('parses a minimal valid config', () => {
    const result = PricingTableSchema.parse({ tiers: [TIER] })
    expect(result.tiers).toHaveLength(1)
  })

  it('applies defaults', () => {
    const result = PricingTableSchema.parse({ tiers: [TIER] })
    expect(result.highlightedLabel).toBe('Most Popular')
  })

  it('accepts slot styling surfaces', () => {
    const result = PricingTableSchema.parse({
      tiers: [TIER],
      slots: {
        card: { borderRadius: 'xl' },
        title: { letterSpacing: 'wide' },
        ctaButton: { borderRadius: 'lg' },
      },
    })

    expect(result.slots?.card?.borderRadius).toBe('xl')
    expect(result.slots?.title?.letterSpacing).toBe('wide')
    expect(result.slots?.ctaButton?.borderRadius).toBe('lg')
  })
})
