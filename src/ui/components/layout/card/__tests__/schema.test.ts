import { describe, it, expect } from 'vitest'
import { CardSchema } from '../schema'

describe('CardSchema', () => {
  it('parses a minimal valid config', () => {
    expect(CardSchema.safeParse({}).success).toBe(true)
  })

  it('applies defaults', () => {
    const result = CardSchema.parse({})
    expect(result.padding).toBe(4)
    expect(result.radius).toBe('lg')
    expect(result.shadow).toBe('md')
  })

  it('parses a full config', () => {
    const result = CardSchema.parse({
      id: 'user-card',
      padding: 16,
      radius: 'xl',
      shadow: 'lg',
      backgroundColor: '#fff',
      testID: 'user-card',
    })
    expect(result.radius).toBe('xl')
    expect(result.shadow).toBe('lg')
  })

  it('rejects invalid radius value', () => {
    expect(CardSchema.safeParse({ radius: 'massive' }).success).toBe(false)
  })

  it('rejects invalid shadow value', () => {
    expect(CardSchema.safeParse({ shadow: 'huge' }).success).toBe(false)
  })

  it('accepts action for onPress', () => {
    const result = CardSchema.parse({ onPress: { type: 'navigate', to: '/detail' } })
    expect(result.onPress).toBeDefined()
  })
})
