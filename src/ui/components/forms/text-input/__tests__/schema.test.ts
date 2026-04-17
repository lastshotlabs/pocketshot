import { describe, it, expect } from 'vitest'
import { TextInputSchema } from '../schema'

describe('TextInputSchema', () => {
  it('parses a minimal valid config', () => {
    expect(TextInputSchema.safeParse({ id: 'email' }).success).toBe(true)
  })

  it('requires id', () => {
    expect(TextInputSchema.safeParse({}).success).toBe(false)
  })

  it('applies defaults', () => {
    const result = TextInputSchema.parse({ id: 'email' })
    expect(result.secureTextEntry).toBe(false)
    expect(result.keyboardType).toBe('default')
    expect(result.autoCapitalize).toBe('sentences')
    expect(result.multiline).toBe(false)
  })

  it('accepts from-ref errorText', () => {
    const result = TextInputSchema.parse({ id: 'email', errorText: { from: 'formErrors' } })
    expect(result.errorText).toEqual({ from: 'formErrors' })
  })

  it('accepts string errorText', () => {
    const result = TextInputSchema.parse({ id: 'email', errorText: 'Invalid email' })
    expect(result.errorText).toBe('Invalid email')
  })

  it('accepts from-ref value', () => {
    const result = TextInputSchema.parse({ id: 'email', value: { from: 'formData' } })
    expect(result.value).toEqual({ from: 'formData' })
  })

  it('accepts all valid keyboardTypes', () => {
    const types = ['default', 'email-address', 'numeric', 'phone-pad', 'url'] as const
    for (const keyboardType of types) {
      expect(TextInputSchema.safeParse({ id: 'x', keyboardType }).success).toBe(true)
    }
  })

  it('rejects invalid keyboardType', () => {
    expect(TextInputSchema.safeParse({ id: 'x', keyboardType: 'fax' }).success).toBe(false)
  })

  it('accepts all valid autoCapitalize values', () => {
    for (const v of ['none', 'sentences', 'words', 'characters'] as const) {
      expect(TextInputSchema.safeParse({ id: 'x', autoCapitalize: v }).success).toBe(true)
    }
  })

  it('accepts secureTextEntry', () => {
    const result = TextInputSchema.parse({ id: 'password', secureTextEntry: true })
    expect(result.secureTextEntry).toBe(true)
  })

  it('accepts slot surfaces', () => {
    const result = TextInputSchema.parse({
      id: 'email',
      slots: {
        input: { borderRadius: 'lg' },
        label: { letterSpacing: 'wide' },
        errorText: { color: 'error' },
      },
    })

    expect(result.slots?.input?.borderRadius).toBe('lg')
    expect(result.slots?.label?.letterSpacing).toBe('wide')
    expect(result.slots?.errorText?.color).toBe('error')
  })
})
