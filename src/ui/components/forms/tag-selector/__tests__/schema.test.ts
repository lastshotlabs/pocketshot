import { describe, expect, it } from 'vitest'
import { TagSelectorSchema } from '../schema'

describe('TagSelectorSchema', () => {
  it('parses a minimal valid config', () => {
    const result = TagSelectorSchema.parse({
      id: 'tags',
      availableTags: [{ id: 'photo', label: 'Photography' }],
    })
    expect(result.id).toBe('tags')
  })

  it('accepts slot surfaces', () => {
    const result = TagSelectorSchema.parse({
      id: 'tags',
      availableTags: [{ id: 'photo', label: 'Photography' }],
      slots: {
        tagsRow: { gap: 'lg' },
        tag: { borderRadius: 'full' },
        tagText: { color: 'primary' },
      },
    })

    expect(result.slots?.tagsRow?.gap).toBe('lg')
    expect(result.slots?.tag?.borderRadius).toBe('full')
    expect(result.slots?.tagText?.color).toBe('primary')
  })
})
