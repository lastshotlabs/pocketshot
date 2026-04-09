import { describe, it, expect } from 'vitest'
import { BadgeSchema } from '../schema'

describe('BadgeSchema', () => {
  it('parses with string label', () => {
    const result = BadgeSchema.parse({ label: 'New' })
    expect(result.label).toBe('New')
  })

  it('parses with from-ref label', () => {
    const result = BadgeSchema.parse({ label: { from: 'status' } })
    expect(result.label).toEqual({ from: 'status' })
  })

  it('requires label', () => {
    expect(BadgeSchema.safeParse({}).success).toBe(false)
  })

  it('applies defaults', () => {
    const result = BadgeSchema.parse({ label: 'X' })
    expect(result.variant).toBe('default')
    expect(result.size).toBe('md')
  })

  it('accepts all valid variants', () => {
    const variants = ['default', 'primary', 'success', 'warning', 'error', 'info'] as const
    for (const variant of variants) {
      expect(BadgeSchema.safeParse({ label: 'X', variant }).success).toBe(true)
    }
  })

  it('rejects invalid variant', () => {
    expect(BadgeSchema.safeParse({ label: 'X', variant: 'danger' }).success).toBe(false)
  })

  it('accepts all valid sizes', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      expect(BadgeSchema.safeParse({ label: 'X', size }).success).toBe(true)
    }
  })

  it('rejects invalid size', () => {
    expect(BadgeSchema.safeParse({ label: 'X', size: 'xl' }).success).toBe(false)
  })
})
