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
})
