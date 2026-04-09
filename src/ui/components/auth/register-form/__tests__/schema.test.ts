import { describe, it, expect } from 'vitest'
import { RegisterFormSchema } from '../schema'

const action = { type: 'api' as const, endpoint: '/auth/register', method: 'POST' as const }

describe('RegisterFormSchema', () => {
  it('parses a valid config', () => {
    const result = RegisterFormSchema.parse({ onSubmit: action })
    expect(result.onSubmit).toBeDefined()
  })

  it('parses without onSubmit (z.custom is runtime-transparent)', () => {
    // z.custom<Action>() has no runtime validator — TypeScript-only constraint
    expect(RegisterFormSchema.safeParse({}).success).toBe(true)
  })

  it('applies defaults', () => {
    const result = RegisterFormSchema.parse({ onSubmit: action })
    expect(result.submitLabel).toBe('Create Account')
    expect(result.fields).toEqual(['email', 'password'])
  })

  it('accepts custom fields', () => {
    const result = RegisterFormSchema.parse({
      onSubmit: action,
      fields: ['email', 'username', 'password', 'confirmPassword'],
    })
    expect(result.fields).toHaveLength(4)
  })

  it('rejects invalid field names', () => {
    expect(
      RegisterFormSchema.safeParse({
        onSubmit: action,
        fields: ['email', 'phone'],
      }).success,
    ).toBe(false)
  })

  it('accepts loginAction', () => {
    const result = RegisterFormSchema.parse({
      onSubmit: action,
      loginAction: { type: 'navigate', path: '/login' },
    })
    expect(result.loginAction).toBeDefined()
  })

  it('accepts custom submitLabel', () => {
    const result = RegisterFormSchema.parse({ onSubmit: action, submitLabel: 'Sign Up' })
    expect(result.submitLabel).toBe('Sign Up')
  })
})
