import { describe, expect, it } from 'vitest'
import { MediaPickerSchema } from '../schema'

describe('MediaPickerSchema', () => {
  it('parses the required id and action fields', () => {
    const result = MediaPickerSchema.parse({
      id: 'media-picker',
      onSelect: { type: 'set-value', target: 'media.selected', value: true },
    })

    expect(result.id).toBe('media-picker')
  })

  it('applies defaults', () => {
    const result = MediaPickerSchema.parse({
      id: 'media-picker',
      onSelect: { type: 'set-value', target: 'media.selected', value: true },
    })

    expect(result.mediaTypes).toEqual(['image'])
    expect(result.maxSelections).toBe(1)
    expect(result.quality).toBe(0.8)
  })

  it('accepts slot styling surfaces', () => {
    const result = MediaPickerSchema.parse({
      id: 'media-picker',
      onSelect: { type: 'set-value', target: 'media.selected', value: true },
      slots: {
        pickButton: { borderRadius: 'xl' },
        removeButton: { borderRadius: 'full' },
        itemName: { color: 'primary' },
      },
    })

    expect(result.slots?.pickButton?.borderRadius).toBe('xl')
    expect(result.slots?.removeButton?.borderRadius).toBe('full')
    expect(result.slots?.itemName?.color).toBe('primary')
  })
})
