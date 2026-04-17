import { describe, expect, it } from 'vitest'
import { KeyboardAvoidingScreenSchema } from '../schema'

describe('KeyboardAvoidingScreenSchema', () => {
  it('parses a minimal valid config', () => {
    const result = KeyboardAvoidingScreenSchema.parse({})
    expect(result.scrollable).toBe(true)
  })

  it('applies defaults', () => {
    const result = KeyboardAvoidingScreenSchema.parse({})
    expect(result.scrollable).toBe(true)
    expect(result.padding).toBe('lg')
  })

  it('accepts slot styling surfaces', () => {
    const result = KeyboardAvoidingScreenSchema.parse({
      slots: {
        keyboardAvoiding: {
          bg: 'card',
        },
        content: {
          paddingY: 'xl',
        },
      },
    })

    expect(result.slots?.keyboardAvoiding?.bg).toBe('card')
    expect(result.slots?.content?.paddingY).toBe('xl')
  })
})
