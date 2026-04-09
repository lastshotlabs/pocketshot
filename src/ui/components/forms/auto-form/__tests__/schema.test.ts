import { describe, it, expect } from 'vitest'
import { AutoFormSchema } from '../schema'

const baseAction = { type: 'api', endpoint: '/submit', method: 'POST' as const }

describe('AutoFormSchema', () => {
  it('parses a minimal valid config', () => {
    const result = AutoFormSchema.parse({ id: 'contact', fields: [], onSubmit: baseAction })
    expect(result.id).toBe('contact')
  })

  it('requires id', () => {
    expect(AutoFormSchema.safeParse({ fields: [], onSubmit: baseAction }).success).toBe(false)
  })

  it('requires fields', () => {
    expect(AutoFormSchema.safeParse({ id: 'x', onSubmit: baseAction }).success).toBe(false)
  })

  it('parses without onSubmit (z.custom is runtime-transparent)', () => {
    // z.custom<Action>() has no runtime validator — TypeScript-only constraint
    expect(AutoFormSchema.safeParse({ id: 'x', fields: [] }).success).toBe(true)
  })

  it('applies defaults', () => {
    const result = AutoFormSchema.parse({ id: 'x', fields: [], onSubmit: baseAction })
    expect(result.submitLabel).toBe('Submit')
    expect(result.onSubmitKey).toBe('__formData')
  })

  it('parses field with options', () => {
    const result = AutoFormSchema.parse({
      id: 'x',
      fields: [{
        id: 'role',
        type: 'select',
        label: 'Role',
        options: [{ label: 'Admin', value: 'admin' }, { label: 'User', value: 'user' }],
      }],
      onSubmit: baseAction,
    })
    expect(result.fields[0].type).toBe('select')
  })

  it('rejects invalid field type', () => {
    expect(AutoFormSchema.safeParse({
      id: 'x',
      fields: [{ id: 'x', type: 'date', label: 'Date' }],
      onSubmit: baseAction,
    }).success).toBe(false)
  })

  it('accepts all valid field types', () => {
    for (const type of ['text', 'email', 'password', 'number', 'select', 'checkbox', 'switch'] as const) {
      expect(AutoFormSchema.safeParse({
        id: 'x',
        fields: [{ id: 'f', type, label: 'Field' }],
        onSubmit: baseAction,
      }).success).toBe(true)
    }
  })

  it('accepts from-ref validationErrors', () => {
    const result = AutoFormSchema.parse({
      id: 'x',
      fields: [],
      onSubmit: baseAction,
      validationErrors: { from: 'serverErrors' },
    })
    expect(result.validationErrors).toEqual({ from: 'serverErrors' })
  })

  it('field requires id and label', () => {
    expect(AutoFormSchema.safeParse({
      id: 'x',
      fields: [{ type: 'text', label: 'Name' }],
      onSubmit: baseAction,
    }).success).toBe(false)
  })
})
