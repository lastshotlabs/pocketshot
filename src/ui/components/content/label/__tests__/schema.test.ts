import { describe, it, expect } from 'vitest'
import { LabelSchema } from '../schema'

describe('LabelSchema', () => {
  it('parses with string text', () => {
    const result = LabelSchema.parse({ text: 'Category' })
    expect(result.text).toBe('Category')
  })

  it('parses with from-ref text', () => {
    const result = LabelSchema.parse({ text: { from: 'category' } })
    expect(result.text).toEqual({ from: 'category' })
  })

  it('requires text', () => {
    expect(LabelSchema.safeParse({}).success).toBe(false)
  })

  it('applies defaults', () => {
    const result = LabelSchema.parse({ text: 'X' })
    expect(result.variant).toBe('default')
    expect(result.size).toBe('sm')
    expect(result.uppercase).toBe(false)
  })

  it('accepts all valid variants', () => {
    for (const variant of ['default', 'muted', 'error', 'success'] as const) {
      expect(LabelSchema.safeParse({ text: 'X', variant }).success).toBe(true)
    }
  })

  it('rejects invalid variant', () => {
    expect(LabelSchema.safeParse({ text: 'X', variant: 'warning' }).success).toBe(false)
  })

  it('accepts all valid sizes', () => {
    for (const size of ['xs', 'sm', 'md'] as const) {
      expect(LabelSchema.safeParse({ text: 'X', size }).success).toBe(true)
    }
  })

  it('rejects invalid size', () => {
    expect(LabelSchema.safeParse({ text: 'X', size: 'lg' }).success).toBe(false)
  })
})
