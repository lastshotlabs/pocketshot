import { describe, it, expect } from 'vitest'
import { CartItemSchema } from '../schema'

describe('CartItemSchema', () => {
  it('parses with string title and numeric price', () => {
    const result = CartItemSchema.parse({ title: 'Widget', price: 9.99 })
    expect(result.title).toBe('Widget')
    expect(result.price).toBe(9.99)
  })

  it('parses with from-ref title and price', () => {
    const result = CartItemSchema.parse({ title: { from: 'item' }, price: { from: 'item' } })
    expect(result.title).toEqual({ from: 'item' })
    expect(result.price).toEqual({ from: 'item' })
  })

  it('requires title', () => {
    expect(CartItemSchema.safeParse({ price: 10 }).success).toBe(false)
  })

  it('requires price', () => {
    expect(CartItemSchema.safeParse({ title: 'X' }).success).toBe(false)
  })

  it('applies defaults', () => {
    const result = CartItemSchema.parse({ title: 'X', price: 10 })
    expect(result.quantity).toBe(1)
    expect(result.currency).toBe('USD')
  })

  it('accepts from-ref quantity', () => {
    const result = CartItemSchema.parse({ title: 'X', price: 10, quantity: { from: 'cart' } })
    expect(result.quantity).toEqual({ from: 'cart' })
  })

  it('rejects negative quantity', () => {
    expect(CartItemSchema.safeParse({ title: 'X', price: 10, quantity: -1 }).success).toBe(false)
  })

  it('rejects non-integer quantity', () => {
    expect(CartItemSchema.safeParse({ title: 'X', price: 10, quantity: 1.5 }).success).toBe(false)
  })

  it('accepts from-ref image and variant', () => {
    const result = CartItemSchema.parse({
      title: 'X',
      price: 10,
      image: { from: 'item' },
      variant: { from: 'item' },
    })
    expect(result.image).toEqual({ from: 'item' })
  })

  it('accepts onQuantityChange and onRemove actions', () => {
    const action = { type: 'api' as const, endpoint: '/cart/update', method: 'PATCH' as const }
    const result = CartItemSchema.parse({ title: 'X', price: 10, onQuantityChange: action, onRemove: action })
    expect(result.onQuantityChange).toBeDefined()
    expect(result.onRemove).toBeDefined()
  })
})
