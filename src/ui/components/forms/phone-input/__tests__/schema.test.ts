import { describe, expect, it } from 'vitest'
import { PhoneInputSchema } from '../schema'

describe('PhoneInputSchema', () => {
  it('parses a minimal valid config', () => {
    const result = PhoneInputSchema.parse({ id: 'phone' })
    expect(result.id).toBe('phone')
  })

  it('applies defaults', () => {
    const result = PhoneInputSchema.parse({ id: 'phone' })
    expect(result.placeholder).toBe('Phone number')
    expect(result.defaultCountry).toBe('US')
  })

  it('accepts slot surfaces', () => {
    const result = PhoneInputSchema.parse({
      id: 'phone',
      slots: {
        inputRow: { borderRadius: 'lg' },
        searchInput: { borderRadius: 'lg' },
        countryRowName: { color: 'primary' },
      },
    })

    expect(result.slots?.inputRow?.borderRadius).toBe('lg')
    expect(result.slots?.searchInput?.borderRadius).toBe('lg')
    expect(result.slots?.countryRowName?.color).toBe('primary')
  })
})
