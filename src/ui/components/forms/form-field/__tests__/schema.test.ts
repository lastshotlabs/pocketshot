import { describe, it, expect } from 'vitest'
import { FormFieldSchema } from '../schema'

describe('FormFieldSchema', () => {
  it('parses a minimal valid config', () => {
    expect(FormFieldSchema.safeParse({}).success).toBe(true)
  })

  it('applies defaults', () => {
    const result = FormFieldSchema.parse({})
    expect(result.required).toBe(false)
  })

  it('parses a full config', () => {
    const result = FormFieldSchema.parse({
      id: 'email-field',
      label: 'Email Address',
      required: true,
      helperText: 'We will never share your email',
      errorKey: 'email',
      testID: 'email-field',
    })
    expect(result.required).toBe(true)
    expect(result.label).toBe('Email Address')
    expect(result.errorKey).toBe('email')
  })

  it('rejects non-boolean required', () => {
    expect(FormFieldSchema.safeParse({ required: 'yes' }).success).toBe(false)
  })

  it('all fields are optional', () => {
    expect(FormFieldSchema.safeParse({}).success).toBe(true)
  })
})
