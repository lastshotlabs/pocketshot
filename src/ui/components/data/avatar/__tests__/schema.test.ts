import { describe, it, expect } from 'vitest'
import { AvatarSchema } from '../schema'

describe('AvatarSchema', () => {
  it('parses a minimal valid config', () => {
    expect(AvatarSchema.safeParse({}).success).toBe(true)
  })

  it('applies defaults', () => {
    const result = AvatarSchema.parse({})
    expect(result.size).toBe('md')
    expect(result.shape).toBe('circle')
  })

  it('parses with string src', () => {
    const result = AvatarSchema.parse({ src: 'https://example.com/avatar.png' })
    expect(result.src).toBe('https://example.com/avatar.png')
  })

  it('parses with from-ref src', () => {
    const result = AvatarSchema.parse({ src: { from: 'user' } })
    expect(result.src).toEqual({ from: 'user' })
  })

  it('parses with from-ref name', () => {
    const result = AvatarSchema.parse({ name: { from: 'user' } })
    expect(result.name).toEqual({ from: 'user' })
  })

  it('accepts all valid sizes', () => {
    for (const size of ['xs', 'sm', 'md', 'lg', 'xl'] as const) {
      expect(AvatarSchema.safeParse({ size }).success).toBe(true)
    }
  })

  it('rejects invalid size', () => {
    expect(AvatarSchema.safeParse({ size: 'xxl' }).success).toBe(false)
  })

  it('accepts all valid shapes', () => {
    for (const shape of ['circle', 'rounded', 'square'] as const) {
      expect(AvatarSchema.safeParse({ shape }).success).toBe(true)
    }
  })

  it('rejects invalid shape', () => {
    expect(AvatarSchema.safeParse({ shape: 'hexagon' }).success).toBe(false)
  })

  it('accepts named slot surfaces', () => {
    expect(
      AvatarSchema.safeParse({
        name: 'Jane Doe',
        slots: {
          initials: {
            letterSpacing: 'wide',
          },
        },
      }).success,
    ).toBe(true)
  })
})
