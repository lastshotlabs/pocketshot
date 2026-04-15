import { describe, it, expect } from 'vitest'
import { LinkSchema } from '../schema'

const action = { type: 'navigate' as const, to: '/about' }

describe('LinkSchema', () => {
  it('parses with string text', () => {
    const result = LinkSchema.parse({ text: 'Learn more', action })
    expect(result.text).toBe('Learn more')
  })

  it('parses with from-ref text', () => {
    const result = LinkSchema.parse({ text: { from: 'linkText' }, action })
    expect(result.text).toEqual({ from: 'linkText' })
  })

  it('requires text', () => {
    expect(LinkSchema.safeParse({ action }).success).toBe(false)
  })

  it('parses without action (z.custom is runtime-transparent)', () => {
    // z.custom<Action>() has no runtime validator — TypeScript-only constraint
    expect(LinkSchema.safeParse({ text: 'X' }).success).toBe(true)
  })

  it('applies defaults', () => {
    const result = LinkSchema.parse({ text: 'X', action })
    expect(result.size).toBe('md')
    expect(result.underline).toBe(true)
  })

  it('accepts all valid sizes', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      expect(LinkSchema.safeParse({ text: 'X', action, size }).success).toBe(true)
    }
  })

  it('rejects invalid size', () => {
    expect(LinkSchema.safeParse({ text: 'X', action, size: 'xl' }).success).toBe(false)
  })

  it('accepts underline false', () => {
    const result = LinkSchema.parse({ text: 'X', action, underline: false })
    expect(result.underline).toBe(false)
  })
})
