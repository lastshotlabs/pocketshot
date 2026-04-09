import { describe, it, expect } from 'vitest'
import { ForgotPasswordFormSchema } from '../schema'

const action = { type: 'api' as const, endpoint: '/auth/forgot-password', method: 'POST' as const }

describe('ForgotPasswordFormSchema', () => {
  it('parses a valid config', () => {
    const result = ForgotPasswordFormSchema.parse({ onSubmit: action })
    expect(result.onSubmit).toBeDefined()
  })

  it('parses without onSubmit (z.custom is runtime-transparent)', () => {
    // z.custom<Action>() has no runtime validator — TypeScript-only constraint
    expect(ForgotPasswordFormSchema.safeParse({}).success).toBe(true)
  })

  it('applies defaults', () => {
    const result = ForgotPasswordFormSchema.parse({ onSubmit: action })
    expect(result.submitLabel).toBe('Send Reset Email')
  })

  it('accepts backAction', () => {
    const result = ForgotPasswordFormSchema.parse({
      onSubmit: action,
      backAction: { type: 'navigate', path: '/login' },
    })
    expect(result.backAction).toBeDefined()
  })

  it('accepts custom submitLabel', () => {
    const result = ForgotPasswordFormSchema.parse({
      onSubmit: action,
      submitLabel: 'Reset Password',
    })
    expect(result.submitLabel).toBe('Reset Password')
  })

  it('accepts id and testID', () => {
    const result = ForgotPasswordFormSchema.parse({
      onSubmit: action,
      id: 'forgot',
      testID: 'forgot-form',
    })
    expect(result.id).toBe('forgot')
  })
})
