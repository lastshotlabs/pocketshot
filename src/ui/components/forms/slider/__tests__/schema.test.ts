import { describe, expect, it } from 'vitest'
import { SliderSchema } from '../schema'

describe('SliderSchema', () => {
  it('parses a minimal valid config', () => {
    const result = SliderSchema.parse({ id: 'volume' })
    expect(result.id).toBe('volume')
  })

  it('applies defaults', () => {
    const result = SliderSchema.parse({ id: 'volume' })
    expect(result.min).toBe(0)
    expect(result.max).toBe(100)
    expect(result.step).toBe(1)
    expect(result.showValue).toBe(true)
  })

  it('accepts slot surfaces', () => {
    const result = SliderSchema.parse({
      id: 'volume',
      slots: {
        header: { paddingY: 'sm' },
        track: { borderRadius: 'full' },
        thumb: { borderRadius: 'full' },
      },
    })

    expect(result.slots?.header?.paddingY).toBe('sm')
    expect(result.slots?.track?.borderRadius).toBe('full')
    expect(result.slots?.thumb?.borderRadius).toBe('full')
  })
})
