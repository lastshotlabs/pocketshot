import { describe, expect, it } from 'vitest'
import { RadioGroupSchema } from '../schema'

describe('RadioGroupSchema', () => {
  it('parses a minimal valid config', () => {
    const result = RadioGroupSchema.parse({
      id: 'theme',
      options: [{ value: 'light', label: 'Light' }],
    })
    expect(result.id).toBe('theme')
  })

  it('applies defaults', () => {
    const result = RadioGroupSchema.parse({
      id: 'theme',
      options: [{ value: 'light', label: 'Light' }],
    })
    expect(result.orientation).toBe('vertical')
  })

  it('accepts slot surfaces', () => {
    const result = RadioGroupSchema.parse({
      id: 'theme',
      options: [{ value: 'light', label: 'Light' }],
      slots: {
        optionsList: { gap: 'lg' },
        control: { borderRadius: 'full' },
        optionLabel: { color: 'primary' },
      },
    })

    expect(result.slots?.optionsList?.gap).toBe('lg')
    expect(result.slots?.control?.borderRadius).toBe('full')
    expect(result.slots?.optionLabel?.color).toBe('primary')
  })
})
