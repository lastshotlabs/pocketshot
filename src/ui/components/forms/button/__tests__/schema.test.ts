import { describe, it, expect } from 'vitest'
import { ButtonSchema } from '../schema'

describe('ButtonSchema', () => {
  it('parses a valid config', () => {
    const result = ButtonSchema.parse({
      label: 'Save',
      onPress: { type: 'set-value', target: 'button.save', value: true },
    })
    expect(result.label).toBe('Save')
  })

  it('applies defaults', () => {
    const result = ButtonSchema.parse({
      label: 'Save',
      onPress: { type: 'set-value', target: 'button.save', value: true },
    })
    expect(result.variant).toBe('primary')
    expect(result.size).toBe('md')
    expect(result.loading).toBe(false)
    expect(result.disabled).toBe(false)
    expect(result.fullWidth).toBe(false)
  })

  it('accepts slot surfaces', () => {
    const result = ButtonSchema.parse({
      label: 'Save',
      onPress: { type: 'set-value', target: 'button.save', value: true },
      slots: {
        button: { paddingY: 'sm' },
        label: { letterSpacing: 'wide' },
      },
    })

    expect(result.slots?.button?.paddingY).toBe('sm')
    expect(result.slots?.label?.letterSpacing).toBe('wide')
  })
})
