import { describe, it, expect } from 'vitest'
import { SwitchSchema } from '../schema'

describe('SwitchSchema', () => {
  it('parses a valid config', () => {
    expect(SwitchSchema.safeParse({ id: 'notifications' }).success).toBe(true)
  })

  it('requires id', () => {
    expect(SwitchSchema.safeParse({}).success).toBe(false)
  })

  it('applies defaults', () => {
    const result = SwitchSchema.parse({ id: 'notifications' })
    expect(result.defaultValue).toBe(false)
    expect(result.disabled).toBe(false)
  })

  it('accepts from-ref value', () => {
    const result = SwitchSchema.parse({ id: 'x', value: { from: 'settings' } })
    expect(result.value).toEqual({ from: 'settings' })
  })

  it('accepts boolean value', () => {
    const result = SwitchSchema.parse({ id: 'x', value: true })
    expect(result.value).toBe(true)
  })

  it('accepts label', () => {
    const result = SwitchSchema.parse({ id: 'x', label: 'Enable notifications' })
    expect(result.label).toBe('Enable notifications')
  })

  it('rejects non-boolean disabled', () => {
    expect(SwitchSchema.safeParse({ id: 'x', disabled: 'true' }).success).toBe(false)
  })
})
