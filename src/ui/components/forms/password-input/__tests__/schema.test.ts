import { describe, expect, it } from 'vitest'
import { PasswordInputSchema } from '../schema'

describe('PasswordInputSchema', () => {
  it('parses a minimal valid config', () => {
    const result = PasswordInputSchema.parse({ id: 'password' })
    expect(result.id).toBe('password')
  })

  it('applies defaults', () => {
    const result = PasswordInputSchema.parse({ id: 'password' })
    expect(result.showToggle).toBe(true)
  })

  it('accepts slot surfaces', () => {
    const result = PasswordInputSchema.parse({
      id: 'password',
      slots: {
        inputRow: { borderRadius: 'lg' },
        toggleText: { color: 'primary' },
        errorText: { color: 'error' },
      },
    })

    expect(result.slots?.inputRow?.borderRadius).toBe('lg')
    expect(result.slots?.toggleText?.color).toBe('primary')
    expect(result.slots?.errorText?.color).toBe('error')
  })
})
