import { describe, it, expect } from 'vitest'
import { ActionSheetSchema } from '../schema'

describe('ActionSheetSchema', () => {
  it('parses a minimal valid config', () => {
    expect(ActionSheetSchema.safeParse({}).success).toBe(true)
  })

  it('accepts an id', () => {
    const result = ActionSheetSchema.parse({ id: 'options-sheet' })
    expect(result.id).toBe('options-sheet')
  })

  it('parses without any fields', () => {
    const result = ActionSheetSchema.parse({})
    expect(result.id).toBeUndefined()
  })

  it('accepts slot surfaces', () => {
    const result = ActionSheetSchema.parse({
      id: 'options-sheet',
      slots: {
        container: { bg: 'card' },
        title: { letterSpacing: 'wide' },
        optionText: { color: 'primary' },
      },
    })

    expect(result.slots?.container?.bg).toBe('card')
    expect(result.slots?.title?.letterSpacing).toBe('wide')
    expect(result.slots?.optionText?.color).toBe('primary')
  })
})
