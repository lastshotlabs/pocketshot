import { describe, expect, it } from 'vitest'
import { RichInputSchema } from '../schema'

describe('RichInputSchema', () => {
  it('parses the required id field', () => {
    const result = RichInputSchema.parse({ id: 'notes' })

    expect(result.id).toBe('notes')
  })

  it('accepts ref-backed label, value, and placeholder', () => {
    const result = RichInputSchema.parse({
      id: 'notes',
      value: { from: 'draft.body' },
      label: { from: 'copy.label' },
      placeholder: { from: 'copy.placeholder' },
    })

    expect(result.value).toEqual({ from: 'draft.body' })
    expect(result.label).toEqual({ from: 'copy.label' })
    expect(result.placeholder).toEqual({ from: 'copy.placeholder' })
  })

  it('applies defaults', () => {
    const result = RichInputSchema.parse({ id: 'notes' })

    expect(result.toolbar).toEqual(['bold', 'italic', 'code', 'list-bullet'])
    expect(result.minRows).toBe(4)
    expect(result.maxRows).toBe(12)
  })

  it('accepts slot styling surfaces', () => {
    const result = RichInputSchema.parse({
      id: 'notes',
      slots: {
        toolbar: { borderRadius: 'xl' },
        toolbarLabel: { color: 'primary' },
        input: { borderRadius: 'lg' },
      },
    })

    expect(result.slots?.toolbar?.borderRadius).toBe('xl')
    expect(result.slots?.toolbarLabel?.color).toBe('primary')
    expect(result.slots?.input?.borderRadius).toBe('lg')
  })
})
