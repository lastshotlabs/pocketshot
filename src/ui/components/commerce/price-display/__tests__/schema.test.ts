import { describe, it, expect } from 'vitest'
import { PriceDisplaySchema } from '../schema'

describe('PriceDisplaySchema', () => {
  it('parses with numeric amount', () => {
    const result = PriceDisplaySchema.parse({ amount: 29.99 })
    expect(result.amount).toBe(29.99)
  })

  it('parses with string amount', () => {
    const result = PriceDisplaySchema.parse({ amount: '29.99' })
    expect(result.amount).toBe('29.99')
  })

  it('parses with from-ref amount', () => {
    const result = PriceDisplaySchema.parse({ amount: { from: 'product' } })
    expect(result.amount).toEqual({ from: 'product' })
  })

  it('requires amount', () => {
    expect(PriceDisplaySchema.safeParse({}).success).toBe(false)
  })

  it('applies defaults', () => {
    const result = PriceDisplaySchema.parse({ amount: 10 })
    expect(result.currency).toBe('USD')
    expect(result.locale).toBe('en-US')
    expect(result.size).toBe('md')
  })

  it('accepts all valid sizes', () => {
    for (const size of ['sm', 'md', 'lg', 'xl'] as const) {
      expect(PriceDisplaySchema.safeParse({ amount: 10, size }).success).toBe(true)
    }
  })

  it('rejects invalid size', () => {
    expect(PriceDisplaySchema.safeParse({ amount: 10, size: 'xxl' }).success).toBe(false)
  })

  it('accepts originalAmount for strikethrough', () => {
    const result = PriceDisplaySchema.parse({ amount: 19.99, originalAmount: 29.99 })
    expect(result.originalAmount).toBe(29.99)
  })

  it('accepts from-ref originalAmount', () => {
    const result = PriceDisplaySchema.parse({ amount: 10, originalAmount: { from: 'product' } })
    expect(result.originalAmount).toEqual({ from: 'product' })
  })

  it('accepts badge', () => {
    const result = PriceDisplaySchema.parse({ amount: 10, badge: '30% OFF' })
    expect(result.badge).toBe('30% OFF')
  })

  it('accepts custom currency and locale', () => {
    const result = PriceDisplaySchema.parse({ amount: 10, currency: 'EUR', locale: 'de-DE' })
    expect(result.currency).toBe('EUR')
    expect(result.locale).toBe('de-DE')
  })

  it('accepts slot styling surfaces', () => {
    const result = PriceDisplaySchema.parse({
      amount: 10,
      slots: {
        price: { color: 'primary' },
        badge: { borderRadius: 'md' },
      },
    })

    expect(result.slots?.price?.color).toBe('primary')
    expect(result.slots?.badge?.borderRadius).toBe('md')
  })
})
