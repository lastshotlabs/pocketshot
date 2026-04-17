import { describe, expect, it } from 'vitest'
import { MultiSelectSchema } from '../schema'

describe('MultiSelectSchema', () => {
  it('accepts ref-backed copy fields', () => {
    const result = MultiSelectSchema.parse({
      id: 'themes',
      options: [{ value: 'light', label: 'Light' }],
      label: { from: 'copy.label' },
      placeholder: { from: 'copy.placeholder' },
      emptyMessage: { from: 'copy.empty' },
    })

    expect(result.label).toEqual({ from: 'copy.label' })
    expect(result.placeholder).toEqual({ from: 'copy.placeholder' })
    expect(result.emptyMessage).toEqual({ from: 'copy.empty' })
  })

  it('applies defaults', () => {
    const result = MultiSelectSchema.parse({
      id: 'themes',
      options: [{ value: 'light', label: 'Light' }],
    })

    expect(result.placeholder).toBe('Select options...')
    expect(result.emptyMessage).toBe('No options')
  })

  it('accepts slot styling surfaces', () => {
    const result = MultiSelectSchema.parse({
      id: 'themes',
      options: [{ value: 'light', label: 'Light' }],
      slots: {
        trigger: { borderRadius: 'lg' },
        optionLabel: { color: 'primary' },
        doneButton: { borderRadius: 'md' },
      },
    })

    expect(result.slots?.trigger?.borderRadius).toBe('lg')
    expect(result.slots?.optionLabel?.color).toBe('primary')
    expect(result.slots?.doneButton?.borderRadius).toBe('md')
  })
})
