import { describe, it, expect } from 'vitest'
import { SpacerSchema } from '../schema'

describe('SpacerSchema', () => {
  it('parses a minimal valid config', () => {
    expect(SpacerSchema.safeParse({}).success).toBe(true)
  })

  it('applies defaults', () => {
    const result = SpacerSchema.parse({})
    expect(result.size).toBe(4)
    expect(result.flex).toBe(false)
  })

  it('parses a full config', () => {
    const result = SpacerSchema.parse({ size: 16, flex: true })
    expect(result.size).toBe(16)
    expect(result.flex).toBe(true)
  })

  it('rejects non-number size', () => {
    expect(SpacerSchema.safeParse({ size: 'large' }).success).toBe(false)
  })

  it('rejects non-boolean flex', () => {
    expect(SpacerSchema.safeParse({ flex: 1 }).success).toBe(false)
  })
})
