import { describe, expect, it } from 'vitest'
import { FormFieldSchema } from '../schema'

describe('FormFieldSchema', () => {
  it('accepts ref-backed labels and helper text', () => {
    const result = FormFieldSchema.parse({
      label: { from: 'copy.label' },
      helperText: { from: 'copy.helper' },
    })

    expect(result.label).toEqual({ from: 'copy.label' })
    expect(result.helperText).toEqual({ from: 'copy.helper' })
  })

  it('applies defaults', () => {
    const result = FormFieldSchema.parse({})

    expect(result.required).toBe(false)
  })

  it('accepts slot styling surfaces', () => {
    const result = FormFieldSchema.parse({
      slots: {
        label: { color: 'primary' },
        helperText: { color: 'muted' },
        errorText: { color: 'error' },
      },
    })

    expect(result.slots?.label?.color).toBe('primary')
    expect(result.slots?.helperText?.color).toBe('muted')
    expect(result.slots?.errorText?.color).toBe('error')
  })
})
