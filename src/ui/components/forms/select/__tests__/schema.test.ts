import { describe, expect, it } from 'vitest'
import { SelectSchema } from '../schema'

describe('SelectSchema', () => {
  it('parses a minimal valid config', () => {
    const result = SelectSchema.parse({
      id: 'status',
      options: [{ label: 'Draft', value: 'draft' }],
    })
    expect(result.id).toBe('status')
  })

  it('applies defaults', () => {
    const result = SelectSchema.parse({
      id: 'status',
      options: [{ label: 'Draft', value: 'draft' }],
    })
    expect(result.placeholder).toBe('Select an option')
  })

  it('accepts slot surfaces', () => {
    const result = SelectSchema.parse({
      id: 'status',
      options: [{ label: 'Draft', value: 'draft' }],
      slots: {
        trigger: { borderRadius: 'lg' },
        sheet: { borderRadius: 'xl' },
        optionText: { color: 'primary' },
      },
    })

    expect(result.slots?.trigger?.borderRadius).toBe('lg')
    expect(result.slots?.sheet?.borderRadius).toBe('xl')
    expect(result.slots?.optionText?.color).toBe('primary')
  })
})
