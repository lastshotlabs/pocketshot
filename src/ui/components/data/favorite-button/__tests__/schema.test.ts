import { describe, expect, it } from 'vitest'
import { FavoriteButtonSchema } from '../schema'

describe('FavoriteButtonSchema', () => {
  it('parses a minimal valid config', () => {
    expect(FavoriteButtonSchema.safeParse({}).success).toBe(true)
  })

  it('applies defaults', () => {
    const result = FavoriteButtonSchema.parse({})
    expect(result.defaultValue).toBe(false)
    expect(result.variant).toBe('heart')
    expect(result.size).toBe('md')
  })

  it('accepts named slot surfaces', () => {
    expect(
      FavoriteButtonSchema.safeParse({
        slots: {
          icon: {
            color: 'warning',
          },
        },
      }).success,
    ).toBe(true)
  })
})
