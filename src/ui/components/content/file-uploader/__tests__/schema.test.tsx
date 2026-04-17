import { describe, expect, it } from 'vitest'
import { FileUploaderSchema } from '../schema'

describe('FileUploaderSchema', () => {
  it('parses the required id field', () => {
    const result = FileUploaderSchema.parse({ id: 'upload' })

    expect(result.id).toBe('upload')
  })

  it('accepts ref-backed labels and values', () => {
    const result = FileUploaderSchema.parse({
      id: 'upload',
      label: { from: 'copy.label' },
      value: { from: 'files.items' },
    })

    expect(result.label).toEqual({ from: 'copy.label' })
    expect(result.value).toEqual({ from: 'files.items' })
  })

  it('applies defaults', () => {
    const result = FileUploaderSchema.parse({ id: 'upload' })

    expect(result.accept).toBe('any')
    expect(result.multiple).toBe(false)
    expect(result.maxFiles).toBe(5)
    expect(result.maxSizeMb).toBe(10)
  })

  it('accepts slot styling surfaces', () => {
    const result = FileUploaderSchema.parse({
      id: 'upload',
      slots: {
        dropZone: { borderRadius: 'xl' },
        fileName: { color: 'primary' },
        removeButton: { states: { disabled: { opacity: 0.4 } } },
      },
    })

    expect(result.slots?.dropZone?.borderRadius).toBe('xl')
    expect(result.slots?.fileName?.color).toBe('primary')
    expect(result.slots?.removeButton?.states?.disabled?.opacity).toBe(0.4)
  })
})
