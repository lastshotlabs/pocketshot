import { describe, it, expect } from 'vitest'
import { CheckboxSchema } from '../schema'

describe('CheckboxSchema', () => {
  it('parses a valid config', () => {
    const result = CheckboxSchema.parse({ id: 'agree', label: 'I agree' })
    expect(result.id).toBe('agree')
    expect(result.label).toBe('I agree')
  })

  it('requires id', () => {
    expect(CheckboxSchema.safeParse({ label: 'Accept' }).success).toBe(false)
  })

  it('requires label', () => {
    expect(CheckboxSchema.safeParse({ id: 'agree' }).success).toBe(false)
  })

  it('applies defaults', () => {
    const result = CheckboxSchema.parse({ id: 'agree', label: 'Accept' })
    expect(result.defaultChecked).toBe(false)
    expect(result.disabled).toBe(false)
  })

  it('accepts from-ref checked', () => {
    const result = CheckboxSchema.parse({ id: 'agree', label: 'Accept', checked: { from: 'form' } })
    expect(result.checked).toEqual({ from: 'form' })
  })

  it('accepts boolean checked', () => {
    const result = CheckboxSchema.parse({ id: 'agree', label: 'Accept', checked: true })
    expect(result.checked).toBe(true)
  })

  it('rejects non-boolean disabled', () => {
    expect(CheckboxSchema.safeParse({ id: 'x', label: 'X', disabled: 'yes' }).success).toBe(false)
  })
})
