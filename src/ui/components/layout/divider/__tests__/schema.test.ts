import { describe, it, expect } from 'vitest'
import { DividerSchema } from '../schema'

describe('DividerSchema', () => {
  it('parses a minimal valid config', () => {
    expect(DividerSchema.safeParse({}).success).toBe(true)
  })

  it('applies defaults', () => {
    const result = DividerSchema.parse({})
    expect(result.thickness).toBe(1)
    expect(result.orientation).toBe('horizontal')
  })

  it('parses a full config', () => {
    const result = DividerSchema.parse({
      thickness: 2,
      color: '#e0e0e0',
      marginY: 'md',
      orientation: 'vertical',
    })
    expect(result.orientation).toBe('vertical')
    expect(result.thickness).toBe(2)
    expect(result.marginY).toBe('md')
  })

  it('rejects invalid orientation', () => {
    expect(DividerSchema.safeParse({ orientation: 'diagonal' }).success).toBe(false)
  })

  it('rejects non-number thickness', () => {
    expect(DividerSchema.safeParse({ thickness: 'thin' }).success).toBe(false)
  })

  it('accepts slot styling surfaces', () => {
    const result = DividerSchema.parse({
      slots: {
        line: {
          bg: 'border',
        },
      },
    })

    expect(result.slots?.line?.bg).toBe('border')
  })
})
