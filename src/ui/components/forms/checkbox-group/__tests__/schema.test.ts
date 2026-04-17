import { describe, expect, it } from 'vitest'
import { CheckboxGroupSchema } from '../schema'

describe('CheckboxGroupSchema', () => {
  it('parses a minimal valid config', () => {
    const result = CheckboxGroupSchema.parse({
      id: 'interests',
      options: [{ value: 'photo', label: 'Photography' }],
    })
    expect(result.id).toBe('interests')
  })

  it('applies defaults', () => {
    const result = CheckboxGroupSchema.parse({
      id: 'interests',
      options: [{ value: 'photo', label: 'Photography' }],
    })
    expect(result.orientation).toBe('vertical')
    expect(result.defaultValue).toEqual([])
  })

  it('accepts slot surfaces', () => {
    const result = CheckboxGroupSchema.parse({
      id: 'interests',
      options: [{ value: 'photo', label: 'Photography' }],
      slots: {
        optionsList: { gap: 'lg' },
        box: { borderRadius: 'lg' },
        optionLabel: { color: 'primary' },
      },
    })

    expect(result.slots?.optionsList?.gap).toBe('lg')
    expect(result.slots?.box?.borderRadius).toBe('lg')
    expect(result.slots?.optionLabel?.color).toBe('primary')
  })
})
