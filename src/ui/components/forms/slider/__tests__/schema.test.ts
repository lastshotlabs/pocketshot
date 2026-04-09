import { describe, it, expect } from 'vitest'
import { SliderSchema } from '../schema'

describe('SliderSchema', () => {
  it('parses a valid config', () => {
    expect(SliderSchema.safeParse({ id: 'volume' }).success).toBe(true)
  })

  it('requires id', () => {
    expect(SliderSchema.safeParse({}).success).toBe(false)
  })

  it('applies defaults', () => {
    const result = SliderSchema.parse({ id: 'volume' })
    expect(result.min).toBe(0)
    expect(result.max).toBe(100)
    expect(result.step).toBe(1)
    expect(result.showValue).toBe(true)
  })

  it('accepts from-ref value', () => {
    const result = SliderSchema.parse({ id: 'x', value: { from: 'settings' } })
    expect(result.value).toEqual({ from: 'settings' })
  })

  it('accepts numeric value', () => {
    const result = SliderSchema.parse({ id: 'x', value: 50 })
    expect(result.value).toBe(50)
  })

  it('accepts custom min/max/step', () => {
    const result = SliderSchema.parse({ id: 'x', min: 10, max: 50, step: 5 })
    expect(result.min).toBe(10)
    expect(result.max).toBe(50)
    expect(result.step).toBe(5)
  })

  it('accepts onChangeAction', () => {
    const result = SliderSchema.parse({
      id: 'x',
      onChangeAction: { type: 'set-value', key: 'vol', value: 0 },
    })
    expect(result.onChangeAction).toBeDefined()
  })
})
