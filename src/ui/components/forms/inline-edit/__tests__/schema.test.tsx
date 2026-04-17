import { describe, expect, it } from 'vitest'
import { InlineEditSchema } from '../schema'

describe('InlineEditSchema', () => {
  it('accepts ref-backed presentation fields', () => {
    const result = InlineEditSchema.parse({
      id: 'price',
      placeholder: { from: 'copy.placeholder' },
      prefix: { from: 'copy.prefix' },
      suffix: { from: 'copy.suffix' },
      emptyText: { from: 'copy.empty' },
    })

    expect(result.placeholder).toEqual({ from: 'copy.placeholder' })
    expect(result.prefix).toEqual({ from: 'copy.prefix' })
    expect(result.suffix).toEqual({ from: 'copy.suffix' })
    expect(result.emptyText).toEqual({ from: 'copy.empty' })
  })

  it('applies defaults', () => {
    const result = InlineEditSchema.parse({ id: 'price' })

    expect(result.defaultValue).toBe('')
    expect(result.inputType).toBe('text')
  })

  it('accepts slot styling surfaces', () => {
    const result = InlineEditSchema.parse({
      id: 'price',
      slots: {
        displayText: { color: 'primary' },
        editRow: { borderRadius: 'lg' },
        confirmText: { color: 'success' },
      },
    })

    expect(result.slots?.displayText?.color).toBe('primary')
    expect(result.slots?.editRow?.borderRadius).toBe('lg')
    expect(result.slots?.confirmText?.color).toBe('success')
  })
})
