import { describe, it, expect } from 'vitest'
import { AvatarGroupSchema } from '../schema'

describe('AvatarGroupSchema', () => {
  it('parses with array of avatars', () => {
    const result = AvatarGroupSchema.parse({
      avatars: [{ src: 'https://example.com/a.png', name: 'Alice' }],
    })
    expect(result.avatars).toHaveLength(1)
  })

  it('parses with from-ref avatars', () => {
    const result = AvatarGroupSchema.parse({ avatars: { from: 'members' } })
    expect(result.avatars).toEqual({ from: 'members' })
  })

  it('requires avatars', () => {
    expect(AvatarGroupSchema.safeParse({}).success).toBe(false)
  })

  it('applies defaults', () => {
    const result = AvatarGroupSchema.parse({ avatars: [] })
    expect(result.maxVisible).toBe(4)
    expect(result.size).toBe('sm')
    expect(result.overlap).toBe(8)
  })

  it('rejects non-positive maxVisible', () => {
    expect(AvatarGroupSchema.safeParse({ avatars: [], maxVisible: 0 }).success).toBe(false)
  })

  it('rejects non-integer maxVisible', () => {
    expect(AvatarGroupSchema.safeParse({ avatars: [], maxVisible: 2.5 }).success).toBe(false)
  })

  it('accepts all valid sizes', () => {
    for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
      expect(AvatarGroupSchema.safeParse({ avatars: [], size }).success).toBe(true)
    }
  })

  it('rejects invalid size', () => {
    expect(AvatarGroupSchema.safeParse({ avatars: [], size: 'xl' }).success).toBe(false)
  })

  it('accepts partial avatar items', () => {
    const result = AvatarGroupSchema.parse({
      avatars: [{ src: 'https://example.com/a.png' }, { name: 'Bob' }],
    })
    expect(result.avatars).toHaveLength(2)
  })
})
