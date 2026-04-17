import { describe, expect, it } from 'vitest'
import { PinInputSchema } from '../schema'

describe('PinInputSchema', () => {
  it('parses a minimal valid config', () => {
    const result = PinInputSchema.parse({ id: 'pin' })
    expect(result.id).toBe('pin')
  })

  it('applies defaults', () => {
    const result = PinInputSchema.parse({ id: 'pin' })
    expect(result.length).toBe(6)
    expect(result.secureEntry).toBe(false)
    expect(result.autoFocus).toBe(false)
  })

  it('accepts slot surfaces', () => {
    const result = PinInputSchema.parse({
      id: 'pin',
      slots: {
        boxRow: { gap: 'lg' },
        box: { borderRadius: 'lg' },
      },
    })

    expect(result.slots?.boxRow?.gap).toBe('lg')
    expect(result.slots?.box?.borderRadius).toBe('lg')
  })
})
