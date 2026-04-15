import { describe, it, expect } from 'vitest'
import { ProductCardSchema } from '../schema'

describe('ProductCardSchema', () => {
  it('parses with string title', () => {
    const result = ProductCardSchema.parse({ title: 'Running Shoes' })
    expect(result.title).toBe('Running Shoes')
  })

  it('parses with from-ref title', () => {
    const result = ProductCardSchema.parse({ title: { from: 'product' } })
    expect(result.title).toEqual({ from: 'product' })
  })

  it('requires title', () => {
    expect(ProductCardSchema.safeParse({}).success).toBe(false)
  })

  it('applies default currency', () => {
    const result = ProductCardSchema.parse({ title: 'X' })
    expect(result.currency).toBe('USD')
  })

  it('accepts all from-ref fields', () => {
    const result = ProductCardSchema.parse({
      title: { from: 'p' },
      image: { from: 'p' },
      description: { from: 'p' },
      price: { from: 'p' },
      rating: { from: 'p' },
      reviewCount: { from: 'p' },
    })
    expect(result.image).toEqual({ from: 'p' })
    expect(result.rating).toEqual({ from: 'p' })
  })

  it('rejects rating above 5', () => {
    expect(ProductCardSchema.safeParse({ title: 'X', rating: 6 }).success).toBe(false)
  })

  it('rejects rating below 0', () => {
    expect(ProductCardSchema.safeParse({ title: 'X', rating: -1 }).success).toBe(false)
  })

  it('rejects negative reviewCount', () => {
    expect(ProductCardSchema.safeParse({ title: 'X', reviewCount: -1 }).success).toBe(false)
  })

  it('rejects non-integer reviewCount', () => {
    expect(ProductCardSchema.safeParse({ title: 'X', reviewCount: 4.5 }).success).toBe(false)
  })

  it('accepts onPress and onAddToCart actions', () => {
    const action = { type: 'navigate' as const, to: '/product' }
    const result = ProductCardSchema.parse({ title: 'X', onPress: action, onAddToCart: action })
    expect(result.onPress).toBeDefined()
    expect(result.onAddToCart).toBeDefined()
  })

  it('accepts badge', () => {
    const result = ProductCardSchema.parse({ title: 'X', badge: 'New Arrival' })
    expect(result.badge).toBe('New Arrival')
  })
})
