import { describe, it, expect } from 'vitest'
import { BackButtonSchema } from '../schema'

describe('BackButtonSchema', () => {
  it('parses a minimal valid config', () => {
    expect(BackButtonSchema.safeParse({}).success).toBe(true)
  })

  it('applies default label', () => {
    const result = BackButtonSchema.parse({})
    expect(result.label).toBe('Back')
  })

  it('accepts custom label', () => {
    const result = BackButtonSchema.parse({ label: 'Cancel' })
    expect(result.label).toBe('Cancel')
  })

  it('accepts an action', () => {
    const result = BackButtonSchema.parse({ action: { type: 'navigate', path: '/' } })
    expect(result.action).toBeDefined()
  })

  it('accepts id and testID', () => {
    const result = BackButtonSchema.parse({ id: 'back-btn', testID: 'back-btn' })
    expect(result.id).toBe('back-btn')
  })
})
