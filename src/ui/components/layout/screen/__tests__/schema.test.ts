import { describe, expect, it } from 'vitest'
import { ScreenSchema } from '../schema'

describe('ScreenSchema', () => {
  it('parses a minimal valid config', () => {
    const result = ScreenSchema.parse({})
    expect(result.scrollable).toBe(true)
  })

  it('applies defaults', () => {
    const result = ScreenSchema.parse({})
    expect(result.scrollable).toBe(true)
    expect(result.padding).toBe('lg')
    expect(result.edges).toEqual(['top', 'bottom', 'left', 'right'])
  })

  it('accepts slot styling surfaces', () => {
    const result = ScreenSchema.parse({
      slots: {
        viewport: {
          bg: 'card',
        },
        content: {
          paddingY: 'xl',
        },
      },
    })

    expect(result.slots?.viewport?.bg).toBe('card')
    expect(result.slots?.content?.paddingY).toBe('xl')
  })
})
